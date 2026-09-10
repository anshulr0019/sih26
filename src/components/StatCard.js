import { el } from '../lib/dom.js';

export function statCard({ label, value, unit, note }) {
  const card = el('div', 'stat');
  card.append(el('div', 'stat__label', label));

  const line = el('div', 'stat__line');
  line.append(el('span', 'stat__value', value));
  if (unit) line.append(el('span', 'stat__unit', unit));
  card.append(line);

  if (note) card.append(el('div', 'stat__note', note));
  return card;
}

export function statRow(stats) {
  const row = el('div', 'stat-row');
  for (const s of stats) row.append(statCard(s));
  return row;
}
