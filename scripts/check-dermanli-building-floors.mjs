// Compare the rendered floor at ten building/porch probes with the player's walk height.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 const audit=await page.evaluate(()=>window.__dermanliTest.buildingFloorAudit());
 if(audit.length!==10||audit.some(p=>p.visibleFloor==null||Math.abs(p.visibleFloor-p.walking)>.002))throw Error(`Floor mismatch: ${JSON.stringify(audit)}`);
 if(errors.length)throw Error(errors.join('\n'));console.log(`Ten building and porch floor probes match walk height: ${JSON.stringify(audit)}`);
}finally{await browser.close();}
