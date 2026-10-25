/* Same-origin Leaflet assets; failed loads can be retried during the same visit. */
(() => {
  let pending;
  const version = '1.9.4';
  function asset(tag, attributes) {
    return new Promise((resolve, reject) => {
      const el = document.createElement(tag);
      Object.assign(el, attributes);
      let timer;
      const finish = error => {
        clearTimeout(timer);
        el.onload = el.onerror = null;
        if (error) { el.remove(); reject(error); }
        else resolve(el);
      };
      el.onload = () => finish();
      el.onerror = () => finish(new Error('Map asset unavailable'));
      timer = setTimeout(() => finish(new Error('Map asset timed out')), 10000);
      document.head.appendChild(el);
    });
  }
  let cssReady = false;
  window.finditLoadLeaflet = () => {
    if (pending) return pending;
    pending = Promise.allSettled([
      cssReady ? undefined : asset('link', {rel:'stylesheet', href:`/assets/leaflet/leaflet.css?v=${version}`}).then(() => { cssReady = true; }),
      window.L ? undefined : asset('script', {src:`/assets/leaflet/leaflet.js?v=${version}`, async:true}).then(() => {
        if (!window.L?.map || !window.L?.tileLayer) throw new Error('Map library unavailable');
      })
    ]).then(results => {
      const failure = results.find(result => result.status === 'rejected');
      if (failure) throw failure.reason;
      return window.L;
    }).finally(() => { pending = null; });
    return pending;
  };
  // A tile outage must not leave an unexplained grey map or disable coordinates.
  window.finditAddMapTiles = (L, map, notify = () => {}) => {
    let errors = 0, timer;
    const failed = () => notify('Map imagery could not load. Enter coordinates or retry opening the map; nearby store details remain available.');
    const layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; OpenStreetMap contributors'
    });
    layer.on('loading', () => { errors = 0; clearTimeout(timer); timer = setTimeout(failed, 12000); });
    layer.on('tileerror', () => { errors++; failed(); });
    layer.on('load', () => { clearTimeout(timer); if (errors) failed(); else notify(''); });
    map.on('unload', () => clearTimeout(timer));
    layer.addTo(map);
    return layer;
  };
  document.addEventListener('click', event => {
    if (!event.target.closest?.('#mapViewBtn,[data-premium-action="map"],[data-pw="map"],a[href="#nearbyPanel"]')) return;
    window.finditLoadLeaflet().then(() => {
      window.ensureMap?.(); window.updateMap?.();
    }).catch(() => {
      const host = document.getElementById('map');
      if (host) host.textContent = 'Map unavailable. Try opening it again. Nearby store details and manual coordinates remain available.';
    });
  }, true);
})();
