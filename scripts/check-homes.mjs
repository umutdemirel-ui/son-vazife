// Headless integration check: exercise every home door, family target and collision frame.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.BROWSER, headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 980, height: 640 } });
  page.on("pageerror", error => console.error("PAGEERROR", error));
  page.on("console", async msg => { if (msg.type() === "warning" || msg.type() === "error") console.error("CONSOLE", ...(await Promise.all(msg.args().map(a => a.jsonValue().catch(() => "error"))))); });
  if (process.env.MISSING_RESIDENTS === '1') await page.route('**/assets/residents/**', route => route.abort());
  await page.route('**/src/game/engine.ts*', async route => {
    const res = await route.fetch(), body = await res.text();
    await route.fulfill({ response: res, body: body.replace('this.startLoop();', 'window.fixture = this; this.requestPointerLockSafe = () => {};') });
  });
  await page.goto(process.env.VILLAGE_URL || 'http://localhost:3000', { waitUntil: 'networkidle' });
  const btn = name => page.getByRole('button', { name, exact: true });
  await btn('Oyuna başla').click(); await btn('Defteri aç').click();
  await page.getByRole('radio', { name: /Hacı Arif/ }).check();
  await btn('Kaydı iliştir').click(); await btn('Bekle').click(); await btn('Meydana çık').click();
  try { await btn('Duraklat').waitFor(); } catch (e) { console.error((await page.locator('body').innerText()).slice(-2000)); throw e; }
  assert.equal(await page.evaluate(() => {
    const event = new KeyboardEvent('keydown', {code: 'KeyW', ctrlKey: true, bubbles: true, cancelable: true});
    window.dispatchEvent(event);
    window.dispatchEvent(new KeyboardEvent('keyup', {code: 'KeyW', bubbles: true}));
    return event.defaultPrevented;
  }), true, 'Ctrl movement shortcuts should be canceled where supported');
  assert.deepEqual(await page.evaluate(() => {
    const e = fixture;
    e.act = 2; e.candleOil = 0.001; e.candleLit = true;
    e.updateSimulation(0.1);
    const expired = !e.candleLit && e.candleOil === 0;
    e.playerPos.set(-12, 0, 5); e.vigilLit = true; e.activeInteractId = 'vigil_candle'; e.handleInteract();
    const refilled = e.candleOil === 100;
    e.act = 1; e.vigilLit = false;
    return [expired, refilled];
  }), [true, true], 'candle fuel depletes and can be refilled');
  await page.evaluate(() => { fixture.scareClock.reset(); fixture.scareClock.remaining = 0.01; fixture.updateSimulation(0.05); });
  await page.locator('.village-scare').waitFor({ state: 'visible', timeout: 5000 });
  await page.evaluate(() => fixture.updateSimulation(1.5));
  await page.locator('.village-scare').waitFor({ state: 'hidden', timeout: 5000 });
  const result = await page.evaluate(async () => {
    const { Vector3 } = await import('/node_modules/three/build/three.module.js');
    const e = window.fixture, failures = [];
    for (const [i, h] of e.world.homes.entries()) {
      const front = new Vector3(0, 0, h.spec.d / 2).applyAxisAngle(new Vector3(0, 1, 0), h.spec.rotY).add(h.root.position);
      const before = front.clone(); e.resolveCollisions(before);
      if (before.distanceTo(front) < 0.2) failures.push([i, 'closed door has no collision']);
      e.playerPos.copy(front).add(new Vector3(0, 0, 0.01));
      e.activeInteractId = `home_door_${i}`; e.handleInteract();
      if (!h.open) failures.push([i, 'door did not open']);
      const opened = front.clone(); e.resolveCollisions(opened);
      if (opened.distanceTo(front) > 0.2) failures.push([i, 'doorway obstructed', opened.distanceTo(front)]);
    }
    if (e.world.interactables.some(t => t.id.startsWith('family_'))) failures.push(['family NPC still present']);
    for (const id of ['school', 'station', 'exchange']) {
      const d = e.world.outpostDoors[id];
      e.activeInteractId = `outpost_door_${id}`; e.handleInteract();
      if (d.open) failures.push([id, 'outpost door did not close']);
      const p = new Vector3((d.collider.minX + d.collider.maxX) / 2, 0, (d.collider.minZ + d.collider.maxZ) / 2), q = p.clone();
      e.resolveCollisions(q);
      if (p.distanceTo(q) < 0.2) failures.push([id, 'outpost closed door is not solid']);
      e.activeInteractId = `outpost_door_${id}`; e.handleInteract();
      if (!d.open) failures.push([id, 'outpost door did not reopen']);
    }
    e.activeInteractId = 'mosque_door'; e.handleInteract();
    if (!e.mosqueDoorOpen) failures.push(['mosque', 'door did not open']);
    const mosque = new Vector3(-7.1, 0, 0.3), q = mosque.clone();
    e.resolveCollisions(q);
    if (q.distanceTo(mosque) > 0.2) failures.push(['mosque', 'doorway obstructed', q.distanceTo(mosque)]);
    return { count: e.world.homes.length, failures };
  });
  assert.equal(result.count, 22);
  assert.deepEqual(result.failures, []);
  const ray = await page.evaluate(async () => {
    const e = window.fixture, h = e.world.homes[0];
    h.open = false; h.door.rotation.y = 0;
    const target = e.world.interactables.find(t => t.id === 'home_door_0');
    const v = new (await import('/node_modules/three/build/three.module.js')).Vector3(0, 0, h.spec.d / 2 + 1.2);
    v.applyAxisAngle(new (await import('/node_modules/three/build/three.module.js')).Vector3(0, 1, 0), h.spec.rotY).add(h.root.position);
    e.playerPos.copy(v); e.resolveCollisions(e.playerPos);
    e.camera.position.copy(e.playerPos); e.camera.position.y += 1.66;
    e.scene.updateMatrixWorld(true);
    const point = target.mesh.getWorldPosition(v.clone());
    e.yaw = e.targetYaw = Math.atan2(e.playerPos.x - point.x, e.playerPos.z - point.z);
    e.pitch = e.targetPitch = Math.atan2(point.y - e.camera.position.y, Math.hypot(point.x - e.playerPos.x, point.z - e.playerPos.z));
    e.camera.rotation.set(e.pitch, e.yaw, 0, 'YXZ');
    for (let i = 0; i < 3; i++) { e.elapsedTime += 0.07; e.updateSimulation(0.07); e.scene.updateMatrixWorld(true); }
    return e.activeInteractId;
  });
  assert.equal(ray, 'home_door_0', 'real ray must reach the door');
  await page.evaluate(() => { fixture.world.homes[0].open = true; fixture.world.outpostDoors.school.open = false; fixture.mosqueDoorOpen = true; fixture.triggerAutoSave(true); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await btn('Devam et').click(); await btn('Duraklat').waitFor();
  assert.deepEqual(await page.evaluate(() => [fixture.world.homes[0].open, fixture.world.outpostDoors.school.open, fixture.mosqueDoorOpen]), [true, false, true]);
  console.log(`OK: ${result.count + 2} empty houses, doors, collisions and save restoration`);
} finally { await browser.close(); }
