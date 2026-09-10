// Mock alert queue — the seed data only. Live acknowledged/unacknowledged
// state is owned by alertStore.js; read counts from there, not from here.

export const alerts = [
  {
    id: 'ALT-2026-0918',
    severity: 'high',
    category: 'Watchlist match',
    plate: 'DL01AB1234',
    vehicle: 'Maruti Swift · Hatchback · White',
    cameraId: 'DLC-045',
    timestamp: '2026-09-10 14:22:07',
    confidence: 97.4,
    reason:
      'Vehicle on active watchlist — flagged 2026-09-09 by Crime Branch under WL-2291.',
    status: 'unacknowledged',
  },
  {
    id: 'ALT-2026-0917',
    severity: 'high',
    category: 'Route anomaly',
    plate: 'HR26CX7781',
    vehicle: 'Toyota Innova · MUV · Silver',
    cameraId: 'DLC-037',
    timestamp: '2026-09-10 13:48:31',
    confidence: 91.2,
    reason:
      'Same plate recorded 9.9 km away 6 minutes earlier — implied transit speed of 96 km/h exceeds the corridor maximum.',
    status: 'unacknowledged',
  },
];
