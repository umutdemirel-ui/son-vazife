// Ground/clearance sweep of every procedural pine and cemetery cluster in the live world.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.waitForFunction(()=>!!window.__dermanliTest.groveCemeteryAudit(),null,{timeout:90000});
 const audit=await page.evaluate(()=>window.__dermanliTest.groveCemeteryAudit());
 if(audit.count!==260||audit.missedGround||audit.missingColliders||audit.maxGap>.02||audit.minGap<-.04||audit.maxFallbackError>.001)throw Error(`Grove placement failed: ${JSON.stringify(audit)}`);
 if(audit.clusters.length!==6||audit.missingGraves||audit.maxGraveGroundDelta>.02||audit.clusters.some(g=>g.base-g.ground>.02||g.base-g.ground<-.08)||audit.gateShift>.001)throw Error(`Cemetery placement failed: ${JSON.stringify(audit)}`);
 if(audit.mounds.length!==5||audit.mounds.some(m=>Math.abs(m.center-m.ground-.06)>.001))throw Error(`Mound placement failed: ${JSON.stringify(audit.mounds)}`);
 if(process.env.SCREENSHOT_DIR){
  await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
  const tree=audit.samples[3];if(!tree)throw Error('No hillside tree to inspect');
  for(const [view,x,z,yaw] of [['grove',tree.x+4,tree.z,Math.PI/2],['cemetery',0,-48,0]]){
   await page.evaluate(({x,z,yaw})=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x,z,yaw,pitch:0,elapsed:0,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})),{x,z,yaw});
   await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
   await page.waitForFunction(({x,z})=>{const c=window.__dermanliTest.renderInfo().camera;return Math.abs(c.x-x)<.01&&Math.abs(c.z-z)<.01;},{x,z},{timeout:60000});
   await page.waitForTimeout(1600);await page.getByText('Oyuna dönmek için görüntüye tıkla').evaluate(e=>e.style.display='none');
   const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');
   await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/${view}.png`,timeout:90000});
  }
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log(`Checked ${audit.count} trees, ${audit.clusters.length*5} grave markers, five mounds and the open cemetery gate against live terrain.`);
}finally{await browser.close();}
