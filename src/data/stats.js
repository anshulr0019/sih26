import { cameraStats, cameras } from './cameras.js';

const offline = cameras.find((c) => c.status === 'offline');

export const summaryStats = [
  {
    label: 'Average network speed',
    value: '31.4',
    unit: 'km/h',
    note: 'All corridors, last 60 minutes',
  },
  {
    label: 'Active cameras',
    value: `${cameraStats.online} / ${cameraStats.total}`,
    unit: '',
    note: offline ? `Offline: ${offline.name}` : 'All feeds reporting',
  },
  {
    label: 'Vehicles tracked today',
    value: (124806).toLocaleString('en-IN'),
    unit: '',
    note: 'Since 00:00 IST',
  },
];
