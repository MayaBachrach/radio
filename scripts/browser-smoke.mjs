import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.RADIO_URL||'https://mayabachrach.github.io/radio/');
 await page.locator('#volume').waitFor();
 mkdirSync('artifacts',{recursive:true});
 for(const [width,height] of [[320,568],[390,844],[1366,768],[1920,1080]]){
  await page.setViewportSize({width,height});
  assert.deepEqual(await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight]),[width,height]);
  assert.equal(await page.locator('#visual').isVisible(),width>=760);
  await page.screenshot({path:'artifacts/'+width+'.png'});
 }
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing');
 await page.getByRole('button',{name:'Mute',exact:true}).click();
 assert.equal(await page.locator('#level').innerText(),'0%');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Paused');
 const scope=await page.evaluate(()=>navigator.serviceWorker.ready.then(r=>r.scope));
 assert.equal(new URL(scope).pathname,'/radio/');
 const manifest=await page.evaluate(async()=>await (await fetch(document.querySelector('link[rel=manifest]').href)).json());
 assert.equal(manifest.display,'standalone');
 await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.context().setOffline(true);await page.reload();
 await page.locator('#volume').waitFor();
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
