import { el, viewHeader } from '../lib/dom.js';
import { cameras, cameraStats } from '../data/cameras.js';
import {
  createMap,
  addCameraMarkers,
  addLegend,
  addTacticalOverlays,
  CAMERA_LEGEND_ROWS,
} from '../components/MapCanvas.js';

function buildTacticalChrome(container, map, { setBaseMap, tacticalOverlays }) {
  const chrome = el('div', 'tactical-ui');
  chrome.innerHTML = `
    <div class="tactical-hud tactical-hud--top-left">
      <div class="tactical-hud__eyebrow"><span class="tactical-live-dot"></span> GOD'S EYE / SENSOR GRID</div>
      <div class="tactical-hud__title">DELHI / NCR</div>
      <div class="tactical-hud__subline">ANPR NETWORK · SECTOR 01 · ${cameraStats.total} NODES</div>
    </div>
    <div class="tactical-hud tactical-hud--top-right">
      <div class="tactical-hud__metric"><span>LINK</span><strong>SECURE</strong></div>
      <div class="tactical-hud__metric"><span>UPLINK</span><strong>LIVE</strong></div>
      <div class="tactical-hud__metric"><span>MODE</span><strong>SAT / ORBIT</strong></div>
    </div>
    <div class="tactical-reticle" aria-hidden="true"><span></span><i></i></div>
    <div class="tactical-hud tactical-hud--bottom-left">
      <div class="tactical-hud__eyebrow">BASEMAP</div>
      <div class="tactical-switcher" role="group" aria-label="Basemap selection">
        <button type="button" data-base="satellite" class="is-active">SAT</button>
        <button type="button" data-base="street">ROAD</button>
      </div>
      <div class="tactical-hud__coordinates" data-tactical-coordinates></div>
    </div>
    <div class="tactical-hud tactical-hud--bottom-right">
      <div class="tactical-hud__eyebrow">DISPLAY LAYERS</div>
      <button type="button" class="tactical-layer-toggle is-active" data-coverage-toggle aria-pressed="true">
        <span class="tactical-layer-toggle__icon"></span> SENSOR COVERAGE
      </button>
      <div class="tactical-hud__readout"><span>ZOOM</span><strong data-tactical-zoom></strong></div>
      <div class="tactical-hud__readout"><span>UTC</span><strong data-tactical-clock></strong></div>
    </div>
    <div class="tactical-scan-label">SCANNING DELHI GRID <span>●</span></div>
  `;

  const switcher = chrome.querySelector('.tactical-switcher');
  switcher.addEventListener('click', (event) => {
    const button = event.target.closest('[data-base]');
    if (!button) return;
    setBaseMap(button.dataset.base);
    switcher.querySelectorAll('button').forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });
  });

  const coverageToggle = chrome.querySelector('[data-coverage-toggle]');
  coverageToggle.addEventListener('click', () => {
    const visible = !coverageToggle.classList.contains('is-active');
    tacticalOverlays.setVisible(visible);
    coverageToggle.classList.toggle('is-active', visible);
    coverageToggle.setAttribute('aria-pressed', String(visible));
  });

  const coordinateReadout = chrome.querySelector('[data-tactical-coordinates]');
  const zoomReadout = chrome.querySelector('[data-tactical-zoom]');
  const clockReadout = chrome.querySelector('[data-tactical-clock]');

  function syncReadouts() {
    const center = map.getCenter();
    coordinateReadout.textContent = `${center.lat.toFixed(4)}° N · ${center.lng.toFixed(4)}° E`;
    zoomReadout.textContent = map.getZoom().toFixed(1);
    clockReadout.textContent = new Date().toISOString().slice(11, 19);
  }

  map.on('moveend zoomend', syncReadouts);
  const clock = setInterval(syncReadouts, 1000);
  syncReadouts();
  container.append(chrome);

  return () => {
    clearInterval(clock);
    map.off('moveend zoomend', syncReadouts);
    chrome.remove();
  };
}

function headerAside() {
  const aside = el('div', 'view__meta');
  const districts = new Set(cameras.map((c) => c.district)).size;

  const pairs = [
    ['Cameras', `${cameraStats.online} / ${cameraStats.total}`],
    ['Districts', String(districts)],
  ];

  for (const [label, value] of pairs) {
    const item = el('div', 'view__meta-item');
    item.append(
      el('span', 'view__meta-label', label),
      el('span', 'view__meta-value', value)
    );
    aside.append(item);
  }
  return aside;
}

export function render(root) {
  const view = el('div', 'view');
  view.append(
    viewHeader(
      'Live Map',
      'ANPR camera network status across the Delhi grid',
      headerAside()
    )
  );

  const mapEl = el('div', 'map map--tactical');
  view.append(mapEl);
  root.append(view);

  // Map must be constructed after the container is in the document so
  // Leaflet measures a real height.
  const { map, destroy, setBaseMap } = createMap(mapEl, { baseLayer: 'satellite' });
  const tacticalOverlays = addTacticalOverlays(map, cameras);
  addCameraMarkers(map);
  addLegend(map, CAMERA_LEGEND_ROWS);
  const destroyChrome = buildTacticalChrome(mapEl, map, {
    setBaseMap,
    tacticalOverlays,
  });

  return () => {
    destroyChrome();
    tacticalOverlays.destroy();
    destroy();
  };
}
