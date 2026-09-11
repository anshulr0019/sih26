import { el } from '../lib/dom.js';
import { cameraStats } from '../data/cameras.js';
import { getActiveAlertCount, subscribeAlerts } from '../data/alertStore.js';

export const routes = [
  { id: 'map', label: 'Live Map' },
  { id: 'search', label: 'Vehicle Search' },
  { id: 'analytics', label: 'Traffic Analytics' },
  { id: 'alerts', label: 'Alerts', showCount: true },
];

const OPERATOR = 'Control Room 1';

// Demo runs on Indian time regardless of the host machine's locale.
function istClock() {
  return new Date().toLocaleTimeString('en-GB', {
    hour12: false,
    timeZone: 'Asia/Kolkata',
  });
}

function buildTopbar() {
  const bar = el('header', 'topbar');

  const identity = el('div', 'topbar__identity');
  const brand = el('div', 'topbar__brand');
  brand.append(
    el('div', 'topbar__name', 'VaahanDrishti'),
    el('div', 'topbar__tagline', 'Vehicle Movement Intelligence Platform')
  );
  identity.append(
    brand,
    el('div', 'topbar__rule'),
    el('div', 'topbar__org', 'Bharat Electronics Limited')
  );

  const meta = el('div', 'topbar__meta');
  const operator = el('div', 'topbar__operator');
  operator.append(
    el('span', 'topbar__operator-label', 'Operator'),
    el('span', null, OPERATOR)
  );
  meta.append(operator);

  bar.append(identity, meta);
  return bar;
}

function buildNav(onNavigate) {
  const nav = el('nav', 'nav');
  nav.append(el('div', 'nav__section', 'Operations'));

  const list = el('ul', 'nav__list');
  const links = new Map();
  let alertBadge = null;

  for (const route of routes) {
    const item = el('li');
    const link = el('a', 'nav__link', route.label);
    link.href = `#/${route.id}`;
    link.dataset.route = route.id;

    if (route.showCount) {
      alertBadge = el('span', 'nav__link-count');
      link.append(alertBadge);
    }

    item.append(link);
    list.append(item);
    links.set(route.id, link);
  }

  const footer = el('div', 'nav__footer');

  const camStat = el('div', 'nav__stat');
  camStat.append(
    el('span', null, 'Cameras online'),
    el(
      'span',
      'nav__stat-value',
      `${cameraStats.online} / ${cameraStats.total}`
    )
  );

  const feedStat = el('div', 'nav__stat');
  const feedValue = el('span', 'nav__stat-value');
  feedStat.append(el('span', null, 'Active alerts'), feedValue);

  const live = el('div', 'nav__live');
  live.append(el('span', 'nav__live-dot'));
  const liveText = el('span', null, `Demo · ${istClock()} IST`);
  live.append(liveText);

  footer.append(camStat, feedStat, live);
  nav.append(list, footer);

  nav.addEventListener('click', (e) => {
    const link = e.target.closest('.nav__link');
    if (link) onNavigate(link.dataset.route);
  });

  function syncAlertCount() {
    const n = getActiveAlertCount();
    feedValue.textContent = String(n);
    if (alertBadge) {
      alertBadge.textContent = String(n);
      // An empty queue shows no badge rather than a zero.
      alertBadge.hidden = n === 0;
    }
  }

  syncAlertCount();
  subscribeAlerts(syncAlertCount);

  return { nav, links, liveText };
}

export function createAppShell({ onNavigate }) {
  const root = el('div', 'app');
  const { nav, links, liveText } = buildNav(onNavigate);
  const main = el('main', 'main');

  root.append(buildTopbar(), nav, main);

  // Keeps the footer reading as live software rather than a static mock.
  setInterval(() => {
    liveText.textContent = `Demo · ${istClock()} IST`;
  }, 1000);

  return {
    root,
    main,
    setActive(routeId) {
      for (const [id, link] of links) {
        link.classList.toggle('nav__link--active', id === routeId);
      }
    },
  };
}
