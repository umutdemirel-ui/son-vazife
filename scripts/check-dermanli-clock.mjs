// Observe an actual timed day/night transition, without waiting through the entire day.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3016');await page.getByRole('button',{name:'KÖYE GİR'}).click();
 await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});await page.locator('canvas').click();await page.waitForFunction(()=>!!document.pointerLockElement);
 await page.evaluate(()=>window.__dermanliTest.approachNight());
 const start=Date.now();await page.waitForFunction(()=>window.__dermanliTest.clock()>=120,null,{timeout:15000});
 if(Date.now()-start>8000)throw Error('Clock ran too slowly at low frame rate');
 await page.waitForFunction(()=>window.__dermanliTest.visualState().fountain,null,{timeout:10000});
 if(!(await page.locator('body').innerText()).includes('GECE'))await page.getByText(/1\. VAZİFE · GECE/).waitFor();
 await page.keyboard.press('h');await page.getByRole('dialog',{name:'Dermanlı haritası'}).waitFor();
 const paused=await page.evaluate(()=>window.__dermanliTest.clock());await page.waitForTimeout(1200);
 if((await page.evaluate(()=>window.__dermanliTest.clock()))-paused>.1)throw Error('Clock advanced with map open');
 if(errors.length)throw Error(errors.join('\n'));console.log('Real-time dusk transition and map pause passed.');
}finally{await browser.close();}
