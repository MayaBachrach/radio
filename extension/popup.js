"use strict";
const $=id=>document.getElementById(id);let state={playing:false};
for(let i=0;i<20;i++)$('equalizer').appendChild(document.createElement('i'));
function time(s){return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0')}
function render(s){if(!s?.track)return;state=s;$('song').textContent=s.track.title;$('artist').textContent=s.track.artist||'';$('bar').style.width=(s.position/s.duration*100)+'%';$('elapsed').textContent=time(s.position);$('clock').textContent=time(s.position);$('length').textContent=time(s.duration);$('counter').textContent=String(s.trackNumber).padStart(2,'0')+' / '+String(s.trackCount).padStart(2,'0');$('play').classList.toggle('is-playing',s.playing);$('equalizer').classList.toggle('active',s.playing);$('play').setAttribute('aria-label',s.playing?'הפסקת האזנה':'האזנה לשידור');if(document.activeElement!==$('volume'))$('volume').value=Math.round(s.volume*100)}
async function send(type,extras={}){try{const r=await chrome.runtime.sendMessage({target:'service-worker',type,...extras});if(r?.error)$('error').textContent=r.error;if(r?.track)render(r)}catch(e){$('error').textContent=String(e)}}
$('play').addEventListener('click',()=>send(state.playing?'pause':'play'));
$('volume').addEventListener('change',()=>send('volume',{volume:Number($('volume').value)/100}));
$('options').addEventListener('click',()=>chrome.runtime.openOptionsPage());
chrome.storage.sync.get('stationUrl').then(({stationUrl='https://mayabachrach.github.io/radio/'})=>{$('website').href=stationUrl||'https://mayabachrach.github.io/radio/'});
send('state');const poll=setInterval(()=>send('state'),1000);window.addEventListener('unload',()=>clearInterval(poll));
