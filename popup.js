function updateUI() {
  chrome.storage.local.get(["adsBlocked", "dataSaved", "timeSaved"], (result) => {
    document.getElementById("ads").innerText = result.adsBlocked || 0;
    document.getElementById("data").innerText = (result.dataSaved || 0) + " MB";
    document.getElementById("time").innerText = (result.timeSaved || 0) + "s";
  });
}

// Clear statistics from storage and refresh the UI view immediately
function resetStats() {
  chrome.storage.local.set({
    adsBlocked: 0,
    dataSaved: "0.00",
    timeSaved: "0.0"
  }, () => {
    updateUI();
  });
}

// Setup listeners when popup elements load
document.addEventListener("DOMContentLoaded", () => {
  updateUI();
  document.getElementById("reset").addEventListener("click", resetStats);
});
