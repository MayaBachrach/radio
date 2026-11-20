const cacheName='mayu-shell-v1';
const shell=['./','./index.html','./extension/device.css','./extension/device.js','./extension/audio.js','./extension/music-synth.js','./extension/signal.svg','./station.webmanifest','./extension/icon192.png','./extension/icon512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(cacheName).then(c=>c.addAll(shell))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mayu-shell-')&&k!==cacheName).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
 if(!shell.some(p=>new URL(p,self.registration.scope).href===e.request.url))return;
 e.respondWith(fetch(e.request).then(async r=>{if(r.ok){const c=await caches.open(cacheName);await c.put(e.request,r.clone());}return r;}).catch(()=>caches.match(e.request)));
});