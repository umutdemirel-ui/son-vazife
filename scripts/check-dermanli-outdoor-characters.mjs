// Check loaded and failed-load fallback outdoor residents and memories against terrain and colliders.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const errors=[];
 if(process.env.SCREENSHOT_DIR)await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
 for(const mode of ['loaded','fallback'])for(const [phase,x,z,yaw,elapsed,night] of [['day',2.8,67,Math.PI,0,1],['night',-4,21,0,120,2]]){
  const context=await browser.newContext({viewport:{width:640,height:400}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  let blocked=0;if(mode==='fallback')await page.route('**/assets/residents/**',route=>{blocked++;return route.abort();});
  await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
  await page.evaluate(({x,z,yaw,elapsed,night})=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x,z,yaw,pitch:0,elapsed,ritual:{night,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})),{x,z,yaw,elapsed,night});
  await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();
  await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
  await page.waitForFunction(({x,z})=>{const c=window.__dermanliTest.renderInfo().camera;return Math.abs(c.x-x)<.01&&Math.abs(c.z-z)<.01;},{x,z},{timeout:60000});
  await page.waitForFunction(mode=>window.__dermanliTest.outdoorCharacterAudit().every(r=>mode==='loaded'?r.loaded:r.fallbackBase!==null&&!r.loaded),mode,{timeout:60000});
  if(mode==='fallback'&&blocked===0)throw Error('No resident model requests were blocked');
  await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
  await page.waitForFunction(phase=>window.__dermanliTest.outdoorCharacterAudit().filter(r=>r.visible).length===(phase==='day'?3:4),phase,{timeout:30000});
  const audit=await page.evaluate(()=>window.__dermanliTest.outdoorCharacterAudit());
  if(audit.length!==7||audit.some(r=>r.ground==null||(mode==='loaded'?!r.loaded:r.loaded||r.fallbackBase==null)||Math.abs(r.root-r.ground)>.002||r.clearance>.005))throw Error(`${mode} ${phase} placement: ${JSON.stringify(audit)}`);
  if(audit.filter(r=>r.visible).some(r=>{const base=mode==='loaded'?r.base:r.fallbackBase;return base==null||Math.abs(base-r.ground)>.035;}))throw Error(`${mode} ${phase} visible model foot support: ${JSON.stringify(audit)}`);
  if(process.env.SCREENSHOT_DIR){await page.waitForTimeout(1000);const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/${mode}-${phase}.png`,timeout:90000});}
  if(mode==='fallback'){
   const id=phase==='day'?'villager_osman':'memory_bekci';
   const result=await page.evaluate(id=>window.__dermanliTest.walkToTarget(id),id);if(result!=='ok')throw Error(`Fallback ${id}: ${result}`);
   await page.keyboard.press('e');await page.waitForFunction(id=>window.__dermanliTest.state().clues.includes(id),id,{timeout:10000});
  }
  await page.evaluate(()=>document.exitPointerLock());await context.close();
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('Loaded and failed-load fallback: three daytime villagers and four nighttime memories grounded, clear and correctly visible; fallback conversations remain usable.');
}finally{await browser.close();}
