// Hardcoded congestion zones. `level` drives the fill colour and must
// stay consistent with the thresholds published in the map legend:
//   high  > 75%   moderate 45-75%   clear < 45%

export const ZONE_THRESHOLDS = { high: 75, moderate: 45 };

export function levelFor(congestion) {
  if (congestion > ZONE_THRESHOLDS.high) return 'high';
  if (congestion >= ZONE_THRESHOLDS.moderate) return 'moderate';
  return 'clear';
}

export const zones = [
  {
    id: 'Z-01',
    name: 'ITO – Vikas Marg',
    congestion: 88,
    avgSpeed: 18,
    coords: [
      [28.64, 77.232],
      [28.643, 77.252],
      [28.632, 77.259],
      [28.62, 77.25],
      [28.622, 77.234],
    ],
  },
  {
    id: 'Z-02',
    name: 'Ashram – Nizamuddin',
    congestion: 84,
    avgSpeed: 21,
    coords: [
      [28.585, 77.248],
      [28.588, 77.268],
      [28.572, 77.276],
      [28.562, 77.262],
      [28.567, 77.246],
    ],
  },
  {
    id: 'Z-03',
    name: 'Azadpur – Mukarba',
    congestion: 79,
    avgSpeed: 23,
    coords: [
      [28.755, 77.148],
      [28.757, 77.172],
      [28.735, 77.186],
      [28.705, 77.18],
      [28.7, 77.16],
      [28.725, 77.146],
    ],
  },
  {
    id: 'Z-04',
    name: 'Dhaula Kuan – NH-48',
    congestion: 64,
    avgSpeed: 31,
    coords: [
      [28.605, 77.15],
      [28.608, 77.174],
      [28.594, 77.182],
      [28.582, 77.17],
      [28.587, 77.152],
    ],
  },
  {
    id: 'Z-05',
    name: 'Connaught Place Core',
    congestion: 58,
    avgSpeed: 27,
    coords: [
      [28.642, 77.21],
      [28.644, 77.228],
      [28.632, 77.234],
      [28.622, 77.226],
      [28.625, 77.212],
    ],
  },
  {
    id: 'Z-06',
    name: 'Akshardham – NH-24',
    congestion: 55,
    avgSpeed: 36,
    coords: [
      [28.63, 77.268],
      [28.633, 77.292],
      [28.618, 77.3],
      [28.606, 77.286],
      [28.61, 77.27],
    ],
  },
  {
    id: 'Z-07',
    name: 'AIIMS – South Extension',
    congestion: 51,
    avgSpeed: 34,
    coords: [
      [28.58, 77.198],
      [28.583, 77.22],
      [28.568, 77.226],
      [28.557, 77.214],
      [28.562, 77.199],
    ],
  },
  {
    id: 'Z-08',
    name: 'Peeragarhi – Rohtak Road',
    congestion: 34,
    avgSpeed: 48,
    coords: [
      [28.688, 77.08],
      [28.69, 77.106],
      [28.674, 77.114],
      [28.66, 77.102],
      [28.664, 77.083],
    ],
  },
  {
    id: 'Z-09',
    name: 'Nehru Place – Outer Ring',
    congestion: 29,
    avgSpeed: 52,
    coords: [
      [28.562, 77.24],
      [28.564, 77.262],
      [28.549, 77.27],
      [28.537, 77.257],
      [28.542, 77.242],
    ],
  },
].map((z) => ({ ...z, level: levelFor(z.congestion) }));

/** Zones ranked by congestion, worst first. */
export const busiestCorridors = [...zones].sort(
  (a, b) => b.congestion - a.congestion
);
