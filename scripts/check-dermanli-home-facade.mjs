// Check actual glass and collision on every school and house side window; optionally record the exterior.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:26.2,z:23.2,yaw:Math.PI/2,pitch:0,elapsed:0,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
 await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 const windows=await page.evaluate(()=>window.__dermanliTest.homeSideWindows());
 if(windows.length!==6||windows.some(pair=>pair.length!==2||pair.some(w=>!w.hits.some(h=>h.transparent&&h.opacity<.5)||w.hits.some(h=>!h.transparent)||w.blocked<.32)))throw Error(`Window mismatch: ${JSON.stringify(windows)}`);
 if(process.env.HOME_FACADE_SCREENSHOT){
  await page.waitForFunction(()=>Math.abs(window.__dermanliTest.renderInfo().camera.x-26.2)<.01,null,{timeout:60000});await page.waitForTimeout(1500);
  const overlay=page.getByText('Oyuna dönmek için görüntüye tıkla');if(await overlay.count())await overlay.evaluate(e=>e.style.display='none');
  const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');
  await page.screenshot({path:process.env.HOME_FACADE_SCREENSHOT,timeout:90000});
 }
 if(errors.length)throw Error(errors.join('\n'));console.log('All twelve side windows open visually and retain solid movement collision.');
}finally{await browser.close();}
