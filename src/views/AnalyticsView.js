import { el, viewHeader } from '../lib/dom.js';
import { zones, busiestCorridors, ZONE_THRESHOLDS } from '../data/zones.js';
import { summaryStats } from '../data/stats.js';
import { statRow } from '../components/StatCard.js';
import {
  createMap,
  addCameraMarkers,
  addZones,
  addLegend,
  cameraMarkerHtml,
  zoneSwatchHtml,
} from '../components/MapCanvas.js';

const LEGEND_ROWS = [
  {
    mark: zoneSwatchHtml('high'),
    label: `Congested (>${ZONE_THRESHOLDS.high}%)`,
  },
  {
    mark: zoneSwatchHtml('moderate'),
    label: `Moderate (${ZONE_THRESHOLDS.moderate}–${ZONE_THRESHOLDS.high}%)`,
  },
  {
    mark: zoneSwatchHtml('clear'),
    label: `Clear (<${ZONE_THRESHOLDS.moderate}%)`,
  },
  { mark: cameraMarkerHtml('online'), label: 'Camera online' },
];

function corridorTable() {
  const table = el('table', 'table');

  const thead = el('thead');
  const hrow = el('tr');
  const rank = el('th', 'table__rank', '#');
  const name = el('th', null, 'Corridor');
  const pct = el('th', 'table__num', 'Congestion');
  hrow.append(rank, name, pct);
  thead.append(hrow);

  const tbody = el('tbody');
  busiestCorridors.forEach((zone, i) => {
    const row = el('tr');
    row.append(
      el('td', 'table__rank mono', String(i + 1)),
      el('td', null, zone.name),
      el('td', 'table__num', `${zone.congestion}%`)
    );
    tbody.append(row);
  });

  table.append(thead, tbody);
  return table;
}

export function render(root) {
  const view = el('div', 'view');

  const window_ = el('div', 'view__meta');
  const item = el('div', 'view__meta-item');
  item.append(
    el('span', 'view__meta-label', 'Window'),
    el('span', 'view__meta-value', 'Today · rolling 60 min')
  );
  window_.append(item);

  view.append(
    viewHeader(
      'Traffic Analytics',
      'Congestion distribution and corridor load across the network',
      window_
    )
  );

  view.append(statRow(summaryStats));

  const layout = el('div', 'analytics-layout');
  const mapEl = el('div', 'map');

  const panel = el('aside', 'panel');
  const head = el('div', 'panel__header');
  head.append(
    el('div', 'panel__title', 'Busiest corridors'),
    el('div', 'panel__note', `${zones.length} zones monitored`)
  );
  const body = el('div', 'panel__body');
  body.append(corridorTable());
  panel.append(head, body);

  layout.append(mapEl, panel);
  view.append(layout);
  root.append(view);

  const { map, destroy } = createMap(mapEl);
  addZones(map, zones, { fit: true });
  addCameraMarkers(map);
  addLegend(map, LEGEND_ROWS);

  return destroy;
}
