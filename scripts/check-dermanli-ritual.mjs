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
 const missing=await page.evaluate(()=>window.__dermanliTest.scanReachability());
 if(missing.length)throw Error(`Unreachable targets from the entrance: ${missing.join(', ')}`);
 const state=()=>page.evaluate(()=>window.__dermanliTest.state());
 async function action(id) {
  const result=await page.evaluate(id=>window.__dermanliTest.walkToTarget(id),id);
  if(result!=='ok') throw Error(result);
  await page.keyboard.press('e');
 }
 for (const id of ['home','school','mill','well','cemetery']) await action(id);
 const bellState=await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell);
 const bellOrders=[[0,1,2],[0,2,1],[1,0,2],[2,1,0]];
 for(const index of bellOrders[bellState.seed])await action(`bell_${index}`);
 if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell.solved)))throw Error('Bell puzzle not solved');
 await action('arrival');
 await page.reload();await page.getByText('DEVAM ET').click();await page.waitForFunction(()=>!!window.__dermanliTest,{timeout:60000});
 await page.locator('canvas').click({position:{x:500,y:350}});await page.waitForFunction(()=>!!document.pointerLockElement);
 if((await state()).body!=='carrying')throw Error('Carry state was not restored');
 if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_dermanli_v1')).bell.solved)))throw Error('Bell progress was not restored');
 for (let night=1;night<=5;night++) {
   const steps=['slab','candle','slab','soap','slab','soap','slab','soap','slab','soap','slab','ewer','slab','ewer','bucket','drain','camphor','slab','camphor','shroud','slab','shroud','slab','cemetery'];
   if(night>1)await action('arrival');
   for (const id of steps) await action(id);
   const s=await state(); if(night<5 && (s.night!==night+1||s.body!=='arrival')) throw Error(`night ${night} failed ${JSON.stringify(s)}`);
 }
 const end=await state();if(end.ending!=='peace')throw Error(`incorrect ending ${JSON.stringify(end)}`);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Five nights completed using collision-resolved movement and real E actions; peace ending and no page errors.');
} finally { await browser.close(); }
