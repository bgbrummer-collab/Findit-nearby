/* Validate before any of the dashboard/legacy upload bridges can mutate a Find. */
(() => {
  window.finditValidateUpload = file => {
    const message = !file ? '' : !String(file.type || '').startsWith('image/')
      ? 'Please choose an image file.' : file.size === 0
      ? 'This image is empty. Please choose another photo.' : file.size > 8 * 1024 * 1024
      ? 'Please use an image smaller than 8 MB.' : '';
    if (message) for (const id of ['status', 'fxStatus']) {
      const element = document.getElementById(id);
      if (element) { element.textContent = message; element.setAttribute('role', 'status'); }
    }
    return !!file && !message;
  };
  const guard = event => {
    const target = event.target;
    const input = event.type === 'change' && target?.matches?.('input[type="file"][accept*="image"]');
    const drop = event.type === 'drop' && target?.closest?.('#dropzone, .fx-drop');
    if (!input && !drop) return;
    const file = input ? target.files?.[0] : event.dataTransfer?.files?.[0];
    if (!file || window.finditValidateUpload(file)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (input) target.value = '';
  };
  document.addEventListener('change', guard, true);
  document.addEventListener('drop', guard, true);
})();
