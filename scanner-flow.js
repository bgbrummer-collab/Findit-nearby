/* FindIt scan journey — UI only. Existing search/results logic remains authoritative. */
(()=>{
  'use strict';
  if (window.__finditScanJourneyV3) return;
  window.__finditScanJourneyV3 = true;

  const $ = (s) => document.querySelector(s);
  let active = false;
  let finished = false;
  let scanTimer = null;

  const escapeHtml = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function productInfo(){
    let identification = {};
    try { identification = window.state?.result?.identification || {}; } catch {}
    const name = identification.name || identification.model || identification.object || $('#resultName')?.textContent?.trim() || 'Item identified';
    const brand = identification.brand || '';
    const category = identification.category || '';
    const confidence = identification.confidence || $('#confidenceValue')?.textContent?.trim() || '95';
    const image = $('#preview')?.src || '';
    return { name, brand, category, confidence, image };
  }

  function installStyles(){
    if ($('#finditJourneyStyles')) return;
    const style = document.createElement('style');
    style.id = 'finditJourneyStyles';
    style.textContent = `
      #finditJourney{position:fixed;inset:0;z-index:2147483000;background:#070d19;color:#fff;overflow:auto;font-family:inherit}
      #finditJourney.hidden{display:none!important}
      .fj-screen{width:min(430px,100%);min-height:100dvh;margin:auto;padding:28px 22px 100px;box-sizing:border-box}
      .fj-title{font-size:27px;font-weight:900;color:#9a7cff;margin:8px 0 6px}.fj-sub{color:#9aa6ba;font-size:12px;text-align:center}
      .fj-scanbox{position:relative;width:min(82vw,330px);height:390px;margin:38px auto 24px;display:grid;place-items:center}
      .fj-scanbox img{max-width:76%;max-height:84%;object-fit:contain;border-radius:14px;filter:drop-shadow(0 12px 25px #0009)}
      .fj-corner{position:absolute;width:42px;height:42px;border-color:#9875ff;border-style:solid;filter:drop-shadow(0 0 8px #765cff)}
      .fj-a{left:0;top:0;border-width:4px 0 0 4px}.fj-b{right:0;top:0;border-width:4px 4px 0 0}.fj-c{left:0;bottom:0;border-width:0 0 4px 4px}.fj-d{right:0;bottom:0;border-width:0 4px 4px 0}
      .fj-beam{position:absolute;left:5%;right:5%;top:8%;height:3px;background:linear-gradient(90deg,transparent,#9f6dff,#27d4f3,transparent);box-shadow:0 0 18px #25d5ff,0 0 24px #8b62ff;animation:fjscan 1.2s ease-in-out infinite alternate}
      @keyframes fjscan{to{top:92%}}
      .fj-center{text-align:center}.fj-progress{height:7px;background:#182238;border-radius:10px;overflow:hidden;margin:22px auto;width:90%}.fj-progress i{display:block;height:100%;width:12%;border-radius:10px;background:linear-gradient(90deg,#805cff,#2bd2f2);animation:fjprogress 3.5s ease forwards}@keyframes fjprogress{to{width:96%}}
      .fj-orb{width:160px;height:160px;border-radius:50%;margin:55px auto 34px;display:grid;place-items:center;font-size:48px;background:radial-gradient(circle,#10182b 48%,transparent 50%),conic-gradient(#26d3f4,#8b64ff,#26d3f4);box-shadow:0 0 48px #755cff3d;animation:fjrotate 2s linear infinite}@keyframes fjrotate{to{transform:rotate(360deg)}}
      .fj-steps{display:grid;gap:9px;margin:28px 0}.fj-step{display:flex;justify-content:space-between;padding:13px 15px;border-radius:12px;background:#111a2c;color:#aab5c7;font-size:12px}.fj-step b{color:#55dda5}
      .fj-pct{text-align:center;color:#9d7cff;font-size:26px;font-weight:900}.fj-success{text-align:center}.fj-success h1{color:#62e5a7;font-size:31px;margin:28px 0 6px}.fj-img{display:block;width:190px;height:270px;object-fit:contain;margin:18px auto;filter:drop-shadow(0 15px 28px #0009)}
      .fj-brand{color:#a6b0c0;font-size:13px}.fj-name{font-size:27px;font-weight:900;line-height:1.08;margin:6px 0}.fj-confidence{display:inline-flex;margin-top:14px;padding:8px 13px;border-radius:20px;background:#0d2a22;color:#62e5a7;border:1px solid #2b805d;font-size:12px;font-weight:800}
      .fj-actions h1{font-size:30px;line-height:1.08;margin:18px 0 25px}.fj-action{width:100%;min-height:74px;display:flex;align-items:center;gap:14px;padding:14px 15px;margin:10px 0;border:1px solid #202d43;border-radius:15px;background:#111a2b;color:#fff;text-align:left}.fj-action .ico{font-size:25px;width:34px}.fj-action span{flex:1}.fj-action b,.fj-action small{display:block}.fj-action b{font-size:14px}.fj-action small{font-size:10px;color:#929fb3;margin-top:5px}.fj-action em{font-style:normal;color:#9ba8bb;font-size:22px}.fj-action.primary{background:linear-gradient(100deg,#6959ff,#24c4e7);border:0}
      .fj-top{display:flex;align-items:center;gap:10px;margin-bottom:20px}.fj-back{border:0;background:none;color:#fff;font-size:25px}.fj-card{padding:16px;border:1px solid #202c41;border-radius:15px;background:#101929;margin:14px 0}.fj-close{width:100%;margin-top:18px;padding:14px;border:0;border-radius:13px;background:#111a2b;color:#fff;font-weight:800}
    `;
    document.head.appendChild(style);
  }

  function root(){
    let el = $('#finditJourney');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'finditJourney';
    el.className = 'hidden';
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fj]');
      if (btn) handle(btn.dataset.fj);
    });
    return el;
  }

  function showScanning(){
    if (!active) return;
    const img = $('#preview')?.src || '';
    const el = root();
    el.innerHTML = `<div class="fj-screen"><div class="fj-title">Scanning item</div><div class="fj-scanbox"><span class="fj-corner fj-a"></span><span class="fj-corner fj-b"></span><span class="fj-corner fj-c"></span><span class="fj-corner fj-d"></span>${img ? `<img src="${escapeHtml(img)}" alt="Item being scanned">` : ''}<i class="fj-beam"></i></div><div class="fj-center"><b>Analyzing image...</b><div class="fj-sub">This may take a few seconds</div></div><div class="fj-progress"><i></i></div></div>`;
    el.classList.remove('hidden');
    clearTimeout(scanTimer);
    scanTimer = setTimeout(showIdentifying, 1500);
  }

  function showIdentifying(){
    if (!active) return;
    root().innerHTML = `<div class="fj-screen"><div class="fj-title">Identifying item</div><div class="fj-orb">✨</div><div class="fj-steps"><div class="fj-step"><span>✓ &nbsp; Detecting object</span><b>✓</b></div><div class="fj-step"><span>✓ &nbsp; Reading text</span><b>✓</b></div><div class="fj-step"><span>✓ &nbsp; Understanding product</span><b>✓</b></div><div class="fj-step"><span>○ &nbsp; Verifying against retailers</span><b>○</b></div></div><div class="fj-sub">Almost there...</div><div class="fj-pct">95%</div></div>`;
  }

  function showSuccess(){
    if (!active || finished) return;
    finished = true;
    active = false;
    const p = productInfo();
    root().innerHTML = `<div class="fj-screen fj-success"><h1>You found it! 🎉</h1><div class="fj-sub">Item identified successfully</div>${p.image ? `<img class="fj-img" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">` : ''}<div class="fj-brand">${escapeHtml(p.brand)}</div><div class="fj-name">${escapeHtml(p.name)}</div><div class="fj-confidence">✓ ${escapeHtml(String(p.confidence).replace(/[^0-9.]/g,'') || '95')}% confidence</div><button class="fj-action primary" data-fj="next"><span class="ico">→</span><span><b>Continue</b><small>Choose what to do next</small></span><em>›</em></button></div>`;
  }

  function showActions(){
    root().innerHTML = `<div class="fj-screen fj-actions"><h1>What would you like<br>to do next?</h1><button class="fj-action" data-fj="product"><span class="ico">🧴</span><span><b>Product Information</b><small>View details, description, and similar products</small></span><em>›</em></button><button class="fj-action" data-fj="stores"><span class="ico">📍</span><span><b>Nearest Stores</b><small>See nearby stores that may have this item</small></span><em>›</em></button><button class="fj-action" data-fj="prices"><span class="ico">🏷️</span><span><b>Compare Prices</b><small>Compare verified prices across retailers</small></span><em>›</em></button><button class="fj-action" data-fj="save"><span class="ico">🔖</span><span><b>Save this search</b><small>Save for later or get stock alerts</small></span><em>›</em></button><button class="fj-action" data-fj="more"><span class="ico">•••</span><span><b>More options</b><small>Share, feedback & more</small></span><em>›</em></button></div>`;
  }

  function showProduct(){
    const p = productInfo();
    root().innerHTML = `<div class="fj-screen"><div class="fj-top"><button class="fj-back" data-fj="next">‹</button><b>Product Information</b></div>${p.image ? `<img class="fj-img" src="${escapeHtml(p.image)}">` : ''}<div class="fj-brand">${escapeHtml(p.brand)}</div><div class="fj-name">${escapeHtml(p.name)}</div><div class="fj-card">${escapeHtml(p.category || 'Product details')}<br><small>Identification details come from FindIt’s completed search.</small></div><button class="fj-close" data-fj="results">Back to results</button></div>`;
  }

  function closeAndScroll(target){
    root().classList.add('hidden');
    setTimeout(() => target?.scrollIntoView({behavior:'smooth', block:'start'}), 80);
  }

  function handle(action){
    if (action === 'next') return showActions();
    if (action === 'product') return showProduct();
    if (action === 'stores') return closeAndScroll($('#nearbyPanel'));
    if (action === 'prices') return closeAndScroll($('#exactSellerResults') || $('#results'));
    if (action === 'more') return closeAndScroll($('#feedback') || $('#results'));
    if (action === 'results') return closeAndScroll($('#results'));
    if (action === 'save') {
      try { $('#saveFind')?.click(); } catch {}
      root().innerHTML = `<div class="fj-screen fj-success"><h1>Saved! ✓</h1><div class="fj-orb">✓</div><div class="fj-sub">This search has been saved.</div><button class="fj-close" data-fj="results">Back to results</button></div>`;
    }
  }

  function searchCompleted(){
    const results = $('#results');
    const status = $('#status')?.textContent || '';
    return !!results && !results.classList.contains('hidden') && (/search complete/i.test(status) || ($('#resultName')?.textContent || '').trim() !== 'Item');
  }

  function startJourney(){
    const btn = $('#search');
    if (!btn || btn.disabled) return;
    active = true;
    finished = false;
    showScanning();
  }

  function bind(){
    const btn = $('#search');
    if (!btn) return;
    btn.addEventListener('click', startJourney, true);

    document.addEventListener('findit:results-rendered', () => {
      if (active) showSuccess();
    });

    const observer = new MutationObserver(() => {
      if (active && searchCompleted()) showSuccess();
      const status = $('#status')?.textContent || '';
      if (active && /search failed|error/i.test(status)) {
        active = false;
        root().classList.add('hidden');
      }
    });
    observer.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['class']});
  }

  function init(){
    installStyles();
    root();
    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();