// Runs on every page (except YouTube, which has its own script).
// Hides known ad-container elements via injected CSS, and keeps watching
// the DOM for ones that get added dynamically after page load.

(function () {
  const HIDE_SELECTORS = [
    "ins.adsbygoogle",
    "div[id^='google_ads_']",
    "div[id^='div-gpt-ad']",
    "iframe[id^='google_ads_iframe']",
    "iframe[src*='doubleclick.net']",
    "iframe[src*='googlesyndication.com']",
    ".adsbygoogle",
    "[class='ad']",
    "[class='ads']",
    "[class='advert']",
    "[class^='ad-banner']",
    "[class^='ad-container']",
    "[class^='ad-slot']",
    "[class^='ads-container']",
    "[id^='ad-container']",
    "[id^='ad-slot']",
    "[id='taboola-']",
    "[class*='taboola']",
    "[class*='outbrain']",
    "[class*='mgid-widget']",
    "ins.native-ads",
    "div[data-ad-slot]",
    "div[data-ad-client]",
    ".sponsored-content-wrapper",
    ".sponsored-post",
    "[aria-label='Advertisement']",
    "[aria-label='Sponsored']"
  ];

  let enabled = true;
  let whitelisted = false;
  let styleEl = null;

  function injectStyle() {
    if (styleEl || !enabled || whitelisted) return;
    styleEl = document.createElement("style");
    styleEl.id = "__adblock_cosmetic_style__";
    styleEl.textContent =
      HIDE_SELECTORS.join(", ") +
      " { display: none !important; visibility: hidden !important; height: 0 !important; }";
    (document.head || document.documentElement).appendChild(styleEl);
  }

  function removeStyle() {
    if (styleEl) {
      styleEl.remove();
      styleEl = null;
    }
  }

  let reportedCount = 0;
  function reportNewlyHidden() {
    // Rough count of currently-matched elements, reported once so the
    // popup's "ads blocked" stat also reflects cosmetic hides.
    let found = 0;
    for (const sel of HIDE_SELECTORS) {
      try {
        found += document.querySelectorAll(sel).length;
      } catch {
        /* invalid selector safety */
      }
    }
    if (found > reportedCount) {
      const delta = found - reportedCount;
      reportedCount = found;
      for (let i = 0; i < delta; i++) {
        chrome.runtime.sendMessage({ action: "adBlocked" }).catch(() => {});
      }
    }
  }

  function currentHostname() {
    return location.hostname;
  }

  function applySettings(settings) {
    enabled = settings.cosmeticFiltering !== false;
    whitelisted = (settings.whitelist || []).includes(currentHostname());
    if (enabled && !whitelisted) {
      injectStyle();
    } else {
      removeStyle();
    }
  }

  chrome.storage.local.get(
    ["cosmeticFiltering", "whitelist"],
    (settings) => {
      applySettings(settings);
      if (enabled && !whitelisted) {
        const observer = new MutationObserver(() => reportNewlyHidden());
        observer.observe(document.documentElement, { childList: true, subtree: true });
        // Also do an initial pass once the DOM is ready.
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", reportNewlyHidden, { once: true });
        } else {
          reportNewlyHidden();
        }
      }
    }
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.cosmeticFiltering || changes.whitelist) {
      chrome.storage.local.get(["cosmeticFiltering", "whitelist"], applySettings);
    }
  });
})();
