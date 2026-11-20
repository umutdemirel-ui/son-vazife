// Live field audit: every stalk meets an actual raised furrow and every furrow meets the field bed.
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');await page.getByText('KÖYE GİR').click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 const audit=await page.evaluate(()=>window.__dermanliTest.fieldAudit());
 if(audit.count!==260||audit.rowCount!==13||audit.missing||Math.abs(audit.minGap)>.002||Math.abs(audit.maxGap)>.002||audit.rowGaps.some(g=>g===null||Math.abs(g)>.002))throw Error(`Field support mismatch: ${JSON.stringify(audit)}`);
 if(process.env.SCREENSHOT_DIR){
  await mkdir(process.env.SCREENSHOT_DIR,{recursive:true});
  await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:30,z:79.3,yaw:0,pitch:-.18,elapsed:0,ritual:{night:1,body:'arrival',candle:false,risen:false,stage:0,soaped:false,held:'empty',dirty:false,violations:0,clues:[],ending:null}})));
  await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
  await page.waitForFunction(()=>Math.abs(window.__dermanliTest.renderInfo().camera.z-79.3)<.01,null,{timeout:60000});await page.waitForTimeout(1500);
  await page.getByText('Oyuna dönmek için görüntüye tıkla').evaluate(e=>e.style.display='none');
  const caption=page.getByText('Ustanın mektubu seni Dermanlı’ya getirdi.',{exact:false});if(await caption.count())await caption.last().evaluate(e=>e.style.display='none');
  await page.screenshot({path:`${process.env.SCREENSHOT_DIR}/field.png`,timeout:90000});
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(`Checked ${audit.count} stalks on ${audit.rowCount} supported furrows.`);
}finally{await browser.close();}
