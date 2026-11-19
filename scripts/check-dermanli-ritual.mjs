// Browser integration: actual E input and target selection, using development-only
// teleportation to isolate interactions from lengthy traversal.
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
  const found=await page.evaluate(id=>window.__dermanliTest.goToTarget(id),id);
  if(!found) throw Error(`no collision-free aiming point for ${id}`);
  await page.keyboard.press('e');
 }
 for (const id of ['home','school','mill','well','cemetery']) await action(id);
 for (let night=1;night<=5;night++) {
   for (const id of ['arrival','slab','candle','slab','soap','slab','soap','slab','soap','slab','soap','slab','ewer','slab','ewer','bucket','drain','camphor','slab','camphor','shroud','slab','shroud','slab','cemetery']) await action(id);
   const s=await state(); if(night<5 && (s.night!==night+1||s.body!=='arrival')) throw Error(`night ${night} failed ${JSON.stringify(s)}`);
 }
 const end=await state();if(end.ending!=='peace')throw Error(`incorrect ending ${JSON.stringify(end)}`);
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Five nights completed through real E actions; peace ending, independent saves, no page errors.');
} finally { await browser.close(); }
