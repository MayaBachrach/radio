import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch();
try {
 const page=await browser.newPage();
 const errors=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.RADIO_URL||'https://mayabachrach.github.io/radio/');
 await page.locator('#volume').waitFor();
 mkdirSync('artifacts',{recursive:true});
 for(const [width,height] of [[320,568],[390,844],[1366,768],[1920,1080]]){
  await page.setViewportSize({width,height});
  assert.deepEqual(await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.scrollHeight]),[width,height]);
  assert.equal(await page.locator('#visual').isVisible(),width>=760);
  await page.evaluate(()=>document.fonts.ready);
  const defects=await page.evaluate(()=>{
   const visible=e=>e.getClientRects().length&&getComputedStyle(e).display!=='none';
   const issues=[];
   for(const el of document.querySelectorAll('button,input,header,.credits,.clock')){
    if(!visible(el))continue;
    const r=el.getBoundingClientRect(),p=el.closest('section').getBoundingClientRect();
    if(r.left<p.left-1||r.right>p.right+1||r.top<p.top-1||r.bottom>p.bottom+1)issues.push(el.id||el.tagName);
   }
   const lcd=document.querySelector('.mainlcd'),data=lcd.querySelector('.data'),aside=lcd.querySelector('aside');
   if(data.getBoundingClientRect().right>aside.getBoundingClientRect().left+1)issues.push('LCD overlap');
   if([...document.querySelectorAll('button')].some(b=>visible(b)&&/^[×X✕]$/.test(b.textContent)))issues.push('close');
   return issues;
  });
  assert.deepEqual(defects,[]);
  await page.screenshot({path:'artifacts/'+width+'.png'});
 }
 await page.getByRole('button',{name:'Play',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing');
 await page.getByRole('button',{name:'Mute',exact:true}).click();
 assert.equal(await page.locator('#level').innerText(),'0%');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#status').textContent==='Paused');
 await page.locator('.credits bdi').first().evaluate(el=>el.textContent='מאיה · Mix 02');
 assert.equal(await page.locator('.credits bdi').first().evaluate(el=>getComputedStyle(el).direction),'rtl');
 for(const image of ['case-rim','glass-rim','keycap','lcd-legend']){
  assert(await page.evaluate(async name=>{const im=new Image();im.src='./extension/'+name+'.png';await im.decode();return im.naturalWidth>0;},image));
 }
 const scope=await page.evaluate(()=>navigator.serviceWorker.ready.then(r=>r.scope));
 assert.equal(new URL(scope).pathname,'/radio/');
 const manifest=await page.evaluate(async()=>await (await fetch(document.querySelector('link[rel=manifest]').href)).json());
 assert.equal(manifest.display,'standalone');
 await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await page.context().setOffline(true);await page.reload();
 await page.locator('#volume').waitFor();
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
