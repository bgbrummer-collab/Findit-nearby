(() => {
  function init() {
    const choose = document.getElementById('choosePhoto');
    const take = document.getElementById('takePhoto');
    const photo = document.getElementById('photo');
    const camera = document.getElementById('cameraPhoto');
    const preview = document.getElementById('preview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const search = document.getElementById('search');
    const status = document.getElementById('status');
    const location = document.getElementById('location');

    if (!choose || !take || !photo || !camera) return;

    const showStatus = (text, error = false) => {
      if (!status) return;
      status.textContent = text;
      status.style.color = error ? '#ff9da7' : '';
    };

    const applyFile = (file) => {
      if (!file) return;
      if (!String(file.type || '').startsWith('image/')) {
        showStatus('Please choose an image file.', true);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showStatus('Please use an image smaller than 8 MB.', true);
        return;
      }

      try {
        if (typeof state !== 'undefined') state.file = file;
      } catch {}
      window.__finditSelectedFile = file;

      if (preview) {
        try { if (preview.src && preview.src.startsWith('blob:')) URL.revokeObjectURL(preview.src); } catch {}
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
      }
      placeholder?.classList.add('hidden');
      if (search) search.disabled = false;
      showStatus('Photo ready. You can now identify and find this item.');
    };

    // Capture phase makes these controls work even if another script overwrote onclick.
    choose.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      photo.value = '';
      photo.click();
    }, true);

    take.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      camera.value = '';
      camera.click();
    }, true);

    photo.addEventListener('change', () => applyFile(photo.files?.[0]), true);
    camera.addEventListener('change', () => applyFile(camera.files?.[0]), true);

    if (location) {
      location.addEventListener('click', (event) => {
        if (!navigator.geolocation) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        location.disabled = true;
        location.textContent = 'Finding location…';
        navigator.geolocation.getCurrentPosition(
          (p) => {
            const coords = { lat: p.coords.latitude, lon: p.coords.longitude };
            try { if (typeof state !== 'undefined') state.coords = coords; } catch {}
            window.__finditCoords = coords;
            location.disabled = false;
            location.textContent = '✓ Location ready';
            showStatus('Location ready. Nearby search can use your selected radius.');
          },
          () => {
            location.disabled = false;
            location.textContent = '📍 Use my location';
            showStatus('Location permission was not granted. Identification still works.', true);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 120000 }
        );
      }, true);
    }

    // If the main app loaded normally, copy the selected recovery file into its state
    // just before search. This does not replace the normal search handler.
    search?.addEventListener('click', () => {
      try {
        if (typeof state !== 'undefined') {
          if (!state.file && window.__finditSelectedFile) state.file = window.__finditSelectedFile;
          if (!state.coords && window.__finditCoords) state.coords = window.__finditCoords;
        }
      } catch {}
    }, true);

    document.documentElement.dataset.finditInputRecovery = 'ready';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
