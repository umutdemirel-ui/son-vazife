// Measure entrance supports and bell-rack connections and clearance in the actual scene.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 const audit=await page.evaluate(()=>window.__dermanliTest.entranceBellAudit());
 if(audit.supports.length!==5||audit.supports.some(p=>p.ground==null||!p.collider||Math.abs(p.base-p.ground)>.015))throw Error(`Ground or collider mismatch: ${JSON.stringify(audit)}`);
 if(audit.hangers.length!==3||audit.hangers.some(h=>Math.abs(h.bottomGap)>.002||Math.abs(h.railGap)>.002||!h.connected||h.approachShift>.001||h.radius<.8))throw Error(`Bell mounting or approach mismatch: ${JSON.stringify(audit)}`);
 if(audit.gateSamples.some(v=>v>.001))throw Error(`Entrance blocked: ${JSON.stringify(audit)}`);
 if(process.env.SCREENSHOT_DIR){
  await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
  for(const [name,x,z,yaw] of [['entrance',0,81,0],['bells',-45.1,-41.8,0]]){
   await page.evaluate(({x,z,yaw})=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x,z,yaw,pitch:0,elapsed:0,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})),{x,z,yaw});
   await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
   await page.waitForFunction(({x,z})=>{const c=window.__dermanliTest.renderInfo().camera;return Math.abs(c.x-x)<.01&&Math.abs(c.z-z)<.01;},{x,z},{timeout:60000});
   await page.waitForTimeout(1500);const overlay=page.getByText('Oyuna dönmek için görüntüye tıkla');if(await overlay.count())await overlay.evaluate(e=>e.style.display='none');
   const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');
   await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/${name}.png`,timeout:90000});
  }
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(`Entrance and bell rack verified: ${JSON.stringify(audit)}`);
}finally{await browser.close();}
