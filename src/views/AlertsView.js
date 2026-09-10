import { el, viewHeader } from '../lib/dom.js';
import {
  getActiveAlerts,
  acknowledgeAlert,
  subscribeAlerts,
} from '../data/alertStore.js';
import { alertCard } from '../components/AlertCard.js';

export function render(root) {
  const view = el('div', 'view view--scroll');

  const count = el('span', 'view__meta-value');
  const aside = el('div', 'view__meta');
  const item = el('div', 'view__meta-item');
  item.append(el('span', 'view__meta-label', 'Unacknowledged'), count);
  aside.append(item);

  view.append(
    viewHeader('Alerts', 'Automated detections requiring operator review', aside)
  );

  const list = el('div', 'alert-list');
  // Queue changes are announced for assistive tech.
  list.setAttribute('role', 'status');
  list.setAttribute('aria-live', 'polite');
  view.append(list);
  root.append(view);

  function paint() {
    const active = getActiveAlerts();
    count.textContent = String(active.length);

    if (active.length === 0) {
      const box = el('div', 'empty');
      box.append(el('div', 'empty__title', 'No open alerts'));
      box.append(
        el(
          'div',
          'empty__detail',
          'All detections in this window have been acknowledged.'
        )
      );
      list.replaceChildren(box);
      return;
    }

    list.replaceChildren(
      ...active.map((alert) =>
        alertCard(alert, { onAcknowledge: acknowledgeAlert })
      )
    );
  }

  paint();
  const unsubscribe = subscribeAlerts(paint);
  return unsubscribe;
}
