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
 const wheelBefore=await page.evaluate(()=>window.__dermanliTest.millWheel());
 await page.waitForFunction(before=>Math.abs(window.__dermanliTest.millWheel()-before)>.05,wheelBefore,{timeout:15000});
 await page.keyboard.press('h'); await page.getByRole('dialog',{name:'Dermanlı haritası'}).waitFor();
 const clockBefore=await page.evaluate(()=>window.__dermanliTest.clock());
 await page.waitForTimeout(300);await page.locator('canvas').click({position:{x:10,y:10}});await page.waitForTimeout(200);
 if(await page.evaluate(()=>!!document.pointerLockElement))throw Error('Map allowed pointer lock behind the overlay');
 if((await page.evaluate(()=>window.__dermanliTest.clock()))-clockBefore>.05)throw Error('Clock advanced while the map was open');
 await page.getByRole('button',{name:'Kapat'}).click();await page.locator('canvas').click({position:{x:500,y:350}});await page.waitForFunction(()=>!!document.pointerLockElement);

 const initialSpirits=await page.evaluate(()=>window.__dermanliTest.spirits());
 if(initialSpirits.elif||initialSpirits.riza)throw Error('Late-night spirits appeared during the first day');
 await page.waitForFunction(()=>window.__dermanliTest.residentModels().every(r=>r.loaded),{timeout:60000});
 await page.waitForFunction(()=>window.__dermanliTest.coffeeResidents().length===3&&window.__dermanliTest.coffeeResidents().every(r=>r.loaded&&r.visible),null,{timeout:60000});
 if((await page.evaluate(()=>window.__dermanliTest.coffeeResidents())).filter(r=>r.seated).length!==2)throw Error('Coffeehouse seating missing');
 const coffeeSupport=await page.evaluate(()=>window.__dermanliTest.coffeeSupport());
 if(coffeeSupport.length!==10||coffeeSupport.some(gap=>gap===null||Math.abs(gap)>.02))throw Error(`Coffeehouse furniture is not on its floor: ${JSON.stringify(coffeeSupport)}`);
 await page.waitForFunction(()=>{const art=window.__dermanliTest.squareArt();return art.fountain&&art.tree;},null,{timeout:60000});
 const loaded=await page.evaluate(()=>window.__dermanliTest.verifyThreatArt());
 if(!loaded.pursuer||!loaded.scare)throw Error(`Original threat models failed to load: ${JSON.stringify(loaded)}`);
 const los=await page.evaluate(()=>{const [x,z]=window.__dermanliTest.gasilhane();return {
   outside:window.__dermanliTest.targetFrom(x-4,z-2.35,-Math.PI/2),
   inside:window.__dermanliTest.targetFrom(x-2.2,z-2,Math.atan2(.5,.35))
 };});
 if(los.outside==='soap'||los.inside!=='soap')throw Error(`Wall/soap interaction mismatch: ${JSON.stringify(los)}`);
 const homeOutside=await page.evaluate(()=>{const [x,z]=window.__dermanliTest.gassalHome();const px=x+1.6,pz=z-3.4;return window.__dermanliTest.targetFrom(px,pz,Math.PI);});
 if(homeOutside==='home')throw Error('Gassal journal can be read through the back wall');
 const barnOutside=await page.evaluate(()=>{const [x,z]=window.__dermanliTest.barn();return window.__dermanliTest.targetFrom(x+1.9,z-3.1,Math.PI);});
 if(barnOutside==='barn')throw Error('Barn record can be read through the back wall');
 const coffeeOutside=await page.evaluate(()=>{const [x,z]=window.__dermanliTest.coffee();return window.__dermanliTest.targetFrom(x,z-3.0,Math.PI);});
 if(coffeeOutside==='coffee')throw Error('Coffeehouse notice can be read through the back wall');
 const abandonedOutside=await page.evaluate(()=>{const [x,z]=window.__dermanliTest.abandonedHomes()[0];return window.__dermanliTest.targetFrom(x+1.5,z-3.0,Math.PI);});
 if(abandonedOutside==='abandoned0')throw Error('Abandoned house letter can be read through the back wall');
 const supports=await page.evaluate(()=>window.__dermanliTest.stationSupport());
 for(const [id,gap] of Object.entries(supports))if(gap===null||Math.abs(gap)>.035)throw Error(`Station ${id} floats or clips its support: ${JSON.stringify(supports)}`);
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
 for (const id of ['home','school','mosque','mill','well','coffee','coffee_cemil','coffee_salih','coffee_ferit','barn','abandoned0','abandoned1','abandoned2','abandoned3','cemetery']) await action(id);
 for(const id of ['abandoned0','abandoned1','abandoned2','abandoned3'])if(!(await state()).clues.includes(id))throw Error(`Missing abandoned house clue ${id}`);
 for(const id of ['coffee_cemil','coffee_salih','coffee_ferit'])if(!(await state()).clues.includes(id))throw Error(`Missing coffeehouse conversation ${id}`);
 if(!(await state()).clues.includes('coffee'))throw Error('Coffeehouse notice was not collected');
 if(!(await state()).clues.includes('barn'))throw Error('Barn harvest record was not collected');
 if(!(await state()).clues.includes('home'))throw Error('Gassal journal was not collected inside the house');
 if((await state()).clues.includes('school'))throw Error('Locked school record was collected before solving bells');
 if(!(await state()).clues.includes('mosque'))throw Error('Mosque record was not collected');
 const bellState=await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell);
 const bellOrders=[[0,1,2],[0,2,1],[1,0,2],[2,1,0]];
 for(const index of bellOrders[bellState.seed])await action(`bell_${index}`);
 if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell.solved)))throw Error('Bell puzzle not solved');
 await action('school');if(!(await state()).clues.includes('school'))throw Error('School record did not unlock after bells');
 await page.evaluate(()=>window.__dermanliTest.advanceToNight());
 await page.waitForFunction(()=>window.__dermanliTest.coffeeResidents().every(r=>!r.visible),null,{timeout:15000});
 const nightWheel=await page.evaluate(()=>window.__dermanliTest.millWheel());
 await page.waitForFunction(before=>Math.abs(window.__dermanliTest.millWheel()-before)>.05,nightWheel,{timeout:15000});
 await action('arrival');
 await page.reload();await page.getByText('DEVAM ET').click();await page.waitForFunction(()=>!!window.__dermanliTest,{timeout:60000});
 await page.locator('canvas').click({position:{x:500,y:350}});await page.waitForFunction(()=>!!document.pointerLockElement);
 if((await state()).body!=='carrying')throw Error('Carry state was not restored');
 if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell.solved)))throw Error('Bell progress was not restored');
 for (let night=1;night<=5;night++) {
   const steps=['slab','candle','slab','soap','slab','soap','slab','soap','slab','soap','slab','ewer','slab','ewer','bucket','drain','camphor','slab','camphor','shroud','slab','shroud','slab','cemetery'];
   if(night>1){await page.evaluate(()=>window.__dermanliTest.advanceToNight());await page.waitForFunction(()=>window.__dermanliTest.visualState().litWindows===1,null,{timeout:15000});if(night===2){for(const id of ['memory_bekci','memory_serife','memory_kenan','memory_idris'])await action(id);for(const id of ['memory_bekci','memory_serife','memory_kenan','memory_idris'])if(!(await state()).clues.includes(id))throw Error(`Missing character ${id}`);}if(night>=4){
     await page.waitForFunction(n=>{const spirits=window.__dermanliTest.spirits();return spirits.elif&&(n===4?!spirits.riza:spirits.riza);},night,{timeout:15000});
     const spirit=night===4?'elif':'riza';await action(spirit);
     if(!(await state()).clues.includes(spirit))throw Error(`Missing spirit conversation ${spirit}`);
   }await action('arrival');}
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
     if(night===1 && ['soap','ewer','bucket','camphor','shroud','drain'].includes(id)){
       const tool=id==='drain'?'bucket':id,visible=(await state()).held!==tool;
       await page.waitForFunction(({tool,visible})=>window.__dermanliTest.worldTools()[tool]===visible,{tool,visible},{timeout:15000});
     }
   }
   const s=await state(); if(night<5 && (s.night!==night+1||s.body!=='arrival')) throw Error(`night ${night} failed ${JSON.stringify(s)}`);
   await page.waitForFunction(n=>window.__dermanliTest.visualState().mounds===n,night,{timeout:15000});
   if(night<5 && (await page.evaluate(()=>window.__dermanliTest.visualState())).litWindows!==0)throw Error('Abandoned house light did not turn off at dawn');
 }
 const end=await state();if(end.ending!=='peace')throw Error(`incorrect ending ${JSON.stringify(end)}`);
 const ending=page.getByRole('region',{name:'HUZUR sonu'});await ending.waitFor();
 await ending.getByRole('button',{name:'Devam',exact:true}).click();
 if(!(await ending.innerText()).includes('köprüde ölmüştür'))throw Error('Peace revelation missing');
 await ending.getByRole('button',{name:'Devam',exact:true}).click();
 await page.waitForFunction(()=>window.__dermanliTest.endingView().x>35&&!window.__dermanliTest.endingView().master,null,{timeout:15000});
 await ending.getByRole('button',{name:'Devam',exact:true}).click();
 if(!(await ending.getByRole('heading',{name:'HUZUR'}).isVisible()))throw Error('Peace title missing');

 if(errors.length)throw Error(errors.join('\n'));
 console.log('Five nights completed using collision-resolved movement and real keyboard interactions; peace ending and no page errors.');
} finally { await browser.close(); }
