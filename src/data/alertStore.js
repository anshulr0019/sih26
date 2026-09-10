import { alerts } from './alerts.js';

// Single source of truth for alert state. The nav badge, the nav footer
// count and the Alerts list all read from here, so acknowledging once
// updates every surface instead of them being kept in sync by hand.

// Seeded as acknowledged if the source record says so, so the seed data
// stays authoritative for the initial state.
const acknowledged = new Set(
  alerts.filter((a) => a.status === 'acknowledged').map((a) => a.id)
);
const listeners = new Set();

export function getActiveAlerts() {
  return alerts.filter((a) => !acknowledged.has(a.id));
}

export function getActiveAlertCount() {
  return getActiveAlerts().length;
}

export function acknowledgeAlert(id) {
  if (acknowledged.has(id)) return;
  acknowledged.add(id);
  for (const fn of listeners) fn();
}

export function subscribeAlerts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
