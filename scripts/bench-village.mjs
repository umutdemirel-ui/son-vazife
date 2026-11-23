// Developer-only benchmark. No hooks or test globals are included in the shipped application.
// Start Vite, then BROWSER=/path/to/chromium node scripts/bench-village.mjs (optional: npm install --no-save playwright-core).
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({
  executablePath: process.env.BROWSER,
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    ...(process.env.GPU === 'native'
      ? ['--enable-gpu']
      : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']),
  ],
});
const base = process.env.VILLAGE_URL || 'http://localhost:3000';
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
  await page.route('**/__bench', (r) =>
    r.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><style>*{margin:0}#world{width:100vw;height:100vh}</style><div id="world"></div>',
    }),
  );
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 800));
  });
  await page.goto(base + '/__bench');
  const setup = await page.evaluate(async (preset) => {
    performance.setResourceTimingBufferSize(2000);
    const { SonVazifeEngine: E } = await import('/src/game/engine.ts');
    const { storeControls, storeMuted } = await import('/src/game/preferences.ts');
    const { DEFAULT_CONTROL_SETTINGS } = await import('/src/game/types.ts');
    storeControls({ ...DEFAULT_CONTROL_SETTINGS, graphicsQuality: preset });
    storeMuted(true);
    // No background draws during the fixed-camera samples. Then resume the actual game loop.
    const loop = E.prototype.startLoop;
    E.prototype.startLoop = () => {};
    const t = performance.now();
    const e = new E(document.querySelector('#world'), () => {});
    window.engine = e;
    E.prototype.startLoop = loop;
    e.startNewGame();
    e.requestPointerLockSafe = () => {};
    for (const a of Object.values(e.world.npcs)) a.pauseTimer = 1e5;
    return { ctorMs: Math.round(performance.now() - t), tier: e.resolvedQualityTier };
  }, process.env.PRESET || 'auto');
  await page.waitForFunction(
    () => engine.assetsReady && Object.values(engine.world.npcs).every((a) => a.visual.mixer),
    undefined,
    { timeout: 45000 },
  );
  await page.waitForLoadState('networkidle');
  const result = await page.evaluate(
    async ({ sampleWidth, night }) => {
      const e = window.engine,
        r = e.renderer,
        gl = r.getContext();
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      const bytes = new Uint8Array(4);
      const frame = () => {
        e.updateSimulation(1 / 30);
        e.renderFrame();
        gl.readPixels(2, 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      };
      const { exteriorFloorAt } = await import('/src/game/terrain.ts');
      const view = (x, z, yaw, pitch) => {
        e.playerPos.set(x, exteriorFloorAt(x, z), z);
        e.camera.position.copy(e.playerPos);
        e.camera.position.y += 1.66;
        e.yaw = e.targetYaw = yaw;
        e.pitch = e.targetPitch = pitch;
        e.camera.rotation.set(pitch, yaw, 0, 'YXZ');
      };
      if (sampleWidth) {
        r.setPixelRatio(sampleWidth / 960);
        r.setSize(960, 600);
      }
      const sampleBuffer = [r.domElement.width, r.domElement.height];
      const rows = [];
      // Optional late-watch survey: fixed-camera CPU/GPU readback AFTER all night art is ready.
      // This deliberately warms the entire night pack; its byte count is not a start-up measurement.
      if (night) {
        const { NIGHT_MODELS } = await import('/src/game/nightArt.ts');
        await Promise.all(NIGHT_MODELS.map((id) => e.world.nightArt.request(id)));
        e.stepShroudDone = true;
        e.autopsyCases.case_mahmut.completed = e.autopsyCases.case_unknown.completed = true;
        e.vigilLit = true;
        e.karaCatchCooldown = 1e5;
      }
      const sites = night
        ? [
            ['Kabul sedyeleri', -7.89, 5.93, Math.PI / 2, -0.22, 6],
            ['Sarı Mektep', 45.9, -57.5, 0, -0.1, 6],
            ['Son peron', 63.77, 34.67, 0.44, -0.16, 7],
            ['Sırt Santrali', -54, 42.9, 0, -0.3, 8],
          ]
        : [
            ['Meydan', 0, 23, 0, -0.04],
            ['Çeşme', 1.6, 12.35, -Math.PI / 2, -0.11],
            ['Gasilhane', -8.32, 6, Math.PI / 2, -0.24],
          ];
      for (const [place, x, z, yaw, pitch, act] of sites) {
        if (night) {
          e.act = act;
          e.syncVisualMeshes();
        }
        view(x, z, yaw, pitch);
        for (let n = 0; n < 3; n++) frame();
        const samples = [];
        for (let n = 0; n < 11; n++) {
          await new Promise((res) => setTimeout(res, 0));
          const start = performance.now();
          frame();
          samples.push(performance.now() - start);
        }
        samples.sort((a, b) => a - b);
        rows.push({
          place,
          medianMs: +samples[5].toFixed(1),
          p90Ms: +samples[9].toFixed(1),
          draws: r.info.render.calls,
          triangles: r.info.render.triangles,
        });
      }
      if (sampleWidth) {
        e.lastAppliedQualityKey = '';
        e.syncQualityTierFromSettings();
      }
      if (night) {
        e.act = 7;
        e.syncVisualMeshes();
        view(63.77, 34.67, 0.44, -0.16);
      } else view(0, 23, 0, -0.04);
      e.startLoop();
      await new Promise((res) => setTimeout(res, 600));
      const stamp = performance.now(),
        first = r.info.render.frame;
      await new Promise((res) => setTimeout(res, 5500));
      const submittedFps = +(
        ((r.info.render.frame - first) * 1000) /
        (performance.now() - stamp)
      ).toFixed(1);
      const files = performance
        .getEntriesByType('resource')
        .filter((e) => e.name.includes('/assets/') && e.name.startsWith(location.origin));
      const stats = {
        gpu,
        course: night ? 'Gece / peron döngüsü' : 'İlk nöbet / meydan döngüsü',
        sampleBuffer,
        loopBuffer: [r.domElement.width, r.domElement.height],
        rows,
        submittedFps,
        requests: files.length,
        assetBytes: files.reduce((a, f) => a + f.encodedBodySize, 0),
        textures: r.info.memory.textures,
        geometries: r.info.memory.geometries,
      };
      e.dispose();
      return stats;
    },
    { sampleWidth: Number(process.env.SAMPLE_WIDTH) || 0, night: process.env.NIGHT === '1' },
  );
  const out = JSON.stringify({ ...setup, ...result, errors }, null, 2);
  console.log(out);
  if (process.env.RESULT) await fs.writeFile(process.env.RESULT, out + '\n');
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
