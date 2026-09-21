const hostLabel = document.getElementById("hostLabel");
const siteToggle = document.getElementById("siteToggle");
const statusLine = document.getElementById("statusLine");

let currentHost = null;

function render(stats, whitelist) {
  document.getElementById("adsBlocked").textContent = stats.adsBlocked || 0;
  document.getElementById("dataSaved").textContent = (stats.dataSaved || 0) + "";
  document.getElementById("timeSaved").textContent = (stats.timeSaved || 0) + "";

  if (currentHost) {
    hostLabel.textContent = currentHost;
    const isWhitelisted = (whitelist || []).includes(currentHost);
    siteToggle.textContent = isWhitelisted ? "Disabled" : "Enabled";
    siteToggle.className = "toggle-btn " + (isWhitelisted ? "off" : "on");
    statusLine.textContent = isWhitelisted
      ? "Paused on this site"
      : "Protecting this browser";
  } else {
    hostLabel.textContent = "this page";
    siteToggle.style.display = "none";
  }
}

async function refresh() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    try {
      currentHost = new URL(tab.url).hostname || null;
    } catch {
      currentHost = null;
    }
  }
  chrome.storage.local.get(
    ["adsBlocked", "dataSaved", "timeSaved", "whitelist"],
    (s) => render(s, s.whitelist)
  );
}

siteToggle.addEventListener("click", async () => {
  if (!currentHost) return;
  const { whitelist = [] } = await chrome.storage.local.get(["whitelist"]);
  const idx = whitelist.indexOf(currentHost);
  if (idx === -1) {
    whitelist.push(currentHost);
  } else {
    whitelist.splice(idx, 1);
  }
  await chrome.storage.local.set({ whitelist });
  chrome.runtime.sendMessage({ action: "whitelistChanged" });
  refresh();
  // Reload the tab so the change takes effect immediately.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) chrome.tabs.reload(tab.id);
});

document.getElementById("resetStats").addEventListener("click", async () => {
  await chrome.storage.local.set({ adsBlocked: 0, dataSaved: "0.00", timeSaved: "0.0" });
  refresh();
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

refresh();
