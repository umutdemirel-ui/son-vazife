// The fourth-night classroom event must play on the board and persist across reloads.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:-38.7,z:-48.5,yaw:0,pitch:0,elapsed:120,ritual:{night:4,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.mouse.move(320,200);await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.waitForFunction(()=>{const s=window.__dermanliTest.schoolChalk();return s.visible&&s.seen&&s.progress>.2;},null,{timeout:20000});
 const start=await page.evaluate(()=>window.__dermanliTest.schoolChalk());
 await page.waitForFunction(before=>{const s=window.__dermanliTest.schoolChalk();return s.visible&&s.progress>before+.1;},start.progress,{timeout:8000});
 if(process.env.SCHOOL_SCREENSHOT)await page.screenshot({path:process.env.SCHOOL_SCREENSHOT,timeout:90000});
 await page.waitForFunction(()=>!window.__dermanliTest.schoolChalk().visible,null,{timeout:15000});
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);await page.waitForTimeout(1200);
 const state=await page.evaluate(()=>window.__dermanliTest.schoolChalk());
 if(!state.seen||state.visible)throw Error(`School event replayed after reload: ${JSON.stringify(state)}`);
 if(errors.length)throw Error(errors.join('\n'));console.log('Fourth-night classroom chalk moves on the board and remains seen after reload.');
}finally{await browser.close();}
