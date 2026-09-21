const els = {
  networkBlocking: document.getElementById("networkBlocking"),
  cosmeticFiltering: document.getElementById("cosmeticFiltering"),
  youtubeAdSkip: document.getElementById("youtubeAdSkip"),
  whitelistInput: document.getElementById("whitelistInput"),
  addWhitelist: document.getElementById("addWhitelist"),
  whitelistItems: document.getElementById("whitelistItems"),
  emptyState: document.getElementById("emptyState"),
  statsSummary: document.getElementById("statsSummary"),
  resetStats: document.getElementById("resetStats")
};

function normalizeHost(raw) {
  let v = raw.trim().toLowerCase();
  if (!v) return null;
  v = v.replace(/^https?:\/\//, "").split("/")[0];
  return v || null;
}

function renderWhitelist(list) {
  els.whitelistItems.innerHTML = "";
  els.emptyState.style.display = list.length ? "none" : "block";
  for (const host of list) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = host;
    const btn = document.createElement("button");
    btn.textContent = "Remove";
    btn.addEventListener("click", () => removeHost(host));
    li.appendChild(span);
    li.appendChild(btn);
    els.whitelistItems.appendChild(li);
  }
}

async function loadAll() {
  const s = await chrome.storage.local.get([
    "networkBlocking",
    "cosmeticFiltering",
    "youtubeAdSkip",
    "whitelist",
    "adsBlocked"
  ]);
  els.networkBlocking.checked = s.networkBlocking !== false;
  els.cosmeticFiltering.checked = s.cosmeticFiltering !== false;
  els.youtubeAdSkip.checked = s.youtubeAdSkip !== false;
  renderWhitelist(s.whitelist || []);
  els.statsSummary.textContent = `${s.adsBlocked || 0} ads blocked so far`;
}

function saveToggle(key, checked) {
  chrome.storage.local.set({ [key]: checked });
}

els.networkBlocking.addEventListener("change", (e) => saveToggle("networkBlocking", e.target.checked));
els.cosmeticFiltering.addEventListener("change", (e) => saveToggle("cosmeticFiltering", e.target.checked));
els.youtubeAdSkip.addEventListener("change", (e) => saveToggle("youtubeAdSkip", e.target.checked));

async function addHost() {
  const host = normalizeHost(els.whitelistInput.value);
  if (!host) return;
  const { whitelist = [] } = await chrome.storage.local.get(["whitelist"]);
  if (!whitelist.includes(host)) {
    whitelist.push(host);
    await chrome.storage.local.set({ whitelist });
    chrome.runtime.sendMessage({ action: "whitelistChanged" });
    renderWhitelist(whitelist);
  }
  els.whitelistInput.value = "";
}

async function removeHost(host) {
  const { whitelist = [] } = await chrome.storage.local.get(["whitelist"]);
  const next = whitelist.filter((h) => h !== host);
  await chrome.storage.local.set({ whitelist: next });
  chrome.runtime.sendMessage({ action: "whitelistChanged" });
  renderWhitelist(next);
}

els.addWhitelist.addEventListener("click", addHost);
els.whitelistInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addHost();
});

els.resetStats.addEventListener("click", async () => {
  await chrome.storage.local.set({ adsBlocked: 0, dataSaved: "0.00", timeSaved: "0.0" });
  els.statsSummary.textContent = "0 ads blocked so far";
});

loadAll();
