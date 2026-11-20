// Compare the six real floors/door leaves with collision and exercise the gassal entrance by keyboard.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:19.2,z:28.5,yaw:0,pitch:0,elapsed:0,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 const audit=await page.evaluate(()=>window.__dermanliTest.homeEntranceAudit());
 if(audit.length!==6||audit.some(h=>h.floor==null||Math.abs(h.floor-h.walking)>.002||h.doorBlocked<.32||h.entryShift>.001))throw Error(`Home entrance mismatch: ${JSON.stringify(audit)}`);
 await page.mouse.move(320,200);await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.keyboard.down('w');await page.waitForFunction(()=>{const s=window.__dermanliTest.homeWalk();return s.z<25.9&&s.floor!==null;},null,{timeout:30000});await page.keyboard.up('w');
 const inside=await page.evaluate(()=>window.__dermanliTest.homeWalk());
 if(Math.abs(inside.foot-inside.floor)>.01)throw Error(`Walking foot does not match home floor: ${JSON.stringify(inside)}`);
 if(process.env.SCREENSHOT_DIR){await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/gassal-home.png`,timeout:90000});}
 if(errors.length)throw Error(errors.join('\n'));console.log(`Six house entrances and keyboard walking verified: ${JSON.stringify(inside)}`);
}finally{await browser.close();}
