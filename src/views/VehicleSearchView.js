import { el, viewHeader } from '../lib/dom.js';
import {
  lookupTrajectory,
  normalisePlate,
  seededPlates,
} from '../data/trajectories.js';
import {
  createMap,
  addCameraMarkers,
  addLegend,
  addRoute,
  CAMERA_LEGEND_ROWS,
  seqMarkerHtml,
} from '../components/MapCanvas.js';
import { buildTimeline } from '../components/Timeline.js';
import { parseTimestamp, timeOf, formatDuration, prefersReducedMotion } from '../lib/format.js';

const LEGEND_ROWS = [
  ...CAMERA_LEGEND_ROWS,
  { mark: seqMarkerHtml('1', false), label: 'Trajectory stop' },
  { mark: seqMarkerHtml('4', true), label: 'Last recorded sighting' },
];

function buildSearchBar({ onSubmit }) {
  const form = el('form', 'searchbar');
  form.setAttribute('role', 'search');

  const field = el('div', 'searchbar__field');
  const label = el('label', 'searchbar__label', 'Plate number');
  label.htmlFor = 'plate-input';

  const input = el('input', 'input searchbar__input');
  input.id = 'plate-input';
  input.type = 'text';
  input.placeholder = 'e.g. DL01AB1234';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.maxLength = 16;

  field.append(label, input);

  const submit = el('button', 'btn', 'Search');
  submit.type = 'submit';

  const recent = el('div', 'searchbar__recent');
  recent.append(el('span', 'searchbar__recent-label', 'Recent queries'));
  for (const plate of seededPlates) {
    const chip = el('button', 'chip mono', plate);
    chip.type = 'button';
    chip.addEventListener('click', () => {
      input.value = plate;
      onSubmit(plate);
    });
    recent.append(chip);
  }

  form.append(field, submit, recent);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    onSubmit(input.value);
  });

  // Implicit submission is unreliable across embedded/kiosk browsers, and
  // Enter is the primary path for an operator. preventDefault here stops
  // the native submit, so this never double-fires with the handler above.
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit(input.value);
    }
  });

  return { form, input };
}

function summaryNode(record) {
  const stops = record.stops;
  const span =
    parseTimestamp(stops[stops.length - 1].timestamp) -
    parseTimestamp(stops[0].timestamp);

  const box = el('div', 'summary');

  const head = el('div', 'summary__head');
  head.append(el('span', 'summary__plate mono', record.plate));
  if (record.watchlisted) {
    head.append(el('span', 'summary__flag', 'Watchlisted'));
  }
  box.append(head);
  box.append(el('div', 'summary__vehicle', record.vehicle));
  box.append(el('div', 'summary__owner', record.registeredTo));

  const grid = el('div', 'summary__grid');
  const pairs = [
    ['Sightings', String(stops.length)],
    ['Window', formatDuration(span)],
    ['First', timeOf(stops[0].timestamp)],
    ['Last', timeOf(stops[stops.length - 1].timestamp)],
  ];
  for (const [k, v] of pairs) {
    const cell = el('div', 'summary__cell');
    cell.append(el('span', 'summary__cell-label', k), el('span', 'summary__cell-value mono', v));
    grid.append(cell);
  }
  box.append(grid);
  return box;
}

export function render(root) {
  const view = el('div', 'view');
  view.append(
    viewHeader(
      'Vehicle Search',
      'Reconstruct a vehicle trajectory from ANPR sightings'
    )
  );

  let routeLayer = null;
  let cameraLayer = null;

  const { form, input } = buildSearchBar({ onSubmit: runSearch });
  view.append(form);

  const layout = el('div', 'search-layout');
  const mapEl = el('div', 'map');

  const panel = el('aside', 'panel');
  const panelHead = el('div', 'panel__header');
  const panelTitle = el('div', 'panel__title', 'Trajectory');
  const panelNote = el('div', 'panel__note', '');
  panelHead.append(panelTitle, panelNote);

  const panelBody = el('div', 'panel__body');
  // Result changes are announced for assistive tech.
  panelBody.setAttribute('role', 'status');
  panelBody.setAttribute('aria-live', 'polite');

  panel.append(panelHead, panelBody);
  layout.append(mapEl, panel);
  view.append(layout);
  root.append(view);

  const { map, destroy } = createMap(mapEl);
  addLegend(map, LEGEND_ROWS);

  function drawCameras(exclude) {
    if (cameraLayer) map.removeLayer(cameraLayer);
    cameraLayer = addCameraMarkers(map, { exclude });
  }

  function clearRoute() {
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
  }

  function showIdle() {
    panelNote.textContent = '';
    panelBody.replaceChildren(
      el(
        'div',
        'empty',
        'Enter a plate number to reconstruct its recorded trajectory.'
      )
    );
  }

  function showNotFound(plate) {
    panelNote.textContent = '';
    const box = el('div', 'empty');
    box.append(el('div', 'empty__title', 'No trajectory on record'));
    box.append(
      el(
        'div',
        'empty__detail',
        `No ANPR sightings matched ${plate} in the selected window.`
      )
    );
    panelBody.replaceChildren(box);
  }

  function runSearch(raw) {
    const plate = normalisePlate(raw ?? '');
    clearRoute();

    if (!plate) {
      drawCameras();
      map.setView([28.6139, 77.209], 12, { animate: false });
      showIdle();
      return;
    }

    const record = lookupTrajectory(plate);
    if (!record) {
      drawCameras();
      showNotFound(plate);
      return;
    }

    drawCameras(new Set(record.stops.map((s) => s.cameraId)));
    routeLayer = addRoute(map, record.stops, { animate: !prefersReducedMotion() });

    panelNote.textContent = `${record.stops.length} sightings`;
    panelBody.replaceChildren(
      summaryNode(record),
      buildTimeline(record.stops)
    );
  }

  drawCameras();
  showIdle();
  input.focus();

  return destroy;
}
