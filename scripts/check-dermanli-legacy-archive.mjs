// A legacy save is shown read-only; neither the old case progress nor Dermanlı clues are changed.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:640,height:400}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
 const legacy=JSON.stringify({version:2,act:2,playerPos:{x:0,z:0,yaw:0,pitch:0},autopsyCases:{case_arif:{completed:true},case_mahmut:{completed:false}}});
 await page.evaluate(value=>localStorage.setItem('son_vazife_save_v2',value),legacy);
 await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});
 await page.locator('canvas').click({position:{x:320,y:200}});await page.waitForFunction(()=>!!document.pointerLockElement);
 const before=await page.evaluate(()=>window.__dermanliTest.state());await page.keyboard.press('n');
 const section=page.getByRole('region',{name:'Kuzdağ önceki kayıt özeti'});await section.waitFor();
 if(!await section.getByText('Vaka I · Hacı Arif').isVisible()||await section.getByText('Vaka II · Şoför Mahmut').count())throw Error('Incorrect legacy case summary');
 if(await page.evaluate(()=>localStorage.getItem('son_vazife_save_v2'))!==legacy)throw Error('Legacy save was changed');
 const after=await page.evaluate(()=>window.__dermanliTest.state());if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Dermanlı state changed while reading legacy archive');
 if(errors.length)throw Error(errors.join('\n'));console.log('Completed Kuzdağ case appears read-only; both saves remain separate.');
}finally{await browser.close();}
