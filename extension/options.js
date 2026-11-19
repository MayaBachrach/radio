"use strict";
const input=document.getElementById('url'),status=document.getElementById('status');
const DEFAULT='https://mayabachrach.github.io/radio/';
chrome.storage.sync.get('stationUrl').then(({stationUrl=DEFAULT})=>input.value=stationUrl||DEFAULT);
document.getElementById('save').addEventListener('click',async()=>{let url=input.value.trim()||DEFAULT;try{const u=new URL(url);if(u.protocol!=='https:'||!u.hostname.endsWith('.github.io'))throw Error();url=u.origin+u.pathname.replace(/\/*$/,'/')}catch(_){status.textContent='נדרשת כתובת HTTPS תחת github.io';return}await chrome.storage.sync.set({stationUrl:url});try{await chrome.runtime.sendMessage({target:'service-worker',type:'reload'})}catch(_){}status.textContent='ההגדרות נשמרו.'});
