import { el, viewHeader } from '../lib/dom.js';
import { cameras, cameraStats } from '../data/cameras.js';
import { createGlobe } from '../components/GlobeCanvas.js';
import { createMap, addCameraMarkers, addLegend, CAMERA_LEGEND_ROWS } from '../components/MapCanvas.js';

export function render(root) {
  const view = el('div', 'view globe-view');
  view.append(viewHeader('Live Map', 'Delhi / NCR · Spatial intelligence', el('span', 'demo-badge', 'DEMO DATA')));
  const workspace = el('div', 'globe-workspace');
  const stage = el('div', 'globe-stage');
  const canvas = el('div', 'globe-canvas');
  canvas.setAttribute('aria-label', 'Interactive 3D globe of the Delhi camera network');
  const toolbar = el('div', 'globe-toolbar');
  toolbar.setAttribute('aria-label', 'Map controls');
  const banner = el('div', 'globe-banner');
  banner.innerHTML = '<span class="globe-kicker">GOD’S EYE VIEW</span><strong>DELHI <span>/ NCR</span></strong><small>28.6139° N · 77.2090° E</small>';
  const status = el('div', 'globe-status', 'Preparing 3D view…');
  status.setAttribute('role', 'status');
  const readout = el('div', 'globe-readout');
  const help = el('div', 'globe-help', 'Drag to pan · Scroll to zoom · Ctrl + drag to tilt / rotate');
  const aside = el('aside', 'globe-sidebar');
  aside.innerHTML = `<div class="globe-sidebar__head"><span class="globe-kicker">CAMERA NETWORK</span><h2>${cameraStats.online}<span> / ${cameraStats.total} online</span></h2><p>Demo registry · ${new Set(cameras.map(c => c.district)).size} districts</p></div>`;
  const list = el('div', 'globe-camera-list');
  const details = el('div', 'globe-details');
  details.setAttribute('aria-live', 'polite');
  details.append(el('p', 'muted', 'Select a camera to inspect its location and registry details.'));
  aside.append(list, details);
  stage.append(canvas, banner, toolbar, status, readout, help);
  workspace.append(stage, aside); view.append(workspace); root.append(view);
  let disposed = false, globe, fallback;
  const buttons = new Map(), cameraButtons = new Map();
  function button(label, action, toggle = false) {
    const b = el('button', 'globe-button', label); b.type = 'button'; b.disabled = true;
    if (toggle) b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', action); toolbar.append(b); buttons.set(label, b); return b;
  }
  const press = (label, value) => buttons.get(label)?.setAttribute('aria-pressed', String(value));
  const source = el('select', 'globe-select'); source.setAttribute('aria-label', 'Map source');
  for (const [value, text] of [['satellite', 'Satellite'], ['street', 'Street'], ['photoreal', 'Photorealistic 3D']]) {
    const option = el('option', null, text); option.value = value;
    if (value === 'photoreal' && !import.meta.env.VITE_CESIUM_ION_TOKEN && !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      option.disabled = true; option.textContent += ' · token required';
    }
    source.append(option);
  }
  source.disabled = true;
  source.addEventListener('change', () => globe?.setSource(source.value)); toolbar.append(source);
  button('Delhi', () => globe?.home()); button('Globe', () => globe?.world());
  button('Top down', () => globe?.topDown()); button('Orbit', () => globe?.toggleOrbit(), true);
  button('−', () => globe?.zoom(-1)).setAttribute('aria-label', 'Zoom out');
  button('+', () => globe?.zoom(1)).setAttribute('aria-label', 'Zoom in');
  let labels = true, night = false;
  button('Labels', () => { labels = !labels; globe?.labels(labels); press('Labels', labels); }, true); press('Labels', true);
  button('Night look', () => { night = !night; globe?.night(night); press('Night look', night); }, true);
  let coverage = true;
  button('Coverage*', () => { coverage = !coverage; globe?.coverage(coverage); press('Coverage*', coverage); }, true);
  press('Coverage*', true);
  buttons.get('Coverage*').title = 'Illustrative 190 m radius, not measured camera coverage';
  aside.append(el('p', 'globe-coverage-note', '* Coverage rings are illustrative, not measured. Night look is a visual filter.'));
  function select(cam, fly = true) {
    cameraButtons.forEach((b, id) => b.setAttribute('aria-pressed', String(id === cam.id)));
    details.replaceChildren(el('span', 'globe-kicker', 'SELECTED CAMERA'), el('h3', null, cam.name));
    aside.insertBefore(details, list);
    for (const [name, value] of [['Camera', cam.id], ['Feed', cam.feedId], ['District', cam.district], ['Corridor', cam.corridor], ['Lanes', cam.lanes], ['Status (demo)', cam.status]]) {
      const row = el('div', 'globe-detail-row'); row.append(el('span', null, name), el('strong', null, value)); details.append(row);
    }
    if (fly) globe?.select(cam);
    if (fallback && fly) fallback.map.flyTo([cam.lat, cam.lng], 15);
  }
  for (const cam of cameras) {
    const b = el('button', 'globe-camera'); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="globe-camera__dot ${cam.status === 'offline' ? 'is-offline' : ''}"></span><span><strong>${cam.name}</strong><small>${cam.id} · ${cam.district} · ${cam.status}</small></span><span aria-hidden="true">↗</span>`;
    b.addEventListener('click', () => select(cam)); list.append(b); cameraButtons.set(cam.id, b);
  }
  const fallbackButton = el('button', 'globe-button', 'Use 2D map'); fallbackButton.type = 'button';
  fallbackButton.addEventListener('click', () => {
    if (fallback || disposed) return;
    globe?.destroy(); globe = null; canvas.replaceChildren(); canvas.classList.add('map');
    fallback = createMap(canvas, { baseLayer: 'street' });
    addCameraMarkers(fallback.map, { onSelect: cam => select(cam, false) }); addLegend(fallback.map, CAMERA_LEGEND_ROWS);
    toolbar.hidden = true; banner.hidden = true;
    readout.textContent = '2D FALLBACK · DEMO CAMERA DATA'; status.textContent = 'Street map · Reload this view to retry 3D';
    help.textContent = 'Drag to pan · Scroll to zoom'; fallbackButton.remove();
  });
  aside.append(fallbackButton);
  createGlobe(canvas, {
    onSelect: cam => select(cam, false),
    onStatus: message => { if (!disposed && !fallback) status.textContent = message; },
    onSource: value => { source.value = value; }, onOrbit: value => press('Orbit', value),
    onReadout: text => { readout.textContent = text; },
  }).then(instance => {
    if (disposed || fallback) { instance.destroy(); return; }
    globe = instance; buttons.forEach(b => { b.disabled = false; }); source.disabled = false;
  }).catch(() => {
    if (!disposed && !fallback) status.textContent = '3D could not start on this device. Use the 2D map below the camera list.';
  });
  return () => { disposed = true; globe?.destroy(); fallback?.destroy(); };
}
