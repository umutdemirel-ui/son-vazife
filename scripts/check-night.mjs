// Developer-only campaign smoke test against Vite. Like bench-village, optionally set
// BROWSER, PLAYWRIGHT_MODULE and VILLAGE_URL. No test globals in the shipped game.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({
  executablePath: process.env.BROWSER,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
try {
  const page = await browser.newPage({ viewport: { width: 980, height: 640 }, reducedMotion: 'reduce' }),
    errors = [],
    assets = [];
  page.setDefaultTimeout(20000);
  page.setDefaultNavigationTimeout(40000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.url().includes('/assets/night/')) assets.push([r.status(), r.url()]);
  });
  const missing = process.env.MISSING_ART === '1',
    blocked = [];
  if (missing)
    await page.route('**/assets/night/**', (r) => {
      blocked.push(r.request().url());
      return r.abort();
    });
  // Freeze the loop; advance the real simulation below (including real collision/ray targets).
  await page.route('**/src/game/engine.ts*', async (r) => {
    const res = await r.fetch(),
      s = await res.text();
    assert.ok(s.includes('this.startLoop();'));
    await r.fulfill({
      response: res,
      body: s.replace(
        'this.startLoop();',
        'window.fixture = this; this.requestPointerLockSafe = () => {};',
      ),
    });
  });
  await page.goto(process.env.VILLAGE_URL || 'http://localhost:3000', { waitUntil: 'networkidle' });
  const btn = (name) => page.getByRole('button', { name, exact: typeof name === 'string' });
  await btn('Oyuna başla').click();
  await btn('Defteri aç').click();
  await page.getByRole('radio', { name: /Hacı Arif/ }).check();
  await btn('Kaydı iliştir').click();
  await btn('Bekle').click();
  assert.equal(assets.length, 0);
  await btn('Meydana çık').click();
  await btn('Duraklat').waitFor();
  const helpers = async () => {
    await page.waitForFunction(() => window.fixture?.assetsReady);
    await page.evaluate(async () => {
      const e = window.fixture,
        { groundHeightAt } = await import('/src/game/terrain.ts');
      window.aim = (id, x, z) => {
        const target = e.world.interactables.find((t) => t.id === id);
        if (!target) throw Error('missing ' + id);
        e.playerPos.set(x, groundHeightAt(x, z), z);
        const old = e.playerPos.clone();
        e.resolveCollisions(e.playerPos);
        if (old.distanceTo(e.playerPos) > 0.22)
          throw Error(`invalid approach for ${id}: ${old.toArray()} -> ${e.playerPos.toArray()}`);
        const v = target.mesh.getWorldPosition(e.playerPos.clone());
        e.playerVel.set(0, 0, 0);
        e.camera.position.copy(e.playerPos);
        e.camera.position.y += e.isCrouching ? 1.12 : 1.66;
        e.yaw = e.targetYaw = Math.atan2(e.playerPos.x - v.x, e.playerPos.z - v.z);
        e.pitch = e.targetPitch = Math.atan2(
          v.y - e.camera.position.y,
          Math.hypot(v.x - e.playerPos.x, v.z - e.playerPos.z),
        );
        e.camera.rotation.set(e.pitch, e.yaw, 0, 'YXZ');
        e.scene.updateMatrixWorld(true);
        for (let i = 0; i < 3; i++) {
          e.elapsedTime += 0.07;
          e.updateSimulation(0.07);
          e.scene.updateMatrixWorld(true);
        }
        e.renderFrame();
        return e.activeInteractId;
      };
      for (const a of Object.values(e.world.npcs)) a.pauseTimer = 999;
    });
  };
  await helpers();
  const reload = async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await btn('Devam et').click();
    await btn('Duraklat').waitFor();
    await helpers();
  };
  // Check the whole survey with the real colliders, not just teleports to destinations.
  const obstructed = await page.evaluate(async () => {
    const { CORE_LANES, OUTER_LANES } = await import('/src/game/valley.ts'),
      { pushOutsideBox } = await import('/src/game/collision.ts');
    const hits = [];
    for (const [a, b, c, d] of [...CORE_LANES, ...OUTER_LANES]) {
      const count = Math.ceil(Math.hypot(c - a, d - b) / 0.25);
      for (let i = 0; i <= count; i++) {
        const x = a + ((c - a) * i) / count,
          z = b + ((d - b) * i) / count,
          q = { x, z };
        for (const box of fixture.world.colliders) pushOutsideBox(q, box, 0.42);
        if (Math.hypot(q.x - x, q.z - z) > 0.05) {
          hits.push([x, z]);
          break;
        }
      }
    }
    return hits;
  });
  assert.deepEqual(obstructed, []);
  const aim = async (id, x, z) => {
    assert.equal(
      await page.evaluate(([id, x, z]) => window.aim(id, x, z), [id, x, z]),
      id,
      `reticle: ${id}`,
    );
  };
  const use = async (...args) => {
    await aim(...args);
    await page.keyboard.press('e');
  };
  const val = (k) => page.evaluate((k) => window.fixture[k], k);
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('son_vazife_save_v2')));
  async function form(id) {
    await page.getByRole('dialog', { name: 'Cenaze kabul defteri' }).waitFor();
    const answers = await page.evaluate(
      async (id) =>
        (await import('/src/game/registry.ts')).DELIVERY_FILES[id].fields.map((f) => f.answer),
      id,
    );
    for (const [i, a] of answers.entries()) await page.getByRole('combobox').nth(i).selectOption(a);
    await btn('Kaydı mühürle').click();
    assert.ok((await saved()).autopsyCases[id].completed);
  }
  async function doorway(id, x, z, axis, dir) {
    await use(id, x, z);
    const delta = await page.evaluate(
      ([axis, dir]) => {
        const e = fixture;
        const start = e.playerPos[axis];
        e.pitch = e.targetPitch = 0;
        e.keys.KeyW = true;
        for (let i = 0; i < 40; i++) {
          e.elapsedTime += 0.033;
          e.updateSimulation(0.033);
          e.scene.updateMatrixWorld(true);
          if (dir * (e.playerPos[axis] - start) > 2.38) break;
        }
        e.keys.KeyW = false;
        e.playerVel.set(0, 0, 0);
        return dir * (e.playerPos[axis] - start);
      },
      [axis, dir],
    );
    assert.ok(delta > 1.8, `${id}: crossed ${delta}`);
  }
  for (const t of [
    ['item_sabun', 2.53, 13.31],
    ['item_ibrik', 2.21, 12.07],
    ['item_defter', -4.2, 4.6],
    ['item_kefen', -4.55, -0.32],
  ])
    await use(...t);
  await doorway('gasil_door', -5.35, 6, 'x', -1);
  const slab = ['tenesir_slab', -8.27, 6];
  await use(...slab);
  await btn('Adli inceleme tezgâhını aç').click();
  assert.equal(await val('activeAutopsyCaseId'), 'case_arif');
  // Hit a fitted anatomical zone and photograph the real floor marker with the workbench camera.
  const examine = async (group, key) =>
    page.evaluate(
      ([group, key]) => {
        const e = fixture;
        e.updateSimulation(0.15);
        e.scene.updateMatrixWorld(true);
        const mesh = e.world.gasilAutopsy[group][key];
        const p = mesh.getWorldPosition(e.playerPos.clone()).project(e.camera),
          r = e.renderer.domElement.getBoundingClientRect();
        if (Math.abs(p.x) > 1 || Math.abs(p.y) > 1) throw Error('offscreen ' + key);
        e.handleAutopsyCanvasClick(r.x + ((1 + p.x) * r.width) / 2, r.y + ((1 - p.y) * r.height) / 2);
      },
      [group, key],
    );
  await examine('zoneMeshes', 'neck');
  await page.keyboard.press('4');
  await btn('Zemin & İzler').click();
  await examine('anomalyMeshes', 'arif_residue');
  assert.ok(
    await page.evaluate(
      () =>
        fixture.autopsyCases.case_arif.zones.neck.externalFound &&
        fixture.autopsyCases.case_arif.anomalies.arif_residue.photoDataUrl?.startsWith(
          'data:image/jpeg',
        ),
    ),
  );
  await page.keyboard.press('Escape');
  await use(...slab);
  await form('case_arif');
  await use(...slab);
  for (let i = 0; i < 2; i++) await use(...slab);
  assert.equal((await saved()).ritual.washStage, 2);
  await reload();
  assert.equal(await val('washStage'), 2);
  for (let i = 0; i < 2; i++) await use(...slab);
  assert.ok((await saved()).ritual.wash);
  await use('gasil_shutter', -12.9, 6.85);
  await use('gasil_drain', -11.7, 7.49);
  await use('vigil_candle', -12.04, 4.77);
  await use('npc_bekci', -1.05, 14.65);
  await btn(/Adli Kanıt/).click();
  await btn(/Anahtarını al ve oraya/).click();
  await doorway('clinic_door', 20.8, -28, 'x', 1);
  await use('autopsy_case_mahmut', 24.41, -28);
  await form('case_mahmut');
  await doorway('mill_door', -31.35, 8, 'x', -1);
  await use('clue_mill_ledger', -35.61, 9.12);
  await use('clue_crash_manifest', 25.2, 22.75);
  await doorway('abandoned_door', -6.06, -10.5, 'x', -1);
  await use('item_gulsuyu', -10.1, -11.13);
  await use('npc_kenan', 5.15, -16.15);
  await btn(/Rapor ve Değirmen/).click();
  await btn(/Tepesine çıkıp/).click();
  assert.equal(await val('act'), 4);
  await use('npc_idris', -27.15, -30.02);
  await btn(/Kenan İtirafı/).click();
  await btn(/Mahzen Anahtarını al ve/).click();
  await doorway('crypt_door', -32.4, -35.2, 'z', -1);
  await use('autopsy_case_unknown', -32.4, -38.02);
  await form('case_unknown');
  await doorway('muhtar_door', 5.75, -18, 'x', 1);
  await use('item_kafur', 9.66, -18.36);
  for (let i = 0; i < 5; i++) await use(...slab);
  assert.equal(await val('act'), 6);
  assert.equal(await val('screen'), 'playing');
  assert.deepEqual(
    await page.evaluate(() => {
      const w = fixture.world;
      return [
        w.gasilAutopsy.group.visible,
        w.gasil.pestemalMesh.visible,
        w.gasil.kefenWrapGroup.visible,
        w.receiving.mahmut.visible,
        w.receiving.yolcu.visible,
        w.clinic.autopsyBody.group.visible,
        w.cemetery.autopsyBody.group.visible,
      ];
    }),
    [false, false, true, true, true, false, false],
  );
  // Simulate an actual v2 save from before the new chapters, at the old final knot.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('son_vazife_save_v2'));
    s.act = 5;
    delete s.windowResolved;
    delete s.windowActive;
    delete s.finalCall;
    s.cluesDiscovered = s.cluesDiscovered.filter((id) => id !== 'clue_kenan_confession');
    localStorage.setItem('son_vazife_save_v2', JSON.stringify(s));
  });
  await reload();
  assert.equal(await val('act'), 6);
  const pageSites = [
    ['night_tag', -9.5, 7.04],
    ['night_roll', 43.2, -60.42],
    ['night_bell', 47.42, -55.65],
    ['night_bag', 48.36, -60.87],
    ['night_ticket', 56.71, 27.82],
    ['night_signal', 64.75, 33.04],
    ['night_spool', 61.5, 27.85],
    ['night_relay', -46, 29.35],
    ['night_line', -54, 42.52],
    ['night_register', 47.1, -59.0],
    ['night_memorial', -30.8, -29.9],
    ['night_verdict', 59, 27.8],
    ['night_drawing', 48.1, -60.33],
    ['night_echo', -52.35, 44.3],
    ['night_call', -8.85, 7.42],
  ];
  async function outpostCross(id) {
    const moved = await page.evaluate(async (id) => {
      const { OUTPOSTS } = await import('/src/game/valley.ts'),
        b = OUTPOSTS[id],
        e = fixture,
        front = b.z + b.d / 2;
      e.keys = { KeyW: true };
      e.playerPos.set(b.x, b.y, front + 1.4);
      e.playerVel.set(0, 0, 0);
      e.targetYaw = e.yaw = 0;
      e.targetPitch = e.pitch = 0;
      for (let i = 0; i < 30; i++) {
        e.elapsedTime += 0.033;
        e.updateSimulation(0.033);
      }
      e.keys = {};
      return e.playerPos.z < front - 0.55;
    }, id);
    assert.ok(moved, `walk-in ${id}`);
  }
  let beforeCall;
  const notes = [
    ['seyir_tahta', 46.15, -61.07],
    ['seyir_peron', 55.68, 31.95],
    ['seyir_abone', -55.2, 46.77],
    ['seyir_sef', 62.2, 33.38],
  ];
  const study = async (n) => {
    await use(...notes[n]);
    assert.ok((await saved()).cluesDiscovered.includes(notes[n][0]));
  };
  for (const [i, site] of pageSites.entries()) {
    const id = site[0];
    if (i === 1) {
      await outpostCross('school');
      await study(0);
    }
    if (i === 4) {
      await study(1);
      await study(3);
      await outpostCross('station');
    }
    if (i === 8) {
      assert.ok(!(await page.evaluate(() => fixture.world.keeper.root.visible)));
      await study(2);
      await outpostCross('exchange');
    }
    if (id === 'night_signal') {
      await use(...site);
      assert.equal(await val('nightPage'), null);
      if (await val('candleLit')) await page.keyboard.press('f');
      await page.keyboard.press('c');
    }
    if (id === 'night_call') beforeCall = await saved();
    await use(...site);
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    assert.equal(await val('nightPage'), id);
    const info = await page.evaluate(
      async (id) => (await import('/src/game/nightWatch.ts')).nightPageFor(id, fixture.puzzleSeed),
      id,
    );
    const pick = async (n) => dialog.getByRole('button', { name: info.choices[n], exact: true }).click();
    if (info.kind === 'sequence') {
      for (let n = 0; n < 3; n++) await pick(n === 0 ? (info.answer[0] + 1) % info.choices.length : info.answer[n]);
      await btn(info.action).click();
      await dialog.getByRole('alert').waitFor();
      assert.ok(!(await saved()).cluesDiscovered.includes(id));
    }
    for (const n of info.answer ?? (info.kind === 'decision' ? [0] : [])) await pick(n);
    await btn(info.action).click();
    assert.ok((await saved()).cluesDiscovered.includes(id));
    console.log(id, '→', await val('act'));
    if (i === 0) {
      await use(...site);
      await btn('Kaydı kapat').click();
      assert.equal(await val('nightPage'), null);
    }
    if (i === 3) {
      await reload();
      assert.equal(await val('act'), 7);
    }
  }
  const escape = async () =>
    page.evaluate(() => {
      const e = window.fixture;
      e.playerPos.set(59, 1.1, 34);
      e.playerVel.set(0, 0, 0);
      e.updateSimulation(0.05);
    });
  assert.equal(await val('screen'), 'playing');
  // The final choice and existing violation-based endings survive a page reload.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await btn('Devam et').click();
  await page.waitForFunction(() => window.fixture?.assetsReady);
  assert.equal(await val('screen'), 'playing');
  await escape();
  assert.equal(await val('screen'), 'ending_truth');
  for (const [violations, which, ending] of [
    [0, 1, 'ending_peace'],
    [3, 0, 'ending_twist'],
  ]) {
    await page.evaluate((s) => localStorage.setItem('son_vazife_save_v2', JSON.stringify(s)), {
      ...beforeCall,
      violations,
    });
    await reload();
    await use(...pageSites.at(-1));
    await btn(which ? /İsimleri söylemeden/ : /Mühürlü dosyaları/).click();
    await btn('Ahizeyi bırak').click();
    assert.equal(await val('screen'), 'playing');
    await escape();
    assert.equal(await val('screen'), ending);
  }
  // Isolate one encounter from the saved ending: patrol -> pursuit -> crouched darkness, then a catch.
  await page.evaluate((s) => localStorage.setItem('son_vazife_save_v2', JSON.stringify(s)), beforeCall);
  await reload();
  const caught = await page.evaluate(() => {
    const e = fixture,
      actor = e.world.karaBasma.root,
      sim = () => {
        e.elapsedTime += 0.05;
        e.updateSimulation(0.05);
      };
    sim();
    e.caughtCount = 0; e.karaCatchCooldown = 0;
    e.playerPos.set(1, 0, -15);
    e.playerVel.set(0, 0, 0);
    actor.position.set(1, 0, -18);
    e.keys = {};
    e.crouchToggled = false;
    e.candleLit = true;
    const start = actor.position.clone();
    sim();
    const followed = e.karaPatrol.pursuing && actor.position.distanceTo(start) > 0.04;
    e.crouchToggled = true;
    e.candleLit = false;
    sim();
    const hidden = !e.karaPatrol.pursuing && !e.caughtCount;
    e.crouchToggled = false;
    actor.position.set(1.08, 0, -15.8);
    sim();
    return [followed, hidden, e.caughtCount];
  });
  assert.deepEqual(caught, [true, true, 1]);
  assert.deepEqual(errors, []);
  const urls = missing ? blocked : assets.map(([, url]) => url);
  assert.equal(new Set(urls.map((url) => new URL(url).pathname)).size, 10);
  assert.ok(urls.every((url) => url.includes('/compact/')));
  assert.ok(missing ? assets.length === 0 : assets.every(([status]) => status === 200));
  console.log(
    `OK: three cases, eight chapters, fifteen records, three endings, old and new checkpoints (${missing ? 'fallback' : 'compact'}).`,
  );
} finally {
  await browser.close();
}
