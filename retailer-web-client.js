(() => {
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const validUrl = v => { try { const u = new URL(v); return /^https?:$/.test(u.protocol); } catch { return false; } };
  const money = (amount,currency='ZAR') => {
    if (amount == null || !Number.isFinite(Number(amount))) return 'Price not exposed';
    try { return new Intl.NumberFormat(undefined,{style:'currency',currency}).format(Number(amount)); }
    catch { return `${currency} ${Number(amount).toFixed(2)}`; }
  };
  const stock = v => {
    const x = String(v || '').toLowerCase();
    if (x === 'in_stock') return 'In stock online';
    if (x === 'out_of_stock') return 'Out of stock online';
    if (x === 'preorder') return 'Pre-order online';
    return v ? String(v).replace(/_/g,' ') : 'Online stock not exposed';
  };

  function ensureContainer() {
    const panel = document.getElementById('productIntelligencePanel');
    const existing = document.getElementById('retailerWebResults');
    if (existing) return existing;
    if (!panel) return null;
    const section = document.createElement('div');
    section.id = 'retailerWebResults';
    section.className = 'retailer-web-results';
    section.innerHTML = '<div class="retailer-web-head"><div><p class="section-kicker">LIVE RETAILER WEBSITES</p><h3>More official retailer results</h3></div><span class="premium-chip">WEB</span></div><p class="pi-note">FindIt checks official retailer pages for readable product data. Website availability means online listing data, not guaranteed stock at a physical branch.</p><div id="retailerWebProducts" class="pi-grid"></div><div id="retailerWebLinks" class="retailer-web-links"></div>';
    panel.appendChild(section);
    return section;
  }

  function render(data) {
    const container = ensureContainer();
    if (!container) return;
    const productsEl = document.getElementById('retailerWebProducts');
    const linksEl = document.getElementById('retailerWebLinks');
    const products = Array.isArray(data?.products) ? data.products : [];
    const retailers = Array.isArray(data?.retailers) ? data.retailers : [];

    if (products.length) {
      productsEl.innerHTML = products.map(p => `<article class="pi-offer verified retailer-web-offer">
        <div>
          <h4>${esc(p.productName || 'Product')}</h4>
          <p>${esc(p.retailer || 'Retailer')}</p>
          <div class="pi-meta"><span>Official website</span><span>${esc(stock(p.availability))}</span><span>Online listing</span></div>
          <div class="pi-actions">${validUrl(p.productUrl) ? `<a href="${esc(p.productUrl)}" target="_blank" rel="noopener noreferrer">View product</a>` : ''}</div>
        </div>
        <div class="pi-price">${esc(money(p.price,p.currency || 'ZAR'))}</div>
      </article>`).join('');
    } else {
      productsEl.innerHTML = '<div class="empty-state">These retailer sites did not expose reliable structured product prices to FindIt for this search.</div>';
    }

    linksEl.innerHTML = retailers.length ? `<p class="retailer-web-label">Search the official retailer sites directly</p><div class="retailer-web-linkgrid">${retailers.filter(r => validUrl(r.searchUrl)).map(r => `<a href="${esc(r.searchUrl)}" target="_blank" rel="noopener noreferrer"><b>${esc(r.name)}</b><small>${r.status === 'structured_products_found' ? 'Product data found' : 'Open official search'}</small></a>`).join('')}</div>` : '';
  }

  async function lookup(i) {
    const panel = document.getElementById('productIntelligencePanel');
    if (!panel || !i) return;
    ensureContainer();
    const productsEl = document.getElementById('retailerWebProducts');
    const linksEl = document.getElementById('retailerWebLinks');
    if (productsEl) productsEl.innerHTML = '<div class="empty-state">Checking official retailer websites…</div>';
    if (linksEl) linksEl.innerHTML = '';
    try {
      const r = await fetch('/api/retailer-web', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({
          query:i.searchQuery || i.name || i.object || '',
          name:i.name || i.object || '',
          object:i.object || '',
          brand:i.brand || '',
          model:i.model || '',
          category:i.category || '',
          retailCategory:i.retailCategory || ''
        })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Retailer lookup failed');
      render(d);
    } catch (e) {
      if (productsEl) productsEl.innerHTML = '<div class="empty-state">Live retailer website checking is temporarily unavailable.</div>';
    }
  }

  function install() {
    ensureContainer();
    const original = window.loadProductIntelligence;
    if (typeof original === 'function' && !original.__retailerWebWrapped) {
      const wrapped = function(i) {
        const result = original.apply(this, arguments);
        Promise.resolve(result).finally(() => lookup(i));
        return result;
      };
      wrapped.__retailerWebWrapped = true;
      window.loadProductIntelligence = wrapped;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
