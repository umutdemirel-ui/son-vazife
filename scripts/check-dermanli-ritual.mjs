// Browser integration: actual E input and target selection, using development-only
// accelerated movement through the same collision resolver used by the player.
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER || undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1024,height:700}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL || 'http://localhost:3016/');
 await page.getByText('KÖYE GİR').click(); await page.waitForFunction(()=>!!window.__dermanliTest,{timeout:60000});
 await page.locator('canvas').click({position:{x:500,y:350}}); await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.keyboard.press('h'); await page.getByRole('dialog',{name:'Dermanlı haritası'}).waitFor();
 const clockBefore=await page.evaluate(()=>window.__dermanliTest.clock());
 await page.waitForTimeout(300);await page.locator('canvas').click({position:{x:10,y:10}});await page.waitForTimeout(200);
 if(await page.evaluate(()=>!!document.pointerLockElement))throw Error('Map allowed pointer lock behind the overlay');
 if((await page.evaluate(()=>window.__dermanliTest.clock()))-clockBefore>.05)throw Error('Clock advanced while the map was open');
 await page.getByRole('button',{name:'Kapat'}).click();await page.locator('canvas').click({position:{x:500,y:350}});await page.waitForFunction(()=>!!document.pointerLockElement);

 await page.waitForFunction(()=>window.__dermanliTest.residentModels().every(r=>r.loaded),{timeout:60000});
 const loaded=await page.evaluate(()=>window.__dermanliTest.verifyThreatArt());
 if(!loaded.pursuer||!loaded.scare)throw Error(`Original threat models failed to load: ${JSON.stringify(loaded)}`);
 const missing=await page.evaluate(()=>window.__dermanliTest.scanReachability());
 if(missing.length)throw Error(`Unreachable targets from the entrance: ${missing.join(', ')}`);
 const state=()=>page.evaluate(()=>window.__dermanliTest.state());
 async function action(id) {
  const result=await page.evaluate(id=>window.__dermanliTest.walkToTarget(id),id);
  if(result!=='ok') throw Error(result);
  const before=await state();
  if(id==='slab'&&before.body==='slab'&&before.stage<6){await page.keyboard.down('f');if(before.stage<=2){for(const key of ['a','d','a','d'])await page.keyboard.press(key);}
    await page.waitForFunction(before=>{const s=window.__dermanliTest.state();return s.stage!==before.stage||s.soaped!==before.soaped;},before,{timeout:12000});await page.keyboard.up('f');}
  else await page.keyboard.press('e');
 }
 for (const id of ['home','school','mosque','mill','well','cemetery']) await action(id);
 if((await state()).clues.includes('school'))throw Error('Locked school record was collected before solving bells');
 if(!(await state()).clues.includes('mosque'))throw Error('Mosque record was not collected');
 const bellState=await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell);
 const bellOrders=[[0,1,2],[0,2,1],[1,0,2],[2,1,0]];
 for(const index of bellOrders[bellState.seed])await action(`bell_${index}`);
 if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell.solved)))throw Error('Bell puzzle not solved');
 await action('school');if(!(await state()).clues.includes('school'))throw Error('School record did not unlock after bells');
 await page.evaluate(()=>window.__dermanliTest.advanceToNight());
 await action('arrival');
 await page.reload();await page.getByText('DEVAM ET').click();await page.waitForFunction(()=>!!window.__dermanliTest,{timeout:60000});
 await page.locator('canvas').click({position:{x:500,y:350}});await page.waitForFunction(()=>!!document.pointerLockElement);
 if((await state()).body!=='carrying')throw Error('Carry state was not restored');
 if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell.solved)))throw Error('Bell progress was not restored');
 for (let night=1;night<=5;night++) {
   const steps=['slab','candle','slab','soap','slab','soap','slab','soap','slab','soap','slab','ewer','slab','ewer','bucket','drain','camphor','slab','camphor','shroud','slab','shroud','slab','cemetery'];
   if(night>1){await page.evaluate(()=>window.__dermanliTest.advanceToNight());if(night===2){for(const id of ['memory_bekci','memory_serife','memory_kenan','memory_idris'])await action(id);for(const id of ['memory_bekci','memory_serife','memory_kenan','memory_idris'])if(!(await state()).clues.includes(id))throw Error(`Missing character ${id}`);}await action('arrival');}
   for (const [index,id] of steps.entries()) {
     if(night===1 && index===1){
       // At the slab, neither E nor F plus strokes may wash an unlit body.
       await page.keyboard.press('e');await page.keyboard.down('f');for(const key of ['a','d','a','d'])await page.keyboard.press(key);await page.keyboard.up('f');
       if((await state()).stage!==0)throw Error('Washing proceeded without the candle');
     }
     if(night===1 && index===2){
       // Repeating one direction and releasing F must not finish a scrub.
       await page.keyboard.down('f');for(const key of ['a','a','a','a'])await page.keyboard.press(key);await page.keyboard.up('f');
       if((await state()).stage!==0)throw Error('Repeated direction completed a scrub');
     }
     await action(id);
   }
   const s=await state(); if(night<5 && (s.night!==night+1||s.body!=='arrival')) throw Error(`night ${night} failed ${JSON.stringify(s)}`);
 }
 const end=await state();if(end.ending!=='peace')throw Error(`incorrect ending ${JSON.stringify(end)}`);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Five nights completed using collision-resolved movement and real keyboard interactions; peace ending and no page errors.');
} finally { await browser.close(); }
