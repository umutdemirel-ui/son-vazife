// Developer-only integration survey: real targets, keyboard controls, save and reload.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser=await chromium.launch({executablePath:process.env.BROWSER,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/game/engine.ts*',async r=>{const res=await r.fetch(),src=await res.text();assert.ok(src.includes('this.startLoop();'));await r.fulfill({response:res,body:src.replace('this.startLoop();','window.fixture = this; this.requestPointerLockSafe = () => {};')});});
 await page.goto(process.env.VILLAGE_URL || 'http://localhost:3020/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'KÖYE GİR'}).click();
 await page.getByRole('button',{name:'Duraklat'}).waitFor({timeout:120000});
 await page.waitForFunction(()=>window.fixture?.assetsReady,{timeout:120000});
 const result=await page.evaluate(async()=>{
  const e=window.fixture,{groundHeightAt}=await import('/src/game/terrain.ts');
  e.act=6;e.bodyTransport='delivered';e.survivalSeconds=310;e.gasilDoorOpen=true;e.karaCatchCooldown=1e6;e.nextScareTime=Infinity;
  for(const actor of Object.values(e.world.npcs))actor.pauseTimer=999;
  e.syncVisualMeshes();
  const step=()=>{e.elapsedTime+=.07;e.updateSimulation(.07);e.scene.updateMatrixWorld(true);};
  const aim=id=>{
   const t=e.world.interactables.find(x=>x.id===id);if(!t)throw Error('missing target '+id);
   const v=t.mesh.getWorldPosition(e.playerPos.clone());
   for(const radius of [1.3,1.8,2.3,2.7])for(let i=0;i<24;i++){
    const a=i*Math.PI/12,x=v.x+Math.cos(a)*radius,z=v.z+Math.sin(a)*radius;
    e.playerPos.set(x,groundHeightAt(x,z),z);const old=e.playerPos.clone();e.resolveCollisions(e.playerPos);if(old.distanceTo(e.playerPos)>.08)continue;
    e.playerVel.set(0,0,0);e.camera.position.copy(e.playerPos);e.camera.position.y+=1.66;
    e.yaw=e.targetYaw=Math.atan2(e.playerPos.x-v.x,e.playerPos.z-v.z);e.pitch=e.targetPitch=Math.atan2(v.y-e.camera.position.y,Math.hypot(v.x-e.playerPos.x,v.z-e.playerPos.z));e.camera.rotation.set(e.pitch,e.yaw,0,'YXZ');e.scene.updateMatrixWorld(true);step();step();
    if(e.activeInteractId===id)return;
   }
   throw Error(`No reachable target ${id} at ${v.toArray()} (last ${e.activeInteractId})`);
  };
  const press=code=>{e.onKeyDown(new KeyboardEvent('keydown',{code}));e.onKeyUp(new KeyboardEvent('keyup',{code}));};
  const action=id=>{aim(id);press('KeyE');};
  const work=()=>{aim('tenesir_slab');e.onKeyDown(new KeyboardEvent('keydown',{code:'KeyF'}));if(!e.dutyWork)throw Error('work blocked: '+JSON.stringify(e.funeralDuty));if(e.dutyWork.stage<3){for(const code of ['KeyA','KeyD','KeyA','KeyD'])press(code);}else for(let i=0;i<20;i++)step();e.onKeyUp(new KeyboardEvent('keyup',{code:'KeyF'}));};
  action('transport_bed'); if(!e.funeralDuty)throw Error('duty did not start');
  for(let night=1;night<=5;night++){
   if(night>1)e.survivalSeconds=Math.floor(e.survivalSeconds/600)*600+310;
   action('transport_bed');action('tenesir_slab');action('vigil_candle');work();
   for(let side=0;side<2;side++){
    action('wash_soap');work();action('wash_soap');work();
    if(night===1&&side===0){
     const before=JSON.stringify(e.funeralDuty);e.continueSavedGame();
     if(JSON.stringify(e.funeralDuty)!==before)throw Error('mid-wash checkpoint failed to resume');
     e.karaCatchCooldown=1e6;e.nextScareTime=Infinity;
    }
   }
   action('wash_ewer');work();action('wash_ewer');action('dirty_bucket');action('gasil_drain');action('duty_camphor');work();action('duty_camphor');action('duty_shroud');work();action('duty_shroud');action('tenesir_slab');action('duty_burial');
   if(night<5&&e.funeralDuty.night!==night+1)throw Error('night did not advance');
  }
  return {duty:e.funeralDuty,save:JSON.parse(localStorage.getItem('son_vazife_save_v2')).funeralDuty};
 });
 assert.equal(result.duty.body,'done');assert.deepEqual(result.save,result.duty);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'DEVAM ET'}).click();
 await page.getByRole('button',{name:'Duraklat'}).waitFor({timeout:120000});
 await page.waitForFunction(()=>window.fixture?.assetsReady,{timeout:120000});
 assert.deepEqual(await page.evaluate(()=>window.fixture.funeralDuty),result.duty);assert.deepEqual(errors,[]);
 console.log('Five duties passed via real scene targets and keyboard; mid-wash checkpoint and final state reloaded.');
} finally {await browser.close();}
