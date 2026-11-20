// Render several quality tiers and inspect shader errors in a real WebGL context.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser=await chromium.launch({executablePath:process.env.BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error' && /shader|webglprogram|gl_invalid/i.test(m.text()))errors.push(m.text());});
 await page.route('**/src/game/engine.ts*',async r=>{const res=await r.fetch(),s=await res.text();await r.fulfill({response:res,body:s.replace('this.startLoop();','window.fixture=this; this.requestPointerLockSafe=()=>{};')});});
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3020/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.getByRole('button',{name:'Duraklat'}).waitFor({timeout:120000});
 await page.waitForFunction(()=>window.fixture?.assetsReady,{timeout:120000});
 for(const tier of ['minimum','low','medium','high']){
  await page.evaluate(async(tier)=>{
   const e=window.fixture,{groundHeightAt}=await import('/src/game/terrain.ts');
   // Force tiers only in this fixture; real software devices keep their safe tier.
   e.isSoftwareGl=false;e.applyGraphicsQuality(tier);
   e.playerPos.set(-10.5,groundHeightAt(-10.5,4.4),4.4);e.playerVel.set(0,0,0);
   e.yaw=e.targetYaw=0;e.pitch=e.targetPitch=-.2;e.camera.rotation.set(e.pitch,e.yaw,0,'YXZ');
   e.camera.position.copy(e.playerPos);e.camera.position.y+=1.66;
   e.survivalSeconds=450;e.elapsedTime+=.1;e.updateEnvironmentVisuals(.1,true,0);e.scene.updateMatrixWorld(true);
   e.renderFrame();
  },tier);
  if(tier==='medium'||tier==='high')await page.waitForFunction(()=>!window.fixture.effectsPending,{timeout:30000});
  await page.evaluate(()=>{fixture.scene.updateMatrixWorld(true);fixture.renderFrame();});
 }
 assert.deepEqual(errors,[]);
 console.log('Lighting rendered without shader errors at minimum, low, medium and high quality.');
}finally{await browser.close();}
