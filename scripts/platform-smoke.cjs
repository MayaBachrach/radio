const {chromium,_electron}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const ext=path.resolve('extension');
 const ctx=await chromium.launchPersistentContext('',{channel:'chromium',headless:true,args:['--disable-extensions-except='+ext,'--load-extension='+ext]});
 try{
 const sw=ctx.serviceWorkers()[0]||await ctx.waitForEvent('serviceworker');
 await sw.evaluate(()=>{
   const setIcon=chrome.action.setIcon.bind(chrome.action);
   chrome.action.setIcon=async options=>{await setIcon(options);globalThis.lastIcon=options.path;};
 });
 const url=new URL('popup.html',sw.url()).href;
 let page=await ctx.newPage();await page.goto(url);
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing');
 await page.waitForTimeout(200);
 assert.equal(await sw.evaluate(()=>globalThis.lastIcon),'active.png');
 await page.close();
 await new Promise(resolve=>setTimeout(resolve,1600));
 page=await ctx.newPage();await page.goto(url);
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing');
 assert.equal(await page.locator('#player').evaluate(x=>x.offsetWidth),360);
 await page.screenshot({path:'artifacts/popup.png',clip:{x:0,y:0,width:360,height:208}});
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Paused');
 await page.waitForTimeout(200);
 assert.equal(await sw.evaluate(()=>globalThis.lastIcon),'icon192.png');
 }finally{await ctx.close();}
 const app=await _electron.launch({executablePath:require('../desktop/node_modules/electron'),args:[path.resolve('desktop')]});
 try{
 const page=await app.firstWindow();await page.locator('#size').waitFor();
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing');
 await page.locator('#size').click();await page.waitForSelector('body.mini');
 assert.deepEqual(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].getSize()),[360,208]);
 await page.locator('#pin').click();assert(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isAlwaysOnTop()));
 await page.screenshot({path:'artifacts/native-mini.png'});
 await page.locator('#size').click();await page.waitForSelector('body:not(.mini)');
 assert(await page.evaluate(()=>!receiver.media.paused));
 }finally{await app.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});