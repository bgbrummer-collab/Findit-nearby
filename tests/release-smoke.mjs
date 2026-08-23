import { chromium } from 'playwright';

const URL = process.env.FINDIT_URL || 'https://findit-nearby.vercel.app/';
const browser = await chromium.launch({ headless: true });
const failures = [];
const check = async (name, fn) => {
  try { await fn(); console.log('[PASS]', name); }
  catch (e) { failures.push(`${name}: ${e.message}`); console.error('[FAIL]', name, e.message); }
};

async function audit(viewport) {
  const ctx = await browser.newContext({
    viewport,
    geolocation: { latitude: -25.7479, longitude: 28.2293 },
    permissions: ['geolocation', 'clipboard-read', 'clipboard-write']
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1800);

  await check(`${viewport.width}px production loads current finder`, async () => {
    if (!await page.locator('#finder').count()) throw Error('finder missing');
    if (!await page.locator('#search').count()) throw Error('Identify & Find missing');
    if (!await page.locator('#photo').count()) throw Error('image input missing');
  });

  await check(`${viewport.width}px no duplicate element IDs`, async () => {
    const dupes = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
      return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
    });
    if (dupes.length) throw Error(`duplicate ids: ${dupes.join(', ')}`);
  });

  await check(`${viewport.width}px obsolete controls are removed`, async () => {
    const bad = await page.evaluate(() => ({
      widen: !!document.querySelector('#widenSearch'),
      coming: document.querySelectorAll('button.premium-coming').length,
      oldPremium: !!document.querySelector('#premiumHome')
    }));
    if (bad.widen || bad.coming || bad.oldPremium) throw Error(JSON.stringify(bad));
  });

  await check(`${viewport.width}px unverified nearby stores never keep Directions`, async () => {
    await page.evaluate(() => {
      const results = document.querySelector('#results');
      results?.classList.remove('hidden');
      const nearby = document.querySelector('#nearbyStores');
      if (!nearby) return;
      nearby.innerHTML = `
        <article class="store-card" data-store="0" data-exact-branch="0">
          <strong>Unverified Test Store</strong>
          <div class="store-actions"><a href="https://example.com">Directions →</a><a href="https://example.com">Map</a></div>
        </article>`;
      window.state = window.state || {};
      state.stores = [{name:'Unverified Test Store',lat:-25.75,lon:28.23,exactProductMatch:false,stockVerified:false}];
      document.dispatchEvent(new CustomEvent('findit:results-rendered'));
    });
    await page.waitForTimeout(300);
    const visibleDirections = await page.locator('#nearbyStores a, #nearbyStores button').filter({hasText:/Directions/i}).evaluateAll(els => els.filter(e => getComputedStyle(e).display !== 'none' && e.getAttribute('href')).length);
    if (visibleDirections) throw Error(`${visibleDirections} unverified Directions controls visible`);
  });

  await check(`${viewport.width}px results layout stays stable while scrolling`, async () => {
    await page.evaluate(() => {
      const results = document.querySelector('#results');
      results?.classList.remove('hidden');
      const exact = document.querySelector('#exactSellerResults') || (() => {
        const x = document.createElement('section'); x.id='exactSellerResults';
        x.innerHTML='<div style="height:700px">Verification content</div>';
        results?.appendChild(x); return x;
      })();
      document.dispatchEvent(new CustomEvent('findit:results-rendered'));
    });
    await page.waitForTimeout(500);
    const before = await page.evaluate(() => document.documentElement.scrollHeight);
    const samples = [];
    for (let i=0;i<8;i++) {
      await page.evaluate(i => window.scrollTo(0, Math.min(document.documentElement.scrollHeight-window.innerHeight, i*250)), i);
      await page.waitForTimeout(120);
      samples.push(await page.evaluate(() => document.documentElement.scrollHeight));
    }
    const after = await page.evaluate(() => document.documentElement.scrollHeight);
    const min = Math.min(before, after, ...samples), max = Math.max(before, after, ...samples);
    if (max - min > 8) throw Error(`scrollHeight changed while scrolling: ${[before,...samples,after].join(',')}`);
  });

  await check(`${viewport.width}px no uncaught JavaScript errors`, async () => {
    if (pageErrors.length) throw Error(pageErrors.join(' | '));
  });

  await ctx.close();
  return { pageErrors, consoleErrors };
}

const desktop = await audit({ width: 1440, height: 900 });
const mobile = await audit({ width: 390, height: 844 });

await browser.close();

console.log('Desktop console errors:', desktop.consoleErrors.length);
console.log('Mobile console errors:', mobile.consoleErrors.length);
if (failures.length) {
  console.error('\nFAILURES\n' + failures.join('\n'));
  process.exit(1);
}
console.log('\nCURRENT_FINDIT_PRODUCTION_SMOKE_PASS');
