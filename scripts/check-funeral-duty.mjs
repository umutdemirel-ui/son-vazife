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
 const result=await page.evaluate(async(capture)=>{
  const e=window.fixture,{groundHeightAt}=await import('/src/game/terrain.ts');
  e.act=6;e.bodyTransport='delivered';e.survivalSeconds=310;e.gasilDoorOpen=true;e.karaCatchCooldown=1e6;e.nextScareTime=Infinity;
  for(const actor of Object.values(e.world.npcs))actor.pauseTimer=999;
  e.syncVisualMeshes();
  const anchors={};let visual;
  const step=()=>{e.elapsedTime+=.07;e.updateSimulation(.07);e.scene.updateMatrixWorld(true);};
  const aim=id=>{
   const t=e.world.interactables.find(x=>x.id===id);if(!t)throw Error('missing target '+id);
   const v=t.mesh.getWorldPosition(e.playerPos.clone());
   for(const radius of [1.3,1.8,2.3,2.7])for(let i=0;i<24;i++){
    const a=i*Math.PI/12,x=v.x+Math.cos(a)*radius,z=v.z+Math.sin(a)*radius;
    e.playerPos.set(x,groundHeightAt(x,z),z);const old=e.playerPos.clone();e.resolveCollisions(e.playerPos);if(old.distanceTo(e.playerPos)>.08)continue;
    e.playerVel.set(0,0,0);e.camera.position.copy(e.playerPos);e.camera.position.y+=1.66;
    e.yaw=e.targetYaw=Math.atan2(e.playerPos.x-v.x,e.playerPos.z-v.z);e.pitch=e.targetPitch=Math.atan2(v.y-e.camera.position.y,Math.hypot(v.x-e.playerPos.x,v.z-e.playerPos.z));e.camera.rotation.set(e.pitch,e.yaw,0,'YXZ');e.scene.updateMatrixWorld(true);step();step();
    if(e.activeInteractId===id){if(!anchors[id])anchors[id]={x:e.playerPos.x,z:e.playerPos.z};return;}
   }
   throw Error(`No reachable target ${id} at ${v.toArray()} (last ${e.activeInteractId})`);
  };
  const press=code=>{e.onKeyDown(new KeyboardEvent('keydown',{code}));e.onKeyUp(new KeyboardEvent('keyup',{code}));};
  const action=id=>{aim(id);press('KeyE');};
  const work=()=>{aim('tenesir_slab');e.onKeyDown(new KeyboardEvent('keydown',{code:'KeyF'}));if(!e.dutyWork)throw Error('work blocked: '+JSON.stringify(e.funeralDuty));if(e.dutyWork.stage<3){for(const code of ['KeyA','KeyD','KeyA','KeyD'])press(code);}else for(let i=0;i<20;i++)step();e.onKeyUp(new KeyboardEvent('keyup',{code:'KeyF'}));};
  action('transport_bed'); if(!e.funeralDuty)throw Error('duty did not start');
  for(let night=1;night<=5;night++){
   if(night>1)e.survivalSeconds=Math.floor(e.survivalSeconds/600)*600+310;
   action('transport_bed');
   if(night===1){
    if(e.world.gasil.kefenWrapGroup.parent!==e.camera || !e.world.gasil.kefenWrapGroup.visible)throw Error('carried body is not visible');
    e.keys.ShiftLeft=true;e.keys.KeyW=true;for(let i=0;i<10;i++)step();
    if(e.isSprinting || Math.hypot(e.playerVel.x,e.playerVel.z)>1.82)throw Error('sprinting while carrying a body');
    e.keys.ShiftLeft=false;e.keys.KeyW=false;e.playerVel.set(0,0,0);
   }
   action('tenesir_slab');action('vigil_candle');
   if(night===1&&capture){aim('tenesir_slab');e.renderFrame();visual=e.renderer.domElement.toDataURL('image/png');}
   work();
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
  // Flood-fill collision-free player positions. This is a geometric survey, not
  // a substitute for human navigation: each endpoint was also raycast above.
  e.gasilDoorOpen=true;
  const spacing=.4,x0=-46,z0=-42,nx=121,nz=146;
  const valid=new Int8Array(nx*nz), seen=new Uint8Array(nx*nz),q=e.playerPos.clone();
  const allowed=(ix,iz)=>{
   if(ix<0||iz<0||ix>=nx||iz>=nz)return false;
   const k=iz*nx+ix;if(valid[k])return valid[k]===1;
   const x=x0+ix*spacing,z=z0+iz*spacing;q.set(x,groundHeightAt(x,z),z);e.resolveCollisions(q);
   valid[k]=Math.hypot(q.x-x,q.z-z)<.012?1:-1;return valid[k]===1;
  };
  const candidates=point=>{
   const out=[];const ix=Math.round((point.x-x0)/spacing),iz=Math.round((point.z-z0)/spacing);
   for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){
    const x=ix+a,z=iz+b;if(allowed(x,z)&&Math.hypot(x0+x*spacing-point.x,z0+z*spacing-point.z)<.65)out.push(z*nx+x);
   }return out;
  };
  const queue=candidates(anchors.transport_bed);if(!queue.length)throw Error('no walkable starting point near bed');
  for(const k of queue)seen[k]=1;
  for(let n=0;n<queue.length;n++){
   const k=queue[n],x=k%nx,z=Math.floor(k/nx);
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const a=x+dx,b=z+dz,idx=b*nx+a;
    if(allowed(a,b)&&!seen[idx]){seen[idx]=1;queue.push(idx);}
   }
  }
  for(const [id,point] of Object.entries(anchors))if(!candidates(point).some(k=>seen[k]))throw Error('no collision-free route to '+id+' '+JSON.stringify(point));
  // Exercise the actual movement integrator and collision through the open door
  // while carrying: start outdoors, cross inside, then return to the courtyard.
  const finalDuty=e.funeralDuty, saved=localStorage.getItem('son_vazife_save_v2');
  e.funeralDuty={...finalDuty,body:'carrying'};e.syncVisualMeshes();
  e.playerPos.set(-6.3,groundHeightAt(-6.3,6),6);e.playerVel.set(0,0,0);
  e.yaw=e.targetYaw=Math.PI/2;e.keys.KeyW=true;e.keys.ShiftLeft=true;
  for(let i=0;i<45&&e.playerPos.x>-8.2;i++)step();
  if(e.playerPos.x>-8.2||e.isSprinting)throw Error('could not carry body through open entrance: '+e.playerPos.x);
  e.keys.KeyW=false;e.keys.ShiftLeft=false;for(let i=0;i<8;i++)step();
  e.yaw=e.targetYaw=-Math.PI/2;e.keys.KeyW=true;
  for(let i=0;i<55&&e.playerPos.x<-6.3;i++)step();
  if(e.playerPos.x<-6.3)throw Error('could not return through entrance: '+e.playerPos.x);
  e.keys.KeyW=false;e.funeralDuty=finalDuty;e.syncVisualMeshes();localStorage.setItem('son_vazife_save_v2',saved);
  return {duty:e.funeralDuty,save:JSON.parse(localStorage.getItem('son_vazife_save_v2')).funeralDuty,anchors:Object.keys(anchors),walkable:queue.length,visual};
 },Boolean(process.env.CAPTURE_DUTY));
 if(result.visual){const {writeFileSync}=await import('node:fs');writeFileSync(process.env.CAPTURE_DUTY,Buffer.from(result.visual.split(',')[1],'base64'));}
 assert.equal(result.duty.body,'done');assert.deepEqual(result.save,result.duty);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'DEVAM ET'}).click();
 await page.getByRole('button',{name:'Duraklat'}).waitFor({timeout:120000});
 await page.waitForFunction(()=>window.fixture?.assetsReady,{timeout:120000});
 assert.deepEqual(await page.evaluate(()=>window.fixture.funeralDuty),result.duty);assert.deepEqual(errors,[]);
 console.log(`Five duties passed via targets and keyboard; saves resumed; collision survey connected ${result.anchors.length} targets (${result.walkable} grid points).`);
} finally {await browser.close();}
