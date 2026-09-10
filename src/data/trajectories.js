// Seeded trajectory records, keyed by normalised plate number.
// Timestamps are ordered; the view relies on that ordering.

export const trajectories = {
  DL01AB1234: {
    plate: 'DL01AB1234',
    vehicle: 'Maruti Swift · Hatchback · White',
    registeredTo: 'Private — New Delhi RTO',
    watchlisted: true,
    stops: [
      { cameraId: 'DLC-086', timestamp: '2026-09-10 13:42:11', speed: 54, confidence: 96.1 },
      { cameraId: 'DLC-037', timestamp: '2026-09-10 14:01:38', speed: 61, confidence: 98.3 },
      { cameraId: 'DLC-032', timestamp: '2026-09-10 14:11:55', speed: 38, confidence: 94.7 },
      { cameraId: 'DLC-045', timestamp: '2026-09-10 14:22:07', speed: 44, confidence: 97.4 },
    ],
  },

  HR26CX7781: {
    plate: 'HR26CX7781',
    vehicle: 'Toyota Innova · MUV · Silver',
    registeredTo: 'Commercial — Gurugram RTO',
    watchlisted: true,
    stops: [
      { cameraId: 'DLC-063', timestamp: '2026-09-10 13:20:04', speed: 58, confidence: 93.5 },
      { cameraId: 'DLC-014', timestamp: '2026-09-10 13:33:47', speed: 41, confidence: 95.8 },
      { cameraId: 'DLC-052', timestamp: '2026-09-10 13:42:19', speed: 47, confidence: 92.0 },
      { cameraId: 'DLC-037', timestamp: '2026-09-10 13:48:31', speed: 66, confidence: 91.2 },
    ],
  },

  UP16DG4402: {
    plate: 'UP16DG4402',
    vehicle: 'Tata Ace · Goods carrier · Blue',
    registeredTo: 'Commercial — Noida RTO',
    watchlisted: false,
    stops: [
      { cameraId: 'DLC-071', timestamp: '2026-09-10 11:38:22', speed: 49, confidence: 90.4 },
      { cameraId: 'DLC-014', timestamp: '2026-09-10 11:57:03', speed: 36, confidence: 93.1 },
      { cameraId: 'DLC-063', timestamp: '2026-09-10 12:05:52', speed: 52, confidence: 88.9 },
    ],
  },

  DL08CA5599: {
    plate: 'DL08CA5599',
    vehicle: 'Hyundai Creta · SUV · Grey',
    registeredTo: 'Private — New Delhi RTO',
    watchlisted: false,
    stops: [
      { cameraId: 'DLC-021', timestamp: '2026-09-10 09:12:40', speed: 33, confidence: 97.7 },
      { cameraId: 'DLC-014', timestamp: '2026-09-10 09:24:16', speed: 40, confidence: 96.2 },
      { cameraId: 'DLC-045', timestamp: '2026-09-10 09:39:58', speed: 46, confidence: 94.9 },
      { cameraId: 'DLC-052', timestamp: '2026-09-10 09:51:27', speed: 43, confidence: 95.5 },
    ],
  },
};

export const seededPlates = Object.keys(trajectories);

export function normalisePlate(input) {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function lookupTrajectory(input) {
  return trajectories[normalisePlate(input)] ?? null;
}
