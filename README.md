# Brave-Style Ad Blocker (Chrome Extension)

A lightweight, performance-focused Google Chrome extension built on **Manifest V3** that mimics Brave Browser's native engine. It blocks malicious ad networks at the network layer and dynamically bypasses complex first-party video advertisements on platforms like YouTube.

---

## 🚀 Key Features

* **Network-Level Interception:** Uses the modern `chrome.declarativeNetRequest` API to block trackers and ad networks before web pages even load, saving user bandwidth.
* **YouTube Video Ad Bypass Engine:** A mutation-resilient content script that instantly fast-forwards, mutes, and auto-skips structural video advertisements seamlessly.
* **Live Analytical Dashboard:** A clean popup UI displaying key protection metrics updated in real-time using chrome local storage:
  * Total Ads Blocked
  * Approximate Bandwidth Saved (MB)
  * Estimated Browsing Time Saved (seconds)
* **Local Metrics Control:** Includes a state-clearing mechanism to reset internal statistical counters instantaneously.

---

## 🛠️ Architecture & Tech Stack

* **Frontend UI:** HTML5, CSS3 (Vanilla components designed for low memory footprint).
* **Core API Ecosystem:** Chrome Extension API (Manifest V3 Compliance).
  * `declarativeNetRequest` (High-performance declarative URL filtering).
  * `storage.local` (Asynchronous local data persistence).
  * `runtime.sendMessage` (Decoupled cross-script background communication).
* **Injected Automation:** JavaScript (DOM manipulation and structural injection loops).

---

## 📂 Project Structure

```text
Chrome-Extension-AdBlocker/
├── manifest.json      # Extension architecture & permission routing
├── rules.json         # Static declarative blocking rule configurations
├── background.js      # Decoupled backend service worker & message hub
├── content.js         # Isolated DOM manipulation script for YouTube
├── popup.html         # Live analytics user interface layout
├── popup.js           # UI data binding & interaction controller
└── icon.png           # 128x128 extension graphics asset
```

---

## ⚙️ Engineering Highlights (Interview Discussion Points)

### 1. Manifest V3 & Performance Efficiency
Unlike older extensions that relied on blocking web requests via blocking web request APIs—which slow down the main execution thread—this project strictly adheres to **Manifest V3 standards**. By offloading domain blocking to Chrome's native engine via `rules.json`, network performance is heavily optimized.

### 2. Solving First-Party Ad Hurdles (The YouTube Problem)
Because platforms serve advertisements from identical endpoints as their primary media streams (`*.googlevideo.com`), network blocking alone fails. This extension solves that hurdle through an isolated **Content Script** tracking system. It detects ad-display containers, forces playback speeds to maximum limits (16.0×), mutes audio, and triggers safe programmatic clicks on hidden skip elements within 500ms intervals.

### 3. Decoupled Message Passing
The background service worker acts as a centralized events highway. It listens synchronously for internal system hits from matching domain rules while maintaining an asynchronous runtime listener to process incoming skip events emitted by the custom content engine on active tabs.
