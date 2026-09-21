// Reusable helper function to update and calculate dashboard statistics
function incrementMetrics() {
  chrome.storage.local.get(["adsBlocked"], (result) => {
    let count = result.adsBlocked || 0;
    count++;
    
    // Formulate approximate metric values
    let dataSaved = (count * 50) / 1024; // ~50KB per ad in MB
    let timeSaved = count * 0.05;       // ~0.05s per ad in seconds

    chrome.storage.local.set({
      adsBlocked: count,
      dataSaved: dataSaved.toFixed(2),
      timeSaved: timeSaved.toFixed(1)
    });
  });
}

// 1. Listen for network rules matching web ad domains
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener((info) => {
  incrementMetrics();
});

// 2. Listen for messages sent from content.js when skipping YouTube ads
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "adBlocked") {
    incrementMetrics();
  }
});
