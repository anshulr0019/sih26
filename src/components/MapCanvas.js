import L from 'leaflet';
import { el } from '../lib/dom.js';
import { cameras, cameraById } from '../data/cameras.js';

export const DELHI_CENTER = [28.6139, 77.209];
export const DELHI_ZOOM = 12;

const BASE_LAYER_CONFIG = {
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 18,
  },
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  },
};

// Phosphor-style camera glyph. evenodd punches out the lens so the whole
// mark can be tinted with a single currentColor fill.
const CAMERA_GLYPH = `<svg viewBox="0 0 16 16" fill="currentColor" fill-rule="evenodd" aria-hidden="true"><path d="M5.6 2.4h4.8l.9 1.4h2.6c.6 0 1.1.5 1.1 1.1v7c0 .6-.5 1.1-1.1 1.1H2.1C1.5 13 1 12.5 1 11.9v-7c0-.6.5-1.1 1.1-1.1h2.6l.9-1.4zM8 11a2.6 2.6 0 100-5.2 2.6 2.6 0 000 5.2z"/></svg>`;

export function cameraMarkerHtml(status) {
  return `<div class="cam-marker cam-marker--${status}">${CAMERA_GLYPH}</div>`;
}

function cameraIcon(status) {
  return L.divIcon({
    className: '',
    html: cameraMarkerHtml(status),
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -13],
  });
}

function popupHtml(cam) {
  const online = cam.status === 'online';
  const row = (label, value) =>
    `<div class="cam-popup__row"><span class="cam-popup__label">${label}</span><span class="cam-popup__value">${value}</span></div>`;

  return `
    <div class="cam-popup">
      <div class="cam-popup__head">
        <div class="cam-popup__name">${cam.name}</div>
        <div class="cam-popup__corridor">${cam.corridor}</div>
      </div>
      <div class="cam-popup__rows">
        ${row('Camera ID', cam.id)}
        ${row('Feed ID', cam.feedId)}
        ${row('District', cam.district)}
        ${row('Lanes covered', cam.lanes)}
        ${row(
          'Status',
          `<span class="cam-popup__status"><span class="dot dot--${
            online ? 'online' : 'offline'
          }"></span>${online ? 'Online' : 'Offline'}</span>`
        )}
      </div>
    </div>`;
}

function buildLegend(rows) {
  const box = el('div', 'map-legend');
  box.append(el('div', 'map-legend__title', 'Legend'));
  for (const row of rows) {
    const line = el('div', 'map-legend__row');
    line.insertAdjacentHTML('afterbegin', row.mark);
    line.append(el('span', null, row.label));
    box.append(line);
  }
  L.DomEvent.disableClickPropagation(box);
  return box;
}

export function addLegend(map, rows) {
  const control = L.control({ position: 'bottomright' });
  control.onAdd = () => buildLegend(rows);
  control.addTo(map);
  return control;
}

/**
 * Creates a Leaflet map inside `container`. Returns the map plus a
 * destroy() the view's teardown hook calls on navigation.
 */
export function createMap(container, options = {}) {
  const initialBaseLayer = options.baseLayer ?? 'satellite';
  const map = L.map(container, {
    center: options.center ?? DELHI_CENTER,
    zoom: options.zoom ?? DELHI_ZOOM,
    zoomControl: true,
    attributionControl: true,
    // Decorative inertia reads as consumer software; keep panning literal.
    inertia: false,
  });

  let activeBaseLayer = BASE_LAYER_CONFIG[initialBaseLayer]
    ? initialBaseLayer
    : 'satellite';
  let tiles = null;

  function makeBaseLayer(key) {
    const config = BASE_LAYER_CONFIG[key];
    return L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
      crossOrigin: true,
    });
  }

  function mountBaseLayer(key) {
    const next = makeBaseLayer(key).addTo(map);
    const previous = tiles;
    tiles = next;
    activeBaseLayer = key;
    container.dataset.baseLayer = key;
    container.classList.toggle('map--satellite', key === 'satellite');
    container.classList.toggle('map--street', key === 'street');
    if (previous) {
      previous.off('tileload', onTileLoad);
      previous.off('tileerror', onTileError);
      map.removeLayer(previous);
    }
    next.on('tileload', onTileLoad);
    next.on('tileerror', onTileError);
    return next;
  }

  // Tile-loading state. If the basemap has not appeared shortly after
  // mount, cover the map rather than leaving markers on bare grey.
  const status = el('div', 'map-status');
  status.hidden = true;
  status.append(el('div', 'map-status__text', 'Connecting to map service…'));
  container.append(status);

  let connected = false;
  let hasTileError = false;
  const showStatus = setTimeout(() => {
    if (!connected) status.hidden = false;
  }, 2000);

  // 'tileload' fires per successfully rendered tile. The layer's 'load'
  // event would be wrong here: it also fires once every tile has errored,
  // which would clear the message in exactly the case it exists for.
  const onTileLoad = () => {
    connected = true;
    clearTimeout(showStatus);
    status.hidden = true;
    tiles.off('tileload', onTileLoad);
  };
  const onTileError = () => {
    hasTileError = true;
    if (!connected) {
      status.querySelector('.map-status__text').textContent =
        activeBaseLayer === 'satellite'
          ? 'Satellite layer unavailable — switch to street map'
          : 'Connecting to map service…';
    }
  };

  mountBaseLayer(activeBaseLayer);

  function setBaseMap(key) {
    if (!BASE_LAYER_CONFIG[key] || key === activeBaseLayer) return activeBaseLayer;
    connected = false;
    hasTileError = false;
    status.querySelector('.map-status__text').textContent = 'Connecting to map service…';
    status.hidden = true;
    clearTimeout(showStatus);
    tiles = mountBaseLayer(key);
    return activeBaseLayer;
  }

  // Leaflet mis-sizes when its container was laid out after construction.
  const ro = new ResizeObserver(() => map.invalidateSize());
  ro.observe(container);

  return {
    map,
    setBaseMap,
    getBaseMap() {
      return activeBaseLayer;
    },
    destroy() {
      clearTimeout(showStatus);
      tiles.off('tileload', onTileLoad);
      tiles.off('tileerror', onTileError);
      ro.disconnect();
      map.remove();
    },
  };
}

/** Plots the full camera registry. Returns the marker layer group. */
export function addCameraMarkers(map, { onSelect, exclude } = {}) {
  const group = L.layerGroup().addTo(map);
  const skip = exclude instanceof Set ? exclude : new Set(exclude ?? []);

  for (const cam of cameras) {
    if (skip.has(cam.id)) continue;
    const marker = L.marker([cam.lat, cam.lng], {
      icon: cameraIcon(cam.status),
      title: `${cam.name} (${cam.id})`,
      keyboard: true,
      alt: `Camera ${cam.id}, ${cam.name}, ${cam.status}`,
    });
    marker.bindPopup(popupHtml(cam), { closeButton: true, autoPan: true });
    if (onSelect) marker.on('click', () => onSelect(cam));
    marker.addTo(group);
  }

  return group;
}

export const CAMERA_LEGEND_ROWS = [
  { mark: cameraMarkerHtml('online'), label: 'Camera online' },
  { mark: cameraMarkerHtml('offline'), label: 'Camera offline' },
];

function destinationPoint([lat, lng], bearing, distanceMeters) {
  const latRadians = (lat * Math.PI) / 180;
  const lngRadians = (lng * Math.PI) / 180;
  const bearingRadians = (bearing * Math.PI) / 180;
  const angularDistance = distanceMeters / 6371000;
  const destinationLat = Math.asin(
    Math.sin(latRadians) * Math.cos(angularDistance) +
      Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(bearingRadians)
  );
  const destinationLng =
    lngRadians +
    Math.atan2(
      Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(latRadians),
      Math.cos(angularDistance) - Math.sin(latRadians) * Math.sin(destinationLat)
    );
  return [(destinationLat * 180) / Math.PI, (destinationLng * 180) / Math.PI];
}

function bearingBetween([fromLat, fromLng], [toLat, toLng]) {
  const fromLatRadians = (fromLat * Math.PI) / 180;
  const toLatRadians = (toLat * Math.PI) / 180;
  const deltaLng = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(deltaLng) * Math.cos(toLatRadians);
  const x =
    Math.cos(fromLatRadians) * Math.sin(toLatRadians) -
    Math.sin(fromLatRadians) * Math.cos(toLatRadians) * Math.cos(deltaLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function sectorPoints(origin, bearing, spread, radiusMeters) {
  const points = [origin];
  for (let angle = -spread; angle <= spread; angle += 6) {
    points.push(destinationPoint(origin, bearing + angle, radiusMeters));
  }
  points.push(origin);
  return points;
}

/** Adds a restrained sensor perimeter and estimated camera coverage sectors. */
export function addTacticalOverlays(map, cameraList = cameras) {
  const group = L.layerGroup().addTo(map);
  const center = DELHI_CENTER;
  const perimeter = L.circle(center, {
    radius: 18500,
    className: 'tactical-perimeter',
    color: '#7bd6b0',
    weight: 1,
    opacity: 0.65,
    fill: false,
    interactive: false,
  }).addTo(group);

  const innerPerimeter = L.circle(center, {
    radius: 9500,
    className: 'tactical-perimeter tactical-perimeter--inner',
    color: '#7bd6b0',
    weight: 1,
    opacity: 0.35,
    fill: false,
    interactive: false,
  }).addTo(group);

  const sectors = [];
  for (const camera of cameraList) {
    const origin = [camera.lat, camera.lng];
    const heading = bearingBetween(origin, center);
    const color = camera.status === 'online' ? '#70e0b0' : '#a6b0bd';
    const sector = L.polygon(sectorPoints(origin, heading, 25, 1450), {
      className: `coverage-sector coverage-sector--${camera.status}`,
      color,
      weight: 1,
      opacity: camera.status === 'online' ? 0.68 : 0.28,
      fillColor: color,
      fillOpacity: camera.status === 'online' ? 0.1 : 0.035,
      interactive: false,
    }).addTo(group);

    const ring = L.circle(origin, {
      radius: 190,
      className: `sensor-ring sensor-ring--${camera.status}`,
      color,
      weight: 1,
      opacity: camera.status === 'online' ? 0.75 : 0.35,
      fill: false,
      interactive: false,
    }).addTo(group);

    sectors.push({ sector, ring });
  }

  return {
    group,
    perimeter,
    innerPerimeter,
    sectors,
    setVisible(visible) {
      if (visible) group.addTo(map);
      else map.removeLayer(group);
    },
    destroy() {
      map.removeLayer(group);
    },
  };
}

const ZONE_COLORS = {
  high: '#e2513c',
  moderate: '#dfa029',
  clear: '#3f8f5e',
};

/** Draws hardcoded congestion zones as filled polygons. */
export function addZones(map, zones, { onSelect, fit = false } = {}) {
  const group = L.layerGroup().addTo(map);
  const bounds = L.latLngBounds([]);

  for (const zone of zones) {
    const color = ZONE_COLORS[zone.level];
    const poly = L.polygon(zone.coords, {
      className: `zone zone--${zone.level}`,
      color,
      weight: 1.5,
      opacity: 0.9,
      fillColor: color,
      // Kept low so road names and camera markers stay readable through
      // the overlay — this is an annotation layer, not a basemap.
      fillOpacity: 0.35,
    });

    poly.bindPopup(
      `<div class="cam-popup">
         <div class="cam-popup__head">
           <div class="cam-popup__name">${zone.name}</div>
           <div class="cam-popup__corridor">Zone ${zone.id}</div>
         </div>
         <div class="cam-popup__rows">
           <div class="cam-popup__row"><span class="cam-popup__label">Congestion</span><span class="cam-popup__value">${zone.congestion}%</span></div>
           <div class="cam-popup__row"><span class="cam-popup__label">Average speed</span><span class="cam-popup__value">${zone.avgSpeed} km/h</span></div>
         </div>
       </div>`
    );

    if (onSelect) poly.on('click', () => onSelect(zone));
    poly.addTo(group);
    bounds.extend(poly.getBounds());
  }

  // Analytics is only meaningful if every monitored zone is on screen;
  // a fixed zoom would push the northern and western zones out of view.
  if (fit && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [24, 24], animate: false });
  }

  return group;
}

export function zoneSwatchHtml(level) {
  return `<span class="map-legend__swatch" style="background:${ZONE_COLORS[level]}"></span>`;
}

export function seqMarkerHtml(n, isLast) {
  return `<div class="seq-marker${isLast ? ' seq-marker--last' : ''}">${n}</div>`;
}

function seqIcon(n, isLast) {
  return L.divIcon({
    className: '',
    html: seqMarkerHtml(n, isLast),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

/**
 * Draws a trajectory: a polyline through the stops plus numbered markers.
 * The line is revealed with a one-time stroke sweep so the direction of
 * travel is legible; it is not decorative and does not repeat.
 */
export function addRoute(map, stops, { animate = true } = {}) {
  const group = L.layerGroup().addTo(map);
  const latlngs = stops.map((s) => {
    const cam = cameraById[s.cameraId];
    return [cam.lat, cam.lng];
  });

  const line = L.polyline(latlngs, {
    className: 'route-line',
    color: '#1f3a5f',
    weight: 3,
    opacity: 0.95,
    lineJoin: 'round',
    lineCap: 'round',
  }).addTo(group);

  stops.forEach((stop, i) => {
    const cam = cameraById[stop.cameraId];
    L.marker([cam.lat, cam.lng], {
      icon: seqIcon(i + 1, i === stops.length - 1),
      zIndexOffset: 500,
      alt: `Stop ${i + 1}: ${cam.name} at ${stop.timestamp}`,
    }).addTo(group);
  });

  // Fit first: fitBounds reprojects the path, so measuring before it
  // would leave a stroke length that no longer matches the geometry.
  map.fitBounds(line.getBounds(), { padding: [48, 48], animate: false });

  if (animate) {
    const path = line.getElement();
    if (path && typeof path.getTotalLength === 'function') {
      const len = path.getTotalLength();
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      // Force layout so the transition starts from the offset state.
      void path.getBoundingClientRect();
      path.style.transition = 'stroke-dashoffset 400ms ease-out';
      path.style.strokeDashoffset = '0';

      // Drop the dash once drawn, or a later zoom reprojects the path
      // against a stale dash length and the line breaks into gaps.
      const clear = () => {
        path.style.transition = '';
        path.style.strokeDasharray = '';
        path.style.strokeDashoffset = '';
      };
      path.addEventListener('transitionend', clear, { once: true });
      setTimeout(clear, 600);
    }
  }

  return group;
}
