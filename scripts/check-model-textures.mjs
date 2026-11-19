// Exercise real embedded GLB images under the production CSP, not just HTTP downloads.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const config = JSON.parse(await readFile('vercel.json', 'utf8'));
const csp = config.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
const browser = await chromium.launch({ executablePath: process.env.BROWSER,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage(), errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/__model-csp-test', route => route.fulfill({ contentType: 'text/html',
    headers: { 'Content-Security-Policy': csp }, body: '<!doctype html><title>Model texture test</title>' }));
  await page.goto((process.env.VILLAGE_URL || 'http://localhost:3000') + '/__model-csp-test');
  const result = await page.evaluate(async () => {
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const urls = ['/assets/residents/compact/bekci.glb', '/assets/night/compact/karabasma.glb',
      '/assets/night/compact/sis-gozcusu.glb', '/assets/night/compact/arif.glb', '/assets/workshop/compact/cumba.glb'];
    const rows = [];
    for (const url of urls) {
      const { scene } = await new GLTFLoader().loadAsync(url);
      let meshes = 0, mapped = 0;
      scene.traverse(o => {
        if (!o.isMesh) return;
        meshes++;
        if ((Array.isArray(o.material) ? o.material : [o.material]).some(m => m.map?.image)) mapped++;
      });
      rows.push({ url, meshes, mapped });
    }
    return rows;
  });
  for (const row of result) assert.ok(row.meshes > 0 && row.mapped > 0, JSON.stringify(row));
  assert.deepEqual(errors, []);
  console.log('OK: resident, creature, cadaver and workshop GLB textures decode under production CSP.');
} finally { await browser.close(); }
