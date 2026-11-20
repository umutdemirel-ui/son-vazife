// Real-scene check of the mill herb, spinning wheel, channel and stream overlap.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
 const first=await page.evaluate(()=>window.__dermanliTest.millExteriorAudit());
 await page.waitForFunction(before=>Math.abs(window.__dermanliTest.millWheel()-before)>.05,first.wheelRotation,{timeout:30000});
 const audit=await page.evaluate(()=>window.__dermanliTest.millExteriorAudit());
 if(audit.stems.length!==5||audit.stems.some(s=>s.ground==null||Math.abs(s.base-s.ground)>.01))throw Error(`Herb support: ${JSON.stringify(audit)}`);
 if(audit.samples.some(s=>s.channel==null||s.ground==null||Math.abs(s.channel-s.ground-.072)>.002)||audit.samples.at(-1).stream==null||Math.abs(audit.samples.at(-1).channel-audit.samples.at(-1).stream-.002)>.001)throw Error(`Water continuity: ${JSON.stringify(audit)}`);
 if(!audit.wheelTouchesWater||Math.abs(first.wheelRotation-audit.wheelRotation)<.01)throw Error(`Wheel not touching water or rotating: ${JSON.stringify(audit)}`);
 if(process.env.SCREENSHOT_DIR){
  await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
  await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:44,z:-53,yaw:.8,pitch:-.1,elapsed:0,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
  await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
  await page.waitForFunction(()=>{const c=window.__dermanliTest.renderInfo().camera;return Math.abs(c.x-44)<.01&&Math.abs(c.z+53)<.01;},null,{timeout:60000});await page.waitForTimeout(1500);
  const overlay=page.getByText('Oyuna dönmek için görüntüye tıkla');if(await overlay.count())await overlay.evaluate(e=>e.style.display='none');
  const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');
  await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/mill-exterior.png`,timeout:90000});
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(`Mill exterior verified: ${JSON.stringify(audit)}`);
} finally {await browser.close();}
