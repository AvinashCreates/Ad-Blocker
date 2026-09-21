let hasTrackedCurrentAd = false;

function skipYouTubeAds() {
  const videoPlayer = document.querySelector('video');
  const moviePlayer = document.querySelector('.html5-video-player');
  
  // Check if an ad is actively playing
  if (moviePlayer && moviePlayer.classList.contains('ad-showing')) {
    
    // Send a message to the background script ONCE per ad
    if (!hasTrackedCurrentAd) {
      chrome.runtime.sendMessage({ action: "adBlocked" });
      hasTrackedCurrentAd = true;
    }

    // Fast-forward the ad instantly and mute it
    if (videoPlayer && isFinite(videoPlayer.duration)) {
      videoPlayer.muted = true;
      videoPlayer.playbackRate = 16.0; 
      videoPlayer.currentTime = videoPlayer.duration - 0.1;
    }
    
    // Auto-click the structural skip button
    const skipButtons = [
      '.ytp-skip-ad-button', 
      '.ytp-ad-skip-button', 
      '.ytp-ad-skip-button-modern'
    ];
    
    skipButtons.forEach(selector => {
      const button = document.querySelector(selector);
      if (button) button.click();
    });
  } else {
    // Reset tracking flag when the ad finishes and normal video resumes
    hasTrackedCurrentAd = false;
  }
  
  // Hide visual overlay/banner ads
  const adOverlays = document.querySelectorAll('.ytp-ad-overlay-container, #player-ads, ytd-ad-slot-renderer');
  adOverlays.forEach(ad => {
    ad.style.display = 'none';
  });
}

// Check for ads every 500ms
setInterval(skipYouTubeAds, 500);
