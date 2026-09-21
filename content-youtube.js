// Detects YouTube's in-player ad state via MutationObserver (instead of
// polling on a fixed interval) and fast-forwards / mutes / auto-clicks
// "Skip Ad" the moment it becomes clickable.

(function () {
  let enabled = true;
  let whitelisted = false;

  chrome.storage.local.get(["youtubeAdSkip", "whitelist"], (settings) => {
    enabled = settings.youtubeAdSkip !== false;
    whitelisted = (settings.whitelist || []).includes(location.hostname);
    if (enabled && !whitelisted) start();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.youtubeAdSkip) enabled = changes.youtubeAdSkip.newValue !== false;
    if (changes.whitelist) {
      whitelisted = (changes.whitelist.newValue || []).includes(location.hostname);
    }
  });

  function reportSkip() {
    chrome.runtime.sendMessage({ action: "adBlocked" }).catch(() => {});
  }

  function handleAdState() {
    if (!enabled || whitelisted) return;

    const player = document.querySelector(".html5-video-player");
    if (!player) return;

    const isAdShowing = player.classList.contains("ad-showing") ||
      player.classList.contains("ad-interrupting");

    const video = document.querySelector("video.html5-main-video");

    if (isAdShowing) {
      // Mute + jump to end so the ad finishes (or the skip button appears)
      // as fast as possible.
      if (video && !video.muted) {
        video.muted = true;
        video.dataset.__adblockUnmute = "pending";
      }
      if (video && Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
      }

      const skipSelectors = [
        ".ytp-ad-skip-button",
        ".ytp-ad-skip-button-modern",
        ".ytp-skip-ad-button",
        "button.ytp-ad-skip-button-slot"
      ];
      for (const sel of skipSelectors) {
        const btn = document.querySelector(sel);
        if (btn) {
          btn.click();
          reportSkip();
          break;
        }
      }

      // Auto-close overlay ads (banner/companion ads on the player itself).
      const overlayClose = document.querySelector(".ytp-ad-overlay-close-button");
      if (overlayClose) overlayClose.click();
    } else if (video && video.muted && video.dataset.__adblockUnmute === "pending") {
      // Restore sound once the ad has actually cleared.
      video.muted = false;
      delete video.dataset.__adblockUnmute;
    }
  }

  function start() {
    // React instantly to player state / DOM changes...
    const observer = new MutationObserver(handleAdState);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["class"]
    });

    // ...plus a light-weight safety-net poll (2s) in case YouTube changes
    // its markup in a way the observer misses. Much cheaper than the old
    // 500ms interval.
    setInterval(handleAdState, 2000);

    handleAdState();
  }
})();
