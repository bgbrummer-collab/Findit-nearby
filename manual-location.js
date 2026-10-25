/* A map/coordinate fallback that works without GPS permission or a paid geocoder. */
(() => {
  const init = () => {
    const foot = document.querySelector('.fx-search-foot');
    if (!foot || document.getElementById('finditManualLocation')) return;
    const details = document.createElement('details');
    details.id = 'finditManualLocation';
    details.style.cssText = 'width:100%;grid-column:1 / -1;color:#cbd5e1;padding:8px 0';
    details.innerHTML = `<summary style="cursor:pointer">Choose location on map / enter coordinates</summary>
      <p>Select your search area on the map, or enter its latitude and longitude. Distances use this point. Your selection lasts for this visit.</p>
      <button type="button" id="finditLocationMapButton">Open location map</button>
      <div id="finditLocationMap" hidden style="height:260px;width:100%;margin:10px 0;isolation:isolate"></div>
      <p id="finditMapStatus" role="status" aria-live="polite"></p>
      <form id="finditLocationForm" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <label style="flex:1;min-width:120px">Latitude<input id="finditManualLat" type="number" step="any" min="-90" max="90" required placeholder="e.g. -25.75" style="width:100%;box-sizing:border-box"></label>
      <label style="flex:1;min-width:120px">Longitude<input id="finditManualLon" type="number" step="any" min="-180" max="180" required placeholder="e.g. 28.23" style="width:100%;box-sizing:border-box"></label>
      <button type="submit">Use selected location</button></form>
      <p id="finditManualLocationStatus" role="status" aria-live="polite"></p>`;
    foot.appendChild(details);
    const lat = details.querySelector('#finditManualLat'), lon = details.querySelector('#finditManualLon');
    const status = details.querySelector('#finditManualLocationStatus');
    let map, marker, tiles;
    details.querySelector('#finditLocationMapButton').onclick = async () => {
      status.textContent = 'Loading location map…';
      try {
        const L = await window.finditLoadLeaflet();
        const host = details.querySelector('#finditLocationMap'); host.hidden = false;
        if (!map) {
          const coords = window.finditState?.coords;
          map = L.map(host).setView(coords ? [coords.lat, coords.lon] : [-29, 25], coords ? 12 : 5);
          tiles = window.finditAddMapTiles(L, map, message => { details.querySelector('#finditMapStatus').textContent = message; });
          map.on('click', e => {
            lat.value = e.latlng.lat.toFixed(6); lon.value = e.latlng.lng.toFixed(6);
            if (marker) marker.remove();
            marker = L.circleMarker(e.latlng, {radius:9}).addTo(map);
            status.textContent = 'Point selected. Choose Use selected location to apply it.';
          });
        }
        map.invalidateSize();
        tiles?.redraw();
        status.textContent = 'Zoom to your area and select a point. You can also enter coordinates below.';
      } catch { status.textContent = 'The map could not load. You can still enter coordinates below.'; }
    };
    details.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const a = Number(lat.value), b = Number(lon.value), st = window.finditState;
      if (!lat.value.trim() || !lon.value.trim() || !Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a)>90 || Math.abs(b)>180 || !st) return;
      st.coords = {lat:a, lon:b}; st.stores = [];
      window.__finditCoords = st.coords; window.finditLikelyStores = [];
      document.getElementById('finditLikelyNearby')?.remove();
      const message = `Search location set to ${a.toFixed(4)}, ${b.toFixed(4)}. Distances are measured from your selected point.`;
      for (const id of ['status', 'fxStatus']) { const el = document.getElementById(id); if (el) el.textContent = message; }
      const badge = document.querySelector('.fx-top-location span'); if (badge) badge.textContent = 'Selected location';
      window.renderStores?.(); window.updateMap?.();
      document.dispatchEvent(new CustomEvent('findit:nearby-updated', {detail:{stores:[]}}));
      status.textContent = message;
      if (st.result?.identification) await window.loadNearby?.(st.result.identification, st.radius);
      document.dispatchEvent(new CustomEvent('findit:location-ready', {detail:st.coords}));
    };
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
