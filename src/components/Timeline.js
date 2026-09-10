import { el } from '../lib/dom.js';
import { cameraById } from '../data/cameras.js';
import { parseTimestamp, timeOf, distanceKm, formatDuration } from '../lib/format.js';

function field(label, value, mono = true) {
  const row = el('div', 'timeline__field');
  row.append(
    el('span', 'timeline__field-label', label),
    el('span', mono ? 'timeline__field-value mono' : 'timeline__field-value', value)
  );
  return row;
}

function stopNode(stop, index, total) {
  const cam = cameraById[stop.cameraId];
  const isLast = index === total - 1;

  const node = el('li', 'timeline__stop');
  if (isLast) node.classList.add('timeline__stop--last');

  const rail = el('div', 'timeline__rail');
  rail.append(el('span', 'timeline__seq', String(index + 1)));
  node.append(rail);

  const body = el('div', 'timeline__body');
  const head = el('div', 'timeline__head');
  head.append(el('span', 'timeline__name', cam.name));
  if (isLast) head.append(el('span', 'timeline__flag', 'Last seen'));
  body.append(head);
  body.append(el('div', 'timeline__loc', `${cam.corridor} · ${cam.district}`));

  const fields = el('div', 'timeline__fields');
  fields.append(
    field('Time', timeOf(stop.timestamp)),
    field('Speed', `${stop.speed} km/h`),
    field('Camera', cam.id),
    field('Match', `${stop.confidence.toFixed(1)}%`)
  );
  body.append(fields);

  node.append(body);
  return node;
}

function gapNode(prev, next) {
  const a = cameraById[prev.cameraId];
  const b = cameraById[next.cameraId];
  const elapsed = parseTimestamp(next.timestamp) - parseTimestamp(prev.timestamp);
  const km = distanceKm(a, b);

  const node = el('li', 'timeline__gap');
  node.append(el('div', 'timeline__gap-rail'));
  node.append(
    el(
      'div',
      'timeline__gap-text',
      `${formatDuration(elapsed)} · ${km.toFixed(1)} km direct`
    )
  );
  return node;
}

/** Renders an ordered list of trajectory stops with inter-stop segments. */
export function buildTimeline(stops) {
  const list = el('ol', 'timeline');
  stops.forEach((stop, i) => {
    if (i > 0) list.append(gapNode(stops[i - 1], stop));
    list.append(stopNode(stop, i, stops.length));
  });
  return list;
}
