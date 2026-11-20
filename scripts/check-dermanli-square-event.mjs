// Genuine night play: visible square fountain jet, then no repeat after reload.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:0,z:18,yaw:0,pitch:0,elapsed:120,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
 await page.mouse.move(320,200);await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.mouse.move(320,200);await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.waitForFunction(()=>{const e=window.__dermanliTest.squareWaterEvent();return e.visible&&e.seen;},null,{timeout:20000});
 if(process.env.SQUARE_SCREENSHOT){await page.evaluate(()=>window.__dermanliTest.resetViewForScreenshot());await page.waitForTimeout(300);const overlay=page.getByText('Oyuna dönmek için görüntüye tıkla');if(await overlay.count())await overlay.evaluate(e=>e.style.display='none');await page.screenshot({path:process.env.SQUARE_SCREENSHOT,timeout:90000});}
 await page.waitForFunction(()=>!window.__dermanliTest.squareWaterEvent().visible,null,{timeout:15000});
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);await page.waitForTimeout(1500);
 const state=await page.evaluate(()=>window.__dermanliTest.squareWaterEvent());if(!state.seen||state.visible)throw Error(`Square water event replayed after reload: ${JSON.stringify(state)}`);
 if(errors.length)throw Error(errors.join('\n'));console.log('Square water jet triggered while facing the fountain, stopped, and remained seen after reload.');
}finally{await browser.close();}
