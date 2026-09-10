import 'leaflet/dist/leaflet.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/map.css';
import './styles/search.css';
import './styles/analytics.css';
import './styles/alerts.css';

import { createAppShell, routes } from './components/AppShell.js';

const DEFAULT_ROUTE = 'map';
const validRoutes = new Set(routes.map((r) => r.id));

// View modules are registered here as each is built.
const viewLoaders = {
  map: () => import('./views/LiveMapView.js'),
  search: () => import('./views/VehicleSearchView.js'),
  analytics: () => import('./views/AnalyticsView.js'),
  alerts: () => import('./views/AlertsView.js'),
};

const shell = createAppShell({
  onNavigate: (routeId) => {
    window.location.hash = `#/${routeId}`;
  },
});

document.getElementById('app').append(shell.root);

let currentTeardown = null;
let currentRoute = null;
let renderToken = 0;

function routeFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return validRoutes.has(id) ? id : DEFAULT_ROUTE;
}

async function render() {
  const routeId = routeFromHash();

  // Normalise an unrecognised hash so the URL always matches the view.
  if (window.location.hash.replace(/^#\/?/, '') !== routeId) {
    window.location.replace(`#/${routeId}`);
  }

  if (routeId === currentRoute) return;
  currentRoute = routeId;

  // Loading a view module is async; a later navigation must win.
  const token = ++renderToken;
  shell.setActive(routeId);

  if (currentTeardown) {
    currentTeardown();
    currentTeardown = null;
  }
  shell.main.replaceChildren();

  const module = await viewLoaders[routeId]();
  if (token !== renderToken) return;

  const result = module.render(shell.main);
  currentTeardown = typeof result === 'function' ? result : null;
}

window.addEventListener('hashchange', render);

if (!validRoutes.has(window.location.hash.replace(/^#\/?/, ''))) {
  window.location.replace(`#/${DEFAULT_ROUTE}`);
}
render();
