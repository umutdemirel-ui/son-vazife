// Exercise the Kuzdağ campaign and preserve the former save slots.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=process.env.PLAYWRIGHT_MODULE?await import(process.env.PLAYWRIGHT_MODULE):require('playwright');
const browser=await chromium.launch({executablePath:process.env.BROWSER||undefined,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const errors=[],page=await browser.newPage({viewport:{width:640,height:400}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VILLAGE_URL||'http://localhost:3017/');
 await page.evaluate(()=>{localStorage.setItem('son_vazife_save_v2','damaged');localStorage.setItem('son_vazife_dermanli_v1','dermanli-protected');localStorage.setItem('son_vazife_first_watch_v1','telephone');});
 await page.reload();await page.getByRole('button',{name:'KÖYE GİR'}).click();let modal=page.getByRole('dialog',{name:'Kuzdağ kaydı'});
 await modal.getByText('Kuzdağ kaydı okunamıyor.',{exact:false}).waitFor();if(await modal.getByRole('button',{name:'KÖYE GİR'}).count())throw Error('Damaged save can be overwritten');
 if(await page.evaluate(()=>localStorage.getItem('son_vazife_save_v2'))!=='damaged')throw Error('Damaged save changed');
 await page.evaluate(()=>localStorage.removeItem('son_vazife_save_v2'));await page.reload();await page.getByRole('button',{name:'KÖYE GİR'}).click();await page.getByRole('button',{name:'Duraklat'}).waitFor({timeout:120000});
 const values=await page.evaluate(()=>({legacy:localStorage.getItem('son_vazife_save_v2'),dermanli:localStorage.getItem('son_vazife_dermanli_v1'),watch:localStorage.getItem('son_vazife_first_watch_v1')}));
 if(!values.legacy||JSON.parse(values.legacy).version!==2||values.dermanli!=='dermanli-protected'||values.watch!=='telephone')throw Error(`Save slots changed unexpectedly: ${JSON.stringify(values)}`);
 await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Duraklatıldı'}).getByRole('button',{name:'Ana ekran'}).click();
 await page.getByRole('button',{name:'DEVAM ET'}).waitFor();
 if(errors.length)throw Error(errors.join('\n'));console.log('Original Kuzdağ campaign launches; invalid saves and unrelated Dermanlı/prologue saves are preserved; resume is offered.');
}finally{await browser.close();}
