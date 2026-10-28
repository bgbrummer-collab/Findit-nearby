/* Show returned branch coordinates in the existing dashboard map panel. */
(() => {
  'use strict';
  let map, markers, panel, notice, pending, lastKey = '', generation = 0;
  const point = s => {
    const lat = s?.lat ?? s?.latitude, lon = s?.lon ?? s?.lng ?? s?.longitude;
    if (lat === null || lat === undefined || lat === '' || lon === null || lon === undefined || lon === '') return null;
    const p = [Number(lat), Number(lon)];
    return p.every(Number.isFinite) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180 && (p[0] !== 0 || p[1] !== 0) ? p : null;
  };
  function host() {
    const art = document.querySelector('#finditExactShell .fx-map-art');
    if (!art) return null;
    if (!panel || !art.contains(panel)) {
      map?.remove(); map = null; markers = null; lastKey = ''; generation++;
      art.replaceChildren(); art.dataset.liveMap = '1';
      panel = document.createElement('div'); panel.id = 'fxNearbyMap';
      panel.setAttribute('aria-label', 'Map of nearby retailer branches');
      notice = document.createElement('p'); notice.id = 'fxNearbyMapStatus'; notice.setAttribute('role', 'status');
      art.append(panel, notice);
    }
    return art;
  }
  async function render() {
    if (!host()) return;
    const state = window.finditState || window.state || {};
    const rows = (Array.isArray(state.stores) ? state.stores : []).map(store => ({store, point: point(store)})).filter(x => x.point);
    if (!rows.length) {
      generation++; lastKey = ''; markers?.clearLayers(); panel.hidden = true;
      notice.textContent = 'Real store pins appear after relevant nearby results are found.';
      return;
    }
    panel.hidden = false;
    const origin = point(state.coords);
    const key = JSON.stringify([origin, rows.map(x => [x.store.name, x.point])]);
    if (key === lastKey && map) { map.invalidateSize(); return; }
    if (pending) return;
    const current = ++generation;
    notice.textContent = 'Loading nearby branch map…';
    pending = true;
    try {
      const L = await window.finditLoadLeaflet();
      if (current !== generation) return;
      if (!map) {
        map = L.map(panel, {scrollWheelZoom: false});
        markers = L.layerGroup().addTo(map);
        window.finditAddMapTiles(L, map, message => { notice.textContent = message || 'Branch locations shown. Exact item stock is not confirmed by a map pin.'; });
      }
      markers.clearLayers();
      const bounds = [];
      for (const [index, row] of rows.entries()) {
        const name = String(row.store.name || 'Nearby retailer');
        const popup = document.createElement('div'), title = document.createElement('strong'), note = document.createElement('p'), button = document.createElement('button');
        title.textContent = name; note.textContent = 'Relevant retailer; exact item stock is not confirmed.';
        button.type = 'button'; button.textContent = 'Check Store'; button.onclick = () => window.finditCheckStore?.(row.store);
        popup.append(title, note, button);
        L.marker(row.point, {title: name, alt: name, icon: L.divIcon({className: 'fx-live-branch-pin', html: String(index + 1), iconSize: [44, 44], iconAnchor: [22, 22]})}).bindPopup(popup).addTo(markers);
        bounds.push(row.point);
      }
      if (origin) {
        L.marker(origin, {interactive: false, keyboard: false, title: 'Selected search location', alt: 'Selected search location', icon: L.divIcon({className: 'fx-live-search-pin', html: '⌖', iconSize: [30, 30], iconAnchor: [15, 15]})}).addTo(markers);
        bounds.push(origin);
      }
      map.invalidateSize(); map.fitBounds(bounds, {padding: [26, 26], maxZoom: 15}); lastKey = key;
      notice.textContent = 'Branch locations shown. Exact item stock is not confirmed by a map pin.';
    } catch {
      lastKey = ''; notice.textContent = 'Map unavailable. Nearby store details remain available. Select the map to retry.';
    } finally { pending = false; }
  }
  const style = document.createElement('style');
  style.textContent = '#fxNearbyMap{width:100%;height:280px;min-width:0;z-index:0}#fxNearbyMap[hidden]{display:none}#fxNearbyMap .leaflet-control-zoom a{width:44px;height:44px;line-height:44px;font-size:24px}#fxNearbyMap .leaflet-popup-close-button{width:44px;height:44px}#fxNearbyMapStatus{padding:8px 12px;margin:0;font-size:12px;line-height:1.4;color:#c6d8e8}.fx-live-branch-pin,.fx-live-search-pin{display:grid;place-items:center;border-radius:50%;border:2px solid white;background:#087bf0;color:white;font-weight:800;box-shadow:0 2px 6px #0008}.fx-live-search-pin{background:#153447}.fx-map-art:has(#fxNearbyMap){min-width:0}.fx-map-art .leaflet-popup-content{color:#102235}.fx-map-art .leaflet-popup-content button{padding:10px 14px;min-height:44px;cursor:pointer}';
  document.head.appendChild(style);
  window.finditRenderNearbyMap = render;
  for (const name of ['findit:nearby-updated', 'findit:results-rendered', 'findit:dashboard-sync', 'findit:new-photo-selected']) document.addEventListener(name, render);
  document.addEventListener('click', e => { if (e.target.closest?.('.fx-map-art') && !lastKey) render(); });
  window.addEventListener('resize', () => map?.invalidateSize());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, {once: true}); else render();
})();
