import { AD_DOMAINS } from "./domains.js";

const DEFAULT_SETTINGS = {
  networkBlocking: true,
  cosmeticFiltering: true,
  youtubeAdSkip: true,
  whitelist: []
};

// -------------------- Setup --------------------
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS));
  const patch = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (stored[key] === undefined) patch[key] = DEFAULT_SETTINGS[key];
  }
  if (Object.keys(patch).length) await chrome.storage.local.set(patch);
  await rebuildSessionAllowRules();
});

// -------------------- Metrics --------------------
function incrementMetrics() {
  chrome.storage.local.get(["adsBlocked"], (result) => {
    const count = (result.adsBlocked || 0) + 1;
    const dataSaved = (count * 50) / 1024; // ~50KB per blocked ad request, in MB
    const timeSaved = count * 0.05; // ~0.05s per blocked ad, in seconds
    chrome.storage.local.set({
      adsBlocked: count,
      dataSaved: dataSaved.toFixed(2),
      timeSaved: timeSaved.toFixed(1)
    });
  });
  bumpBadge();
}

let badgeCount = 0;
let badgeFlushTimer = null;
function bumpBadge() {
  badgeCount++;
  if (badgeFlushTimer) return;
  badgeFlushTimer = setTimeout(() => {
    chrome.action.setBadgeText({ text: badgeCount > 999 ? "999+" : String(badgeCount) });
    chrome.action.setBadgeBackgroundColor({ color: "#ff4500" });
    badgeCount = 0;
    badgeFlushTimer = null;
  }, 800);
}

// Build a quick hostname matcher from the shared domain list.
function hostMatchesAdDomain(hostname) {
  for (const domain of AD_DOMAINS) {
    if (hostname === domain || hostname.endsWith("." + domain)) return true;
  }
  return false;
}

// chrome.declarativeNetRequest.onRuleMatchedDebug only fires for UNPACKED/dev
// installs, not published extensions, so it can't be relied on for real stats.
// Instead we observe requests (non-blocking) and count ones that hit our list;
// actual blocking is still done entirely by the declarativeNetRequest ruleset.
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const hostname = new URL(details.url).hostname;
      if (hostMatchesAdDomain(hostname)) {
        chrome.storage.local.get(["networkBlocking", "whitelist"], (s) => {
          if (s.networkBlocking === false) return;
          const tabHost = details.initiator ? safeHostname(details.initiator) : null;
          if (tabHost && (s.whitelist || []).includes(tabHost)) return;
          incrementMetrics();
        });
      }
    } catch (e) {
      // ignore malformed URLs
    }
  },
  { urls: ["<all_urls>"] }
);

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

// -------------------- Messages from content scripts / popup / options --------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "adBlocked") {
    incrementMetrics();
  } else if (message.action === "getSettings") {
    chrome.storage.local.get(Object.keys(DEFAULT_SETTINGS), (s) => sendResponse(s));
    return true; // async response
  } else if (message.action === "whitelistChanged") {
    rebuildSessionAllowRules().then(() => sendResponse({ ok: true }));
    return true;
  }
});

// -------------------- Per-site whitelist via session rules --------------------
// When a site is whitelisted, add a high-priority "allow" declarativeNetRequest
// session rule scoped to that domain so network blocking is skipped there,
// without needing to touch the static ruleset.
async function rebuildSessionAllowRules() {
  const { whitelist = [] } = await chrome.storage.local.get(["whitelist"]);
  const existing = await chrome.declarativeNetRequest.getSessionRules();
  const removeRuleIds = existing.map((r) => r.id);

  const addRules = whitelist.map((domain, i) => ({
    id: 10000 + i,
    priority: 100,
    action: { type: "allow" },
    condition: {
      requestDomains: [domain]
    }
  }));

  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds,
    addRules
  });
}
