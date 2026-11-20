const popup = document.body.classList.contains('popup');
const native = window.desktopRadio;
const $ = id => document.getElementById(id);
const panel = (id,title,content) => '<section id="'+id+'"><header><i class="grip"></i><h2>'+title+'</h2><i class="ridge"></i></header>'+content+'</section>';
const signal = '<img class="signal" alt="" src="'+(popup?'':'extension/')+'signal.svg">';
const bands = ['60','170','310','600','1k','3k','6k','12k','14k','16k'];
$('device').innerHTML = '<div class="rack">'+panel('player','MAYU ET AL.',`
<div class="lcd mainlcd">${signal}<div><div class="clock" id="clock">00:00</div><b>Independent radio</b></div><aside><small>DEMO</small><strong id="status" role="status">Standby</strong></aside></div>
<div class="rail"><label for="volume">VOL</label><input id="volume" type="range" min="0" max="1" step=".01"><output id="level"></output></div>
<footer><button id="play" class="round" aria-label="Play">▶</button><button id="mute">Mute</button><span class="perfs"></span>${native?'<button id="size">Mini</button><button id="pin" hidden>Pin</button>':''}</footer>`)+
panel('eq','EQUALIZER','<div class="rail"><button id="bypass" aria-pressed="true">ON</button><span class="perfs"></span><button id="flat">Reset</button></div><div class="bands">'+bands.map((f,i)=>'<label><input type="range" min="-12" max="12" value="0" aria-label="'+f+' Hz gain" data-band="'+i+'"><span>'+f+'</span></label>').join('')+'</div>')+
panel('info','RADIO INFO','<div class="lcd infolcd">'+signal+'<div><small>NOW</small> <bdi dir="auto">Maya</bdi><br><small>NEXT</small> <bdi dir="auto">Friends Mix</bdi></div></div><footer><span class="engraved">STATION MEMORY · 01</span><span class="perfs"></span></footer>')+'</div>'+
panel('visual','VISUALIZATION','<div class="scope"><canvas></canvas></div><footer><span class="engraved">SPECTRUM ANALYZER</span><span class="perfs"></span><button id="full" aria-label="Toggle visualization fullscreen">⛶</button></footer>');
let state = {status:'Standby',volume:.7,position:0};
function display(s){
  if (!s || s.error) { $('status').textContent=s?.error?'Unavailable':'Standby';return;}
  state=s; const playing=s.status==='Playing';
  $('status').textContent=s.status; $('clock').textContent='00:'+String(Math.floor(s.position||0)%60).padStart(2,'0');
  $('play').textContent=playing?'Ⅱ':'▶'; $('play').setAttribute('aria-label',playing?'Pause':'Play');
  $('volume').value=s.volume; $('level').textContent=Math.round(s.volume*100)+'%';
  $('mute').textContent=s.volume?'Mute':'Unmute';
}
const receiver = popup ? null : new Receiver(display);
async function command(type,value){
  try {display(popup?await chrome.runtime.sendMessage({target:'service-worker',type,value}):await receiver.command(type,value));}
  catch { $('status').textContent='Try play again'; }
}
$('play').onclick=()=>command(state.status==='Playing'?'pause':'play');
let saved=.7;
$('mute').onclick=()=>{if(state.volume){saved=state.volume;command('volume',0);}else command('volume',saved);};
$('volume').oninput=e=>command('volume',Number(e.target.value));
$('eq').oninput=e=>{receiver.levels[e.target.dataset.band]=Number(e.target.value);receiver.applyEQ();};
$('bypass').onclick=e=>{receiver.equalized=!receiver.equalized;e.target.textContent=receiver.equalized?'ON':'OFF';e.target.setAttribute('aria-pressed',receiver.equalized);receiver.applyEQ();};
$('flat').onclick=()=>{receiver.levels.fill(0);document.querySelectorAll('[data-band]').forEach(x=>x.value=0);receiver.applyEQ();};
$('full').onclick=()=>document.fullscreenElement?document.exitFullscreen():$('visual').requestFullscreen();
if(!document.fullscreenEnabled)$('full').hidden=true;
if(native){
  native.onMode(mini=>{document.body.classList.toggle('mini',mini);$('size').textContent=mini?'Expand':'Mini';$('pin').hidden=!mini;});
  $('size').onclick=()=>native.resize(); $('pin').onclick=async()=>{$('pin').textContent=await native.pin()?'Unpin':'Pin';};
}
command('state');setInterval(()=>{if(!document.hidden)command('state');},1000);
if(!popup && !native && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
const palette=getComputedStyle(document.documentElement);
const color=key=>palette.getPropertyValue('--'+key).trim();
const wave=color('viz-wave'), bright=color('viz-light'), deep=color('viz-base');
const bins=new Uint8Array(1024);
function draw(t){
  const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  const live=state.status==='Playing'; const phase=live?t/1700:0;
  if(receiver?.analyser)receiver.analyser.getByteFrequencyData(bins);
  const bg=ctx.createRadialGradient(w*.53,h*.57,0,w*.5,h*.5,Math.max(w,h)*.72);
  bg.addColorStop(0,color('viz-center'));bg.addColorStop(1,deep);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  for(let i=0;i<100;i++){const x=(i*173.27%101)/101*w,y=(i*i*7.13%101)/101*h;ctx.globalAlpha=.18+.4*Math.abs(Math.sin(i+phase));ctx.fillStyle=bright;ctx.fillRect(x,y,1.5,2);}
  ctx.shadowColor=wave;ctx.shadowBlur=live?4:2;
  for(let j=0;j<35;j++){ctx.beginPath();for(let x=0;x<=w+4;x+=4){const u=x/w;const y=h*(.43+.12*Math.sin(u*7+phase+j*.049)+.06*Math.sin(u*11-phase+j*.068));if(!x)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.strokeStyle=j%7?wave:bright;ctx.globalAlpha=j%7?.24:.9;ctx.stroke();}
  ctx.shadowBlur=0;ctx.globalAlpha=1;
  for(let i=0;i<88;i++){const x=i*w/88,energy=live?bins[Math.floor(Math.pow(i/88,2)*800)]/255:0;const size=2+energy*h*.27;ctx.fillStyle=wave;ctx.fillRect(x,h*.81-size,w/110,size);ctx.globalAlpha=.15;ctx.fillRect(x,h*.82,w/110,size*.55);ctx.globalAlpha=1;}
}
if(!popup){setInterval(()=>{if(!document.hidden && canvas.clientWidth)draw(performance.now());},1000/24);}
