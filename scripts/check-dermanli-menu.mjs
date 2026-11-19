// The legacy visual menu must control only the Dermanlı save and preferences.
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE ? await import(process.env.PLAYWRIGHT_MODULE) : require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER || undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1024,height:700}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3016/');
 await page.evaluate(()=>localStorage.setItem('son_vazife_save_v2','legacy-save'));
 await page.getByRole('button',{name:'Nasıl oynanır?'}).click();
 const controls=page.getByRole('dialog',{name:'Nasıl oynanır?'});await controls.waitFor();
 if(!(await controls.innerText()).includes('F + A / D'))throw Error('Dermanlı controls missing');
 await controls.getByRole('button',{name:'Kapat'}).click();
 await page.getByRole('button',{name:'Ayarlar'}).click();
 const settings=page.getByRole('dialog',{name:'Ayarlar'});await settings.waitFor();
 await settings.getByRole('switch',{name:'Y eksenini ters çevir'}).click();
 await settings.getByRole('switch',{name:'Ortam ve oyun sesleri'}).click();
 await settings.getByRole('button',{name:'Tamam'}).click();
 if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('son_vazife_controls_v1')).invertY)))throw Error('Control preference not stored');
 await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.waitForFunction(()=>!!window.__dermanliTest,{timeout:60000});
 if(!(await page.locator('body').innerText()).includes('Ses kapalı'))throw Error('Menu mute not applied in game');
 await page.getByRole('button',{name:'Menü',exact:true}).click();await page.getByRole('button',{name:'DEVAM ET'}).waitFor();
 await page.getByRole('button',{name:'Yeni oyun',exact:true}).click();
 const restart=page.getByRole('dialog',{name:'Yeni nöbet'});await restart.waitFor();await restart.getByRole('button',{name:'Vazgeç'}).click();
 if(!(await page.getByRole('button',{name:'DEVAM ET'}).isVisible()))throw Error('Cancel lost save');
 await page.getByRole('button',{name:'Yeni oyun',exact:true}).click();await restart.getByRole('button',{name:'Yeni oyuna başla'}).click();
 await page.waitForFunction(()=>!!window.__dermanliTest,{timeout:60000});
 const state=await page.evaluate(()=>window.__dermanliTest.state());if(state.night!==1||state.body!=='arrival')throw Error('New game did not reset Dermanlı');
 if(await page.evaluate(()=>localStorage.getItem('son_vazife_save_v2'))!=='legacy-save')throw Error('Legacy save was modified');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Menu, preferences, save, cancel and new game passed.');
}finally{await browser.close();}
