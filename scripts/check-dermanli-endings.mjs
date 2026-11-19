// Exercise the escape route and a saved, careless fifth burial through actual E input.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.VILLAGE_URL||'http://localhost:3016/';
try {
 for(const ending of ['escape','dark']){
  const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  if(ending==='dark'){
   await page.evaluate(()=>localStorage.setItem('son_vazife_dermanli_v1',JSON.stringify({version:1,x:0,z:78.8,yaw:0,pitch:0,elapsed:120,ritual:{night:5,body:'burialCarry',candle:true,risen:false,stage:6,soaped:false,held:'empty',dirty:false,violations:1,clues:['home','school','mill','well','cemetery'],ending:null}})));
   await page.reload();await page.getByRole('button',{name:'DEVAM ET'}).click();
  }else await page.getByRole('button',{name:'KÖYE GİR'}).click();
  await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});await page.locator('canvas').click();await page.waitForFunction(()=>!!document.pointerLockElement);await page.waitForTimeout(300);
  const result=await page.evaluate(id=>window.__dermanliTest.walkToTarget(id),ending==='dark'?'cemetery':'forest');if(result!=='ok')throw Error(result);
  await page.keyboard.press('e');await page.waitForFunction(id=>window.__dermanliTest.state().ending===id,ending,{timeout:15000});
  const title=ending==='dark'?'KARANLIK':'KAÇIŞ',region=page.getByRole('region',{name:`${title} sonu`});await region.waitFor();
  await region.getByRole('button',{name:'Sonu göster'}).click();await region.getByRole('heading',{name:title}).waitFor();
  await region.getByRole('button',{name:'Menüye dön'}).click();await page.getByRole('button',{name:'DEVAM ET'}).click();
  await page.waitForFunction(()=>!!window.__dermanliTest,null,{timeout:60000});await page.getByRole('region',{name:`${title} sonu`}).waitFor();
  if(!(await page.getByRole('region',{name:`${title} sonu`}).innerText()).includes('1 / 2'))throw Error('Ending did not replay after resume');
  if(errors.length)throw Error(errors.join('\n'));await page.close();
 }
 console.log('Escape and dark endings, skip and replay passed.');
}finally{await browser.close();}
