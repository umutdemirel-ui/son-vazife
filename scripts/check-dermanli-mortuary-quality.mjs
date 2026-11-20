// Desktop SwiftShader comparison of mortuary visibility, supports and approach routes.
// Set SCREENSHOT_DIR to retain exterior/interior images for manual review.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const imageDir=process.env.SCREENSHOT_DIR;
if(imageDir)await mkdir(imageDir,{recursive:true});
try{
 for(const quality of ['low','high']){
  const context=await browser.newContext({viewport:{width:640,height:400},deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');
  for(const [view,x,z] of [['exterior',27.9,-22.8],['interior',21.1,-22.8]]){
   await page.evaluate(({quality,x,z})=>{
    localStorage.setItem('son_vazife_controls_v1',JSON.stringify({graphicsQuality:quality,mouseSensitivity:1,invertY:false,lookSmoothing:true,crouchToggle:true}));
    localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x,z,yaw:Math.PI/2,pitch:0,elapsed:120,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}}));
   },{quality,x,z});
   await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
   await page.waitForFunction(({quality,x,z})=>{const r=window.__dermanliTest.renderInfo();return r.quality===quality&&Math.abs(r.camera.x-x)<.01&&Math.abs(r.camera.z-z)<.01;},{quality,x,z},{timeout:60000});
   const r=await page.evaluate(()=>window.__dermanliTest.renderInfo()),expected=quality==='low'?.8:1;
   if(Math.abs(r.pixelRatio-expected)>.001||Math.abs(r.width-640*expected)>1)throw Error(`Wrong ${quality} render size: ${JSON.stringify(r)}`);
   const supports=await page.evaluate(()=>window.__dermanliTest.stationSupport());
   if(Object.keys(supports).length!==5||Object.values(supports).some(gap=>gap===null||Math.abs(gap)>.035))throw Error(`Unsupported station: ${JSON.stringify(supports)}`);
   const windows=await page.evaluate(()=>window.__dermanliTest.mortuaryWindows());
   if(windows.some(hits=>!hits.some(h=>h.transparent&&h.opacity<.5)||hits.some(h=>!h.transparent)))throw Error(`Blocked windows: ${JSON.stringify(windows)}`);
   if(imageDir){
    await page.getByText('Oyuna dönmek için görüntüye tıkla').evaluate(e=>e.style.display='none');
    const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');
    await page.screenshot({path:`${imageDir}/mortuary-${quality}-${view}.png`,timeout:90000});
   }
   if(view==='interior'){
    for(const id of ['soap','ewer','camphor','shroud','candle','slab','bucket','arrival']){
     const result=await page.evaluate(id=>window.__dermanliTest.walkToTarget(id),id);
     if(result!=='ok')throw Error(`${quality} ${id}: ${result}`);
    }
   }
  }
  if(errors.length)throw Error(errors.join('\n'));await context.close();
 }
 console.log('Mortuary desktop low/high: views rendered, stations supported, windows clear, and collision-resolved routes reachable.');
}finally{await browser.close();}
