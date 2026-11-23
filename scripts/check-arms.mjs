// Browser smoke test of the real first-person rig and animation state.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.BROWSER, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 980, height: 640 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/src/game/engine.ts*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    assert.ok(source.includes('this.startLoop();'));
    await route.fulfill({ response, body: source.replace('this.startLoop();', 'window.fixture = this; this.requestPointerLockSafe = () => {};') });
  });
  await page.goto(process.env.VILLAGE_URL || 'http://localhost:3000', { waitUntil: 'networkidle' });
  const button = name => page.getByRole('button', { name, exact: true });
  await button('Oyuna başla').click();
  await button('Defteri aç').click();
  await page.getByRole('radio', { name: /Hacı Arif/ }).check();
  await button('Kaydı iliştir').click();
  await button('Bekle').click();
  await button('Meydana çık').click();
  await page.waitForFunction(() => window.fixture?.assetsReady);
  const result = await page.evaluate(() => {
    const e = window.fixture;
    e.nextScareTime = Infinity; e.karaCatchCooldown = 1e6;
    const tick = (n = 1) => { for (let i = 0; i < n; i++) { e.elapsedTime += 0.05; e.updateSimulation(0.05); } };
    const l = e.washingHand.getObjectByName('Sol el'), r = e.washingHand.getObjectByName('Sağ el');
    tick();
    const idle = { visible: e.washingHand.visible, x: l.rotation.x, candleParent: e.handCandle.root.parent === r };
    e.keys.KeyW = true;
    tick(12);
    const walk = { speed: Math.hypot(e.playerVel.x, e.playerVel.z), left: l.rotation.x, right: r.rotation.x };
    e.keys.ShiftLeft = true;
    tick(12);
    const run = { speed: Math.hypot(e.playerVel.x, e.playerVel.z), sprint: e.isSprinting, left: l.rotation.x, right: r.rotation.x };
    e.keys = {}; e.candleLit = true; tick();
    const candle = { visible: e.handCandle.root.visible, parentVisible: e.washingHand.visible };
    e.enterAutopsyMode('case_arif'); tick();
    const autopsyHidden = !e.washingHand.visible;
    e.exitAutopsyMode(); tick();
    const restored = e.washingHand.visible;
    return { idle, walk, run, candle, autopsyHidden, restored };
  });
  assert.equal(result.idle.visible, true);
  assert.equal(result.idle.candleParent, true);
  assert.ok(result.walk.speed > 2 && Math.abs(result.walk.left) > 0.001);
  assert.ok(Math.abs(result.walk.left + result.walk.right) < 0.00001);
  assert.equal(result.run.sprint, true);
  assert.ok(result.run.speed > result.walk.speed && Math.abs(result.run.left) > 0.001);
  assert.equal(result.candle.visible && result.candle.parentVisible, true);
  assert.equal(result.autopsyHidden, true);
  assert.equal(result.restored, true);
  assert.deepEqual(errors, []);
  console.log('OK: arms visible at rest, move in opposite directions while walking/running, carry candle and hide during autopsy.');
} finally { await browser.close(); }
