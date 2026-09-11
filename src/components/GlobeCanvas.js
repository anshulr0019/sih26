import * as C from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { cameras } from '../data/cameras.js';

// Provider approach adapted from God's Eye View (MIT); see THIRD_PARTY_NOTICES.md.
const HOME = [77.209, 28.6139];
export async function createGlobe(container, cb) {
  C.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
  const viewer = new C.Viewer(container, {
    baseLayer: false, baseLayerPicker: false, geocoder: false, animation: false, timeline: false,
    homeButton: false, sceneModePicker: false, navigationHelpButton: false, fullscreenButton: false,
    infoBox: false, selectionIndicator: true, requestRenderMode: true, maximumRenderTimeChange: Infinity,
    terrainProvider: new C.EllipsoidTerrainProvider(),
  });
  const scene = viewer.scene;
  viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.5);
  scene.globe.baseColor = C.Color.fromCssColorString('#102729');
  scene.backgroundColor = C.Color.fromCssColorString('#050b10');
  scene.globe.depthTestAgainstTerrain = false;
  scene.screenSpaceCameraController.minimumZoomDistance = 70;
  viewer.screenSpaceEventHandler.removeInputAction(C.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  let dead = false, generation = 0, active = '', terrain = null, photo = null;
  let orbit = false, heading = 0, lastTick = 0;
  let target = C.Cartesian3.fromDegrees(...HOME), range = 45000;
  let removeErrors = () => {};
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.5;
  const request = () => { if (!dead) scene.requestRender(); };
  const credit = new C.Credit('<a href="https://www.esri.com/">Powered by Esri</a>', true);
  const creditDisplay = viewer.cesiumWidget.creditDisplay;
  const entities = new Map();
  const coverage = [];
  for (const cam of cameras) {
    const color = C.Color.fromCssColorString(cam.status === 'online' ? '#7aefc4' : '#ffb56b');
    const entity = viewer.entities.add({ id: cam.id, name: cam.name,
      position: C.Cartesian3.fromDegrees(cam.lng, cam.lat, 12),
      point: { pixelSize: 10, color, outlineColor: C.Color.fromCssColorString('#071916'), outlineWidth: 3, heightReference: C.HeightReference.CLAMP_TO_GROUND },
      label: { text: cam.id, font: '12px monospace', fillColor: color, showBackground: true,
        backgroundColor: C.Color.fromCssColorString('#081a20').withAlpha(0.88), pixelOffset: new C.Cartesian2(0, cam.id === 'DLC-021' ? -46 : -24),
        heightReference: C.HeightReference.CLAMP_TO_GROUND, distanceDisplayCondition: new C.DistanceDisplayCondition(0, 180000) },
    }); entities.set(cam.id, entity);
    coverage.push(viewer.entities.add({
      position: C.Cartesian3.fromDegrees(cam.lng, cam.lat),
      ellipse: { semiMajorAxis: 190, semiMinorAxis: 190, material: color.withAlpha(0.12) },
    }));
  }
  const removeSelected = viewer.selectedEntityChanged.addEventListener(entity => {
    const cam = cameras.find(cam => cam.id === entity?.id); if (cam) cb.onSelect(cam);
  });
  function stopOrbit() { orbit = false; viewer.camera.lookAtTransform(C.Matrix4.IDENTITY); cb.onOrbit(false); request(); }
  function focus(position, distance, pitch = -48) {
    stopOrbit(); target = position; range = distance;
    viewer.camera.flyToBoundingSphere(new C.BoundingSphere(target, 1), { duration, offset: new C.HeadingPitchRange(0, C.Math.toRadians(pitch), distance) });
  }
  viewer.camera.lookAt(target, new C.HeadingPitchRange(0, C.Math.toRadians(-48), range));
  viewer.camera.lookAtTransform(C.Matrix4.IDENTITY);
  const onPointer = () => { if (orbit) stopOrbit(); };
  container.addEventListener('pointerdown', onPointer); container.addEventListener('wheel', onPointer, { passive: true });
  const removeTick = viewer.clock.onTick.addEventListener(() => {
    if (!orbit || document.hidden) { lastTick = performance.now(); return; }
    const now = performance.now(); heading += Math.min((now - lastTick) / 1000, 0.1) * 0.08; lastTick = now;
    viewer.camera.lookAt(target, new C.HeadingPitchRange(heading, C.Math.toRadians(-40), range)); request();
  });
  const timer = setInterval(() => {
    if (dead) return;
    const camera = viewer.camera;
    cb.onReadout(`ALT ${(camera.positionCartographic.height / 1000).toFixed(2)} km  /  HDG ${C.Math.toDegrees(camera.heading).toFixed(0)}°  /  ${new Date().toISOString().slice(11, 19)} UTC`);
  }, 500);
  const ro = new ResizeObserver(() => { if (!dead) { viewer.resize(); request(); } }); ro.observe(container);
  const renderError = scene.renderError.addEventListener(() => cb.onStatus('3D rendering stopped. Use the 2D map to continue.'));
  async function setSource(id) {
    const gen = ++generation; cb.onStatus(`Loading ${id === 'photoreal' ? 'photorealistic 3D' : id}…`);
    try {
      let provider;
      if (id === 'photoreal') {
        if (!photo) {
          C.GoogleMaps.defaultApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || undefined;
          const tiles = await C.createGooglePhotorealistic3DTileset({ onlyUsingWithGoogleGeocoder: true }, {
            cacheBytes: 256 * 1024 * 1024, maximumCacheOverflowBytes: 128 * 1024 * 1024,
          });
          if (dead || gen !== generation) { tiles.destroy(); return; }
          photo = scene.primitives.add(tiles);
        }
      } else if (id === 'satellite') {
        provider = await C.ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', { enablePickFeatures: false });
      } else provider = new C.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' });
      if (dead || gen !== generation) return;
      removeErrors(); viewer.imageryLayers.removeAll(); creditDisplay.removeStaticCredit(credit);
      if (provider) {
        viewer.imageryLayers.addImageryProvider(provider);
        let failures = 0;
        removeErrors = provider.errorEvent.addEventListener(() => {
          if (dead || gen !== generation || ++failures < 3) return;
          if (id === 'satellite') void setSource('street'); else cb.onStatus('Map tiles unavailable. Check your connection or switch source.');
        });
      }
      if (id === 'satellite') creditDisplay.addStaticCredit(credit);
      scene.globe.show = id !== 'photoreal'; if (photo) photo.show = id === 'photoreal';
      active = id; cb.onSource(id);
      cb.onStatus(id === 'photoreal' ? 'Photorealistic 3D · Detail varies by location' : `${id === 'satellite' ? 'Satellite' : 'Street'} · ${terrain ? 'Terrain enabled' : 'Globe surface'} · Demo camera data`); request();
    } catch {
      if (dead || gen !== generation) return;
      if (id === 'satellite') await setSource('street');
      else { cb.onSource(active || 'satellite'); cb.onStatus(id === 'photoreal' ? '3D tiles unavailable. Check provider access, token and coverage; current map retained.' : 'Map source unavailable. Try another source.'); }
    }
  }
  void setSource('satellite');
  void C.CesiumTerrainProvider.fromUrl('https://terrain.reearth.land/cesium-mesh/ellipsoid').then(provider => {
    if (dead) return;
    terrain = provider; viewer.terrainProvider = terrain;
    terrain.errorEvent.addEventListener(() => {
      if (dead || !terrain) return;
      terrain = null; viewer.terrainProvider = new C.EllipsoidTerrainProvider(); cb.onStatus('Terrain unavailable · Globe surface fallback'); request();
    });
    if (active && active !== 'photoreal') cb.onStatus(`${active === 'satellite' ? 'Satellite' : 'Street'} · Terrain enabled · Demo camera data`); request();
  }).catch(() => { /* The globe remains usable without terrain. */ });
  return {
    setSource, home: () => focus(C.Cartesian3.fromDegrees(...HOME), 45000),
    world() { stopOrbit(); viewer.camera.flyTo({ destination: C.Cartesian3.fromDegrees(...HOME, 18000000), orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 }, duration }); },
    topDown: () => focus(target, range, -90),
    select(cam) { viewer.selectedEntity = entities.get(cam.id); focus(C.Cartesian3.fromDegrees(cam.lng, cam.lat), 2500); },
    zoom(direction) { stopOrbit(); const amount = Math.max(50, viewer.camera.positionCartographic.height * 0.3); direction > 0 ? viewer.camera.zoomIn(amount) : viewer.camera.zoomOut(amount); request(); },
    toggleOrbit() { if (orbit) return stopOrbit(); viewer.camera.cancelFlight(); orbit = true; heading = viewer.camera.heading; lastTick = performance.now(); cb.onOrbit(true); request(); },
    labels(show) { entities.forEach(e => { e.label.show = show; }); request(); },
    coverage(show) { coverage.forEach(e => { e.show = show; }); request(); },
    night(show) { container.classList.toggle('globe-canvas--night', show); },
    destroy() {
      if (dead) return;
      dead = true; ++generation; clearInterval(timer); ro.disconnect(); removeSelected(); removeTick(); removeErrors(); renderError();
      container.removeEventListener('pointerdown', onPointer); container.removeEventListener('wheel', onPointer); viewer.destroy();
    },
  };
}
