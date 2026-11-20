import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 const target=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('content-type',types[path.extname(target)]||'application/octet-stream');res.end(await readFile(target));}
 catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.accept());
 await page.route('**/station.json?*',r=>r.fulfill({json:{name:'MAYU ET AL.',playlists:{friends:{name:'Friends Mix',tracks:[{src:'media/a.mp3',duration:90}]}},schedule:[{days:[0],start:'20:00',durationMinutes:60,playlist:'friends'}]}}));
 await page.goto('http://127.0.0.1:'+server.address().port+'/studio.html');
 await page.locator('#slots .slot').first().waitFor();
 assert.equal(await page.locator('#days button').count(),7);
 assert.equal(await page.locator('#slots .slot').count(),24);
 assert.match(await page.locator('#occupiedNotice').innerText(),/Friends Mix/);
 await page.evaluate(()=>{window.__submitted=[];window.open=url=>{window.__submitted.push(url);return null;};});
 await page.locator('#curator').fill('Maya');
 await page.locator('#playlistName').fill('Maya Night');
 await page.locator('#playlistUrl').fill('https://open.spotify.com/playlist/585hRWxBiVwCjjhTpAuH8Y');
 await page.locator('#replace').check();
 await page.locator('#rights').check();
 await mkdir('artifacts',{recursive:true});
 await page.screenshot({path:'artifacts/music-desk-desktop.png',fullPage:true});
 await page.locator('.submit').click();
 const address=await page.evaluate(()=>window.__submitted[0]);
 assert(address,'Missing GitHub submission');
 const url=new URL(address);
 assert.equal(url.hostname,'github.com');
 assert.equal(url.pathname,'/MayaBachrach/radio/issues/new');
 const raw=url.searchParams.get('body').match(/~~~json\s*([\s\S]*?)\s*~~~/)?.[1];
 assert(raw,'Missing JSON in submission');
 const request=JSON.parse(raw);
 assert.deepEqual([request.day,request.hour,request.expected_playlist,request.replace],[0,20,'friends',true]);
 await page.locator('#days button').nth(4).click();
 await page.locator('#slots .slot').nth(23).click();
 assert.equal(await page.locator('#replaceLine').evaluate(n=>getComputedStyle(n).display),'none');
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'artifacts/music-desk-mobile.png',fullPage:true});
 const dimensions=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);
 assert(dimensions[0]<=dimensions[1],'Mobile layout horizontal overflow: '+dimensions);
 assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}
