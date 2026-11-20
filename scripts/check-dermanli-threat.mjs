// Real render-loop check for the textured pursuer, its movement and grounded stride.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:0,z:78.8,yaw:0,pitch:0,elapsed:120,ritual:{night:2,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.locator('canvas').click();await page.waitForFunction(()=>!!document.pointerLockElement);
 // Night starts loading the models before the first scare, without forcing a load here.
 await page.waitForFunction(()=>window.__dermanliTest.threatState().loaded,null,{timeout:60000});
 await page.evaluate(()=>window.__dermanliTest.primeThreat());
 await page.waitForFunction(()=>{const t=window.__dermanliTest.threatState();return t.active&&t.visible&&t.gap!==null&&Math.abs(t.gap)<.03;},null,{timeout:15000});
 const first=await page.evaluate(()=>window.__dermanliTest.threatState());
 await page.waitForFunction(x=>{const t=window.__dermanliTest.threatState();return t.active&&t.x<x-.25&&t.gap!==null&&Math.abs(t.gap)<.03;},first.x,{timeout:15000});
 if(errors.length)throw Error(errors.join('\n'));console.log('Night model preloaded; visible pursuer advanced with grounded feet.');
}finally{await browser.close();}
