"use strict";
let creating;
async function ensureOffscreen(){const url=chrome.runtime.getURL('offscreen.html');const c=await chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT'],documentUrls:[url]});if(c.length)return;if(creating)return creating;creating=chrome.offscreen.createDocument({url:'offscreen.html',reasons:['AUDIO_PLAYBACK'],justification:'Play radio audio after closing the popup'});try{await creating}finally{creating=null}}
chrome.runtime.onMessage.addListener((msg,_sender,respond)=>{if(msg.target!=='service-worker')return;(async()=>{await ensureOffscreen();return chrome.runtime.sendMessage({...msg,target:'offscreen'})})().then(respond).catch(e=>respond({error:String(e)}));return true});
