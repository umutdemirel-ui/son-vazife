// Test the well event through real night play, motion, expiration and saved replay prevention.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:-42,z:-3.5,yaw:0,pitch:0,elapsed:120,ritual:{night:2,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.mouse.move(320,200);await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.waitForFunction(()=>{const e=window.__dermanliTest.wellEvent();return e.seen&&e.remaining>0&&Math.abs(e.swing)>.03;},null,{timeout:20000});
 if(process.env.WELL_SCREENSHOT){await page.evaluate(()=>window.__dermanliTest.resetViewForScreenshot());await page.waitForTimeout(300);await page.screenshot({path:process.env.WELL_SCREENSHOT,timeout:90000});}
 await page.waitForFunction(()=>{const e=window.__dermanliTest.wellEvent();return e.remaining===0&&e.swing===0;},null,{timeout:15000});
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);await page.waitForTimeout(1500);
 const e=await page.evaluate(()=>window.__dermanliTest.wellEvent());if(!e.seen||e.remaining>0||e.swing!==0)throw Error(`Well event replayed: ${JSON.stringify(e)}`);
 if(errors.length)throw Error(errors.join('\n'));console.log('Well rope swung during the event and remained still after save/reload.');
}finally{await browser.close();}
