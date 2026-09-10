import { el, viewHeader } from '../lib/dom.js';
import { cameras, cameraStats } from '../data/cameras.js';
import {
  createMap,
  addCameraMarkers,
  addLegend,
  CAMERA_LEGEND_ROWS,
} from '../components/MapCanvas.js';

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

  const mapEl = el('div', 'map');
  view.append(mapEl);
  root.append(view);

  // Map must be constructed after the container is in the document so
  // Leaflet measures a real height.
  const { map, destroy } = createMap(mapEl);
  addCameraMarkers(map);
  addLegend(map, CAMERA_LEGEND_ROWS);

  return destroy;
}
