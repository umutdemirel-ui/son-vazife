// Verify the fifth-night bridge footsteps fire only after actual movement stops and persist.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:48.9,z:11.7,yaw:Math.PI/2,pitch:0,elapsed:120,ritual:{night:5,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.waitForTimeout(1000);if((await page.evaluate(()=>window.__dermanliTest.bridgeEvent())).seen)throw Error('Bridge event triggered before moving');
 await page.keyboard.down('w');await page.waitForFunction(()=>window.__dermanliTest.bridgeEvent().lastMove>0,null,{timeout:15000});await page.waitForTimeout(700);
 if((await page.evaluate(()=>window.__dermanliTest.bridgeEvent())).seen)throw Error('Bridge event triggered during movement');
 await page.keyboard.up('w');await page.waitForFunction(()=>window.__dermanliTest.bridgeEvent().seen,null,{timeout:20000});
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 const event=await page.evaluate(()=>window.__dermanliTest.bridgeEvent());if(!event.seen||event.lastMove!==0)throw Error(`Bridge event did not persist: ${JSON.stringify(event)}`);
 if(errors.length)throw Error(errors.join('\n'));console.log('Bridge ghost footsteps triggered after moving and stopping, then persisted after reload.');
}finally{await browser.close();}
