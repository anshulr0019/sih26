import { el } from '../lib/dom.js';
import { cameraById } from '../data/cameras.js';

function snapshot() {
  const box = el('div', 'alert__snapshot');
  box.append(el('span', 'alert__snapshot-label', 'CAM FEED'));
  return box;
}

function metaItem(label, value) {
  const item = el('div', 'alert__meta-item');
  item.append(
    el('span', 'alert__meta-label', label),
    el('span', 'alert__meta-value mono', value)
  );
  return item;
}

export function alertCard(alert, { onAcknowledge } = {}) {
  const cam = cameraById[alert.cameraId];

  const card = el('article', `alert alert--${alert.severity}`);
  card.append(snapshot());

  const body = el('div', 'alert__body');

  const head = el('div', 'alert__head');
  head.append(
    el('span', 'alert__plate mono', alert.plate),
    el('span', 'alert__category', alert.category)
  );
  head.append(el('span', 'alert__time mono', alert.timestamp));
  body.append(head);

  body.append(el('div', 'alert__vehicle', alert.vehicle));
  body.append(
    el('div', 'alert__location', `${cam.name} · ${cam.corridor} · ${cam.district}`)
  );
  body.append(el('p', 'alert__reason', alert.reason));

  const foot = el('div', 'alert__foot');
  const meta = el('div', 'alert__meta');
  meta.append(
    metaItem('Alert', alert.id),
    metaItem('Camera', cam.id),
    metaItem('Match', `${alert.confidence.toFixed(1)}%`)
  );

  const ack = el('button', 'btn--link alert__ack', 'Acknowledge');
  ack.type = 'button';
  ack.setAttribute('aria-label', `Acknowledge alert ${alert.id} for ${alert.plate}`);
  if (onAcknowledge) ack.addEventListener('click', () => onAcknowledge(alert.id));

  foot.append(meta, ack);
  body.append(foot);

  card.append(body);
  return card;
}
