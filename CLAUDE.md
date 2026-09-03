# Muvmi App Revamp — Mobile Web Prototype

## Project Overview
Static mobile web prototype for the Muvmi app revamp, hosted on GitHub Pages.
Multi-session architecture: each flow (Home, Search, Request, etc.) is a separate page.

## Tech Stack
- Vanilla HTML / CSS / JS (no frameworks)
- GitHub Pages static hosting
- localStorage for state
- Fake API layer (`js/api.js`)

## Key Patterns (from MOBILE-WEBAPP-PATTERNS.md)
- **Viewport:** 393px wide centered container, no phone frame
- **Scroll:** `min-height: 0` on flex parents + children, hidden scrollbars
- **Drag:** `makeDraggable()` on all scrollable containers
- **Overflow:** Every list that can exceed its container MUST scroll
- **Images:** Global `user-drag: none` to prevent drag-out
- **No hover:** Use `:active` only, no `:hover` styles
- **Proto Console:** `proto-console.js` on every page, z-index override in global.css
- **PWA:** fullscreen display, service worker caching

## Project Structure
```
├── index.html              → Homepage (default entry)
├── proto-console.js        → Shared proto console (from template)
├── css/
│   └── global.css          → Viewport container, reset, shared styles
├── js/
│   ├── app.js              → Shared init
│   ├── api.js              → Fake API / mock data
│   └── utils.js            → makeDraggable, helpers
├── pages/
│   ├── home/               → Homepage session
│   │   ├── home.css
│   │   └── home.js
│   ├── search/             → Search flow (future)
│   └── request/            → Request flow (future)
├── assets/
│   ├── icons/
│   └── images/
├── manifest.json
└── service-worker.js
```

## Conventions
- Each session lives in `pages/<session>/` with its own CSS and JS
- Shared styles go in `css/global.css`
- All colors, spacing, typography defined as CSS custom properties in `:root`
- Page-specific CSS loaded after global.css
- No `:hover` — use `:active` for tap feedback
- Every scrollable container must have `makeDraggable()` applied
- Every page must include `proto-console.js` with page-specific CONSOLE_PAGE and console HTML

## Interactive Maps
When any page requires a map, use **Leaflet.js + CartoDB Voyager** tiles:
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<!-- load after page scripts -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```
```javascript
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
}).addTo(map);
```
- No API key required, works on GitHub Pages static hosting
- Always disable default controls: `zoomControl: false, attributionControl: false`
- Add `isolation: isolate` to the map container so Leaflet's internal z-indexes don't bleed into sibling elements
