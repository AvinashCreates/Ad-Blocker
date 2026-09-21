# Ad Blocker v2.0

A from-scratch rebuild of the original extension, fixing the invalid-manifest
bug and closing the gaps that kept it from being a real ad blocker.

## What it does

- **Network-level blocking** — `rules.json` ships ~90 known ad/tracker
  domains (Google's ad stack, DoubleClick, Taboola/Outbrain, Criteo,
  Rubicon/PubMatic/OpenX, DoubleVerify, social trackers, etc.) plus common
  ad-path patterns, all enforced natively via `declarativeNetRequest` — no
  network round-trip through the extension needed.
- **Cosmetic filtering** — a content script hides leftover ad containers
  (empty boxes, `ins.adsbygoogle`, `div[id^="div-gpt-ad"]`, Taboola/Outbrain
  widgets, etc.) so pages don't show blank ad-shaped gaps, and keeps
  watching the DOM via `MutationObserver` for ones injected after load.
- **YouTube ad skip** — reacts instantly to the player's `ad-showing` class
  via `MutationObserver` (instead of polling every 500ms), mutes, jumps to
  the end of the ad, and auto-clicks "Skip Ad" the moment it's clickable.
  A 2s safety-net poll covers cases where YouTube's markup shifts.
- **Per-site whitelist** — toggle protection off for the current site from
  the popup (or manage the list from the options page). This adds a
  high-priority `declarativeNetRequest` session "allow" rule for that
  domain, so network blocking, cosmetic filtering, and YouTube skip all
  respect it.
- **Live stats** — ads blocked, estimated MB saved, estimated seconds
  saved, shown in the popup and badge. Counted via an observational
  (non-blocking) `webRequest` listener, which — unlike
  `onRuleMatchedDebug` — actually works once the extension is packed and
  published, not just when loaded unpacked for development.
- **Options page** — independent toggles for network blocking, cosmetic
  filtering, and YouTube ad skip, plus whitelist management.

## Load it

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → select this folder.
3. Pin the toolbar icon to see live stats.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest |
| `rules.json` | Static `declarativeNetRequest` block rules |
| `domains.js` | Domain list shared by the rule generator and `background.js`'s stats matcher |
| `background.js` | Service worker: stats, whitelist session rules |
| `content-cosmetic.js` | Hides leftover ad containers on all non-YouTube sites |
| `content-youtube.js` | YouTube-specific ad skip |
| `popup.html` / `popup.js` | Toolbar popup: stats + per-site toggle |
| `options.html` / `options.js` | Settings page |
| `gen_rules.py` | Script used to (re)generate `rules.json` / `domains.js` from the domain list |

## Known limits (be upfront about these)

- ~90 domains is solid coverage of the biggest ad networks, but it's not
  EasyList's tens of thousands of entries — some smaller/regional ad
  networks will slip through.
- Cosmetic selectors are generic; a handful of sites with unusual class
  names for ad slots may still show empty containers.
- YouTube changes its player markup periodically; the skip-button selector
  list may need occasional updates if YouTube renames classes again.
