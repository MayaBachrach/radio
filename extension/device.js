const popup = document.body.classList.contains('popup');
const native = window.desktopRadio;
const $ = id => document.getElementById(id);
const shapes = {
 play:'M4 2h2v1h2v1h2v1h2v1h2v2h-2v1h-2v1H8v1H6v1H4z',
 pause:'M3 2h4v11H3zm6 0h4v11H9z',
 speaker:'M1 6h3V5h2V4h1V3h2v10H7v-1H6v-1H4v-1H1z M11 5h1v1h1v4h-1v1h-1v-2h1V7h-1z M13 3h1v2h1v6h-1v2h-1v-2h1V5h-1z',
 silent:'M1 6h3V5h2V4h1V3h2v10H7v-1H6v-1H4v-1H1z M11 6h1v1h1v1h1V7h1V6h1v2h-1v1h1v2h-1v-1h-1V9h-1v1h-1v1h-1V9h1V8h-1z',
 less:'M3 7h10v2H3z',more:'M3 7h4V3h2v4h4v2H9v4H7V9H3z',
 full:'M1 1h6v2H3v4H1zm8 0h6v6h-2V3H9zM1 9h2v4h4v2H1zm12 0h2v6H9v-2h4z',
 wave:'M0 8h3V6h2V3h2v7h2v2h1V7h2V5h2v3h2v2h-3V8h-1v2h-1v4H8v-2H6V7H5v2H3v1H0z'
};
function icon(name) {
 return '<svg viewBox="0 0 16 16" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="'+shapes[name]+'"/></svg>';
}
const transmission='<svg class="signal" viewBox="0 0 24 24" aria-hidden="true" shape-rendering="crispEdges"><g fill="currentColor"><path d="M3 2h2v2H3v3H2v5h1v3h2v2H3v-2H1v-3H0V7h1V4h2zM7 5h2v2H7v5h2v2H7v-2H5V7h2zM21 2h-2v2h2v3h1v5h-1v3h-2v2h2v-2h2v-3h1V7h-1V4h-2zM17 5h-2v2h2v5h-2v2h2v-2h2V7h-2z M10 7h4v4h-4zm1 6h2v3h1v3h1v3H9v-3h1v-3h1z"/></g></svg>';
const meter='<i class="meter" aria-hidden="true">'+Array.from({length:8},(_,i)=>'<i style="--n:'+i+'"></i>').join('')+'</i>';
const panel=(id,title,content)=>'<section id="'+id+'"><header><i class="grip"></i><h2>'+(id==='player'?'<svg class="wordmark" role="img" aria-label="MAYU ET AL." viewBox="0 0 190 23"><g transform="translate(6 2) skewX(-10)" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="square" stroke-linejoin="round"><path d="M1 17V2l8 10 8-10v15 M23 17l8-15h3l8 15m-16-5h13 M46 2l8 8 8-8m-8 8v7 M68 2v11q0 4 4 4h7q4 0 4-4V2 M97 2h16m-16 0v15h16m-15-8h12 M118 2h18m-9 0v15 M145 17l8-15h3l8 15m-16-5h13 M170 2v15h11"/><path d="M185 17h1"/></g></svg>':title)+'</h2><i class="flute"></i></header>'+content+'</section>';
const round=(id,label,symbol)=>'<button class="round" id="'+id+'" aria-label="'+label+'" title="'+label+'">'+icon(symbol)+'</button>';
const bands=['60','170','310','600','1K','3K','6K','12K','14K','16K'];
function clockFace(value){
 const digits=[...value].map(c=>c===':'?'<i class="digit-colon"></i>':'<i class="digit" style="--index:'+Number(c)+'"></i>');
 return '<span class="digits" role="img" aria-label="'+value+'">'+digits.join('')+'</span>';
}
$('device').innerHTML='<div class="rack">'+panel('player','MAYU ET AL.',`
 <div class="readout"><div class="lcd mainlcd">${transmission}<div class="data"><div class="clock" id="clock"></div><img class="station-legend" src="${popup?'':'extension/'}lcd-legend.png" alt="Independent Radio"></div><aside><small>DEMO</small><strong id="status" role="status">Standby</strong>${meter}</aside></div>
 <div class="volume-rail"><label for="volume">VOL</label><input id="volume" type="range" min="0" max="1" step=".01"><output id="level"></output></div></div>
 <footer class="transport"><div class="transport-well">${round('play','Play','play')}${round('mute','Mute','speaker')}</div><div class="rocker">${round('quieter','Lower volume','less')}${round('louder','Raise volume','more')}</div>
 ${native?'<button id="size">Mini</button><button id="pin" hidden>Pin</button>':'<i class="vent"></i>'}</footer>`)+
 panel('eq','EQUALIZER',`<div class="eq-tools"><button id="bypass" aria-pressed="true">ON</button><i class="mesh"></i><button id="flat">Reset</button></div>
 <div class="equalizer"><div class="scale"><span>+12 dB</span><span>0 dB</span><span>−12 dB</span></div><div class="bands">${bands.map((f,i)=>'<label><input type="range" min="-12" max="12" value="0" aria-label="'+f+' Hz gain" data-band="'+i+'"><span>'+f+'</span></label>').join('')}</div></div>`)+
 panel('info','RADIO INFO','<div class="lcd infolcd">'+transmission+'<div class="credits"><div><small>NOW:</small><bdi dir="auto">Maya</bdi></div><div><small>NEXT:</small><bdi dir="auto">Friends Mix</bdi></div></div>'+meter+'</div><footer class="info-foot"><i class="grooves"></i><i class="vent"></i></footer>')+'</div>'+
 panel('visual','VISUALIZATION','<div class="scope"><canvas aria-label="Turquoise visualization"></canvas></div><footer class="scope-foot"><i class="mode-lamp">'+icon('wave')+'</i><i class="grooves"></i><i class="vent"></i>'+round('full','Toggle visualization fullscreen','full')+'</footer>');
let state = {status:'Standby',volume:.7,position:0};
function display(s){
  if (!s || s.error) { $('status').textContent=s?.error?'Unavailable':'Standby';return;}
  const changed=s.status!==state.status;state=s;if(changed)document.dispatchEvent(new Event('receiver-state')); const playing=s.status==='Playing';
  $('status').textContent=s.status; const time=String(Math.floor((s.position||0)/60)).padStart(2,'0')+':'+String(Math.floor(s.position||0)%60).padStart(2,'0');
  if($('clock').dataset.value!==time){$('clock').innerHTML=clockFace(time);$('clock').dataset.value=time;}
  document.body.classList.toggle('playing',playing);
  $('play').innerHTML=icon(playing?'pause':'play'); $('play').setAttribute('aria-label',playing?'Pause':'Play');
  $('volume').value=s.volume; $('level').textContent=Math.round(s.volume*100)+'%';
  $('mute').innerHTML=icon(s.volume?'speaker':'silent'); $('mute').setAttribute('aria-label',s.volume?'Mute':'Unmute'); $('mute').title=s.volume?'Mute':'Unmute';
  $('volume').style.setProperty('--volume',Math.round(s.volume*100)+'%');
}
const receiver = popup ? null : new Receiver(display);
async function command(type,value){
  try {display(popup?await chrome.runtime.sendMessage({target:'service-worker',type,value}):await receiver.command(type,value));}
  catch(error) { console.error('MAYU audio command failed',error); $('status').textContent='Try play again'; }
}
$('play').onclick=()=>command(state.status==='Playing'?'pause':'play');
$('quieter').onclick=()=>command('volume',Math.max(0,state.volume-.1));
$('louder').onclick=()=>command('volume',Math.min(1,state.volume+.1));
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
display(state);command('state');setInterval(()=>{if(!document.hidden)command('state');},1000);
if(!popup && !native && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
// The idle image is a designed still. In playback the bars sample the analyser.
function startScope(canvas) {
 const ctx=canvas.getContext('2d');
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const styles=getComputedStyle(document.documentElement);
 const tone=name=>styles.getPropertyValue('--'+name).trim();
 const sea=tone('viz-base'),haze=tone('viz-center'),mint=tone('viz-wave'),white=tone('viz-light');
 const bins=new Uint8Array(1024);
 const sky=document.createElement('canvas');
 let width=0,height=0,visible=false,frame=0,last=0,dirty=true;
 function glow(g,x,y,r,color,power){
   const grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'transparent');
   g.globalAlpha=power;g.fillStyle=grad;g.fillRect(x-r,y-r,2*r,2*r);g.globalAlpha=1;
 }
 function backdrop(){
   sky.width=width;sky.height=height;
   const g=sky.getContext('2d'),w=width,h=height,base=g.createLinearGradient(0,0,w,h);
   base.addColorStop(0,sea);base.addColorStop(.42,haze);base.addColorStop(1,sea);
   g.fillStyle=base;g.fillRect(0,0,w,h);
   g.globalCompositeOperation='screen';
   for(let i=0;i<19;i++){
     g.save();g.translate(w*(i*.097%1),h*.45);g.rotate(.08+.09*Math.sin(i*91));g.scale(w*.021,h*.61);glow(g,0,0,1,mint,.06+.13*(i%4)/4);g.restore();
   }
   g.save();g.translate(w*.47,h*.73);g.scale(w*.5,h*.31);glow(g,0,0,1,mint,.56);g.restore();
   for(let i=1;i<145;i++){
     const x=w*((i*.61803399)%1),y=h*((i*i*.27361)%1);
     glow(g,x,y,2+i%8,mint,.2+i%5*.11);g.fillStyle=white;g.globalAlpha=.25+(i%6)*.13;g.fillRect(x,y,1,i%9?1.5:5);
     if(i%13===0){g.fillRect(x-3,y+1,7,.7);g.fillRect(x,y-4,.8,9);}
   }
   g.globalAlpha=1;
   for(let i=1;i<13;i++){const y=h*(.757+.245*(i/12)**1.7);g.globalAlpha=.09+.15*i/12;g.fillStyle=mint;g.fillRect(0,y,w,1);}
 }
 function render(t){
   const w=width,h=height,live=state.status==='Playing',time=live&&!motion.matches?t*.00034:0;
   ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(sky,0,0);
   ctx.globalCompositeOperation='screen';
   const horizon=h*.755;
   if(live && receiver?.analyser)receiver.analyser.getByteFrequencyData(bins);
   const count=Math.min(84,Math.max(48,Math.floor(w/6))),step=w/count,bar=step*.69;
   for(let i=0;i<count;i++){
     const u=i/count,shape=.28+.72*Math.abs(Math.sin(11*u+.6)*Math.cos(4*u));
     const seed=Math.abs(Math.sin(i*79.32)*Math.cos(i*.26));
     const energy=live?bins[Math.min(1023,Math.floor(2**(u*9.7)))]/255:shape*(.14+.86*seed);
     const bh=Math.max(2,energy*h*.29),x=i*step;
     ctx.globalAlpha=.76;const mirror=ctx.createLinearGradient(0,horizon,0,horizon+bh*.82);
     mirror.addColorStop(0,mint);mirror.addColorStop(1,'transparent');ctx.fillStyle=mirror;ctx.fillRect(x,horizon,bar,bh*.82);
     ctx.globalAlpha=.13;ctx.fillStyle=mint;ctx.fillRect(x-2,horizon-bh-3,bar+4,bh+4);
     ctx.globalAlpha=.94;ctx.fillStyle=mint;ctx.fillRect(x,horizon-bh,bar,bh);
     ctx.fillStyle=white;ctx.fillRect(x,horizon-bh,bar,Math.min(3,bh));ctx.fillRect(x,horizon-bh,1,bh);
   }
   ctx.globalAlpha=.3;ctx.globalCompositeOperation='source-over';ctx.fillStyle=sea;
   for(let i=0;i<count;i++){
     const u=i/count,energy=live?bins[Math.min(1023,Math.floor(2**(u*9.7)))]/255:(.28+.72*Math.abs(Math.sin(11*u+.6)*Math.cos(4*u)))*(.14+.86*Math.abs(Math.sin(i*79.32)*Math.cos(i*.26)));
     for(let y=horizon-3;y>horizon-energy*h*.29;y-=5)ctx.fillRect(i*step,y,bar,1);
   }
   ctx.globalCompositeOperation='screen';ctx.globalAlpha=.96;ctx.fillStyle=white;ctx.fillRect(0,horizon,w,1.5);
   ctx.save();ctx.translate(w*.48,horizon);ctx.scale(w*.52,h*.075);glow(ctx,0,0,1,white,.68);ctx.restore();
   const ribbons=27,steps=120;
   function point(u,v){return h*(.33+.042*Math.sin(u*15+v*3.8-time*.7)+.134*Math.sin(u*7.65-2.1+time)+.076*Math.sin(u*6.8+v*2.4+time*.77)+.036*Math.cos(u*12.1-v*2.9-time*.65));}
   for(let row=0;row<ribbons;row++){
     const v=row/(ribbons-1);ctx.beginPath();
     for(let i=0;i<=steps;i++){const u=i/steps,y=point(u,v);if(i)ctx.lineTo(w*u,y);else ctx.moveTo(0,y);}
     const edge=row===0||row===ribbons-1;
     ctx.strokeStyle=edge?white:mint;ctx.globalAlpha=edge?.98:.23;ctx.lineWidth=edge?1.7:1;ctx.stroke();
     if(edge){ctx.lineWidth=8;ctx.globalAlpha=.17;ctx.stroke();}
   }
   // A second filament folds through the first ribbon, with a different phase and depth.
   ctx.save();ctx.globalCompositeOperation='screen';
   for(let k=0;k<22;k++){
     const v=k/21;ctx.beginPath();
     for(let n=0;n<=steps;n++){const u=n/steps;
       const y=h*(.345+.122*Math.sin(u*6.8-1.9+time*.88)+.075*Math.sin(10.5*u+1.4*v+time*.6));
       if(n)ctx.lineTo(u*w,y);else ctx.moveTo(0,y);
     }
     ctx.lineWidth=k===0?2:1;ctx.globalAlpha=k===0?.89:.16;ctx.strokeStyle=k===0?white:mint;ctx.stroke();
   }ctx.restore();
   ctx.fillStyle=white;ctx.globalAlpha=.64;
   for(let i=0;i<steps;i++){for(let j=0;j<22;j++){ctx.fillRect(i*w/steps,point(i/steps,j/21),1.3,1.1);}}
   ctx.save();ctx.translate(w*.48,point(.48,.42));ctx.scale(w*.30,h*.12);glow(ctx,0,0,1,mint,.55);ctx.restore();
   for(let i=0;i<6;i++){const u=(i+.55)/6,y=point(u,.45);glow(ctx,u*w,y,h*.075,mint,.35);}
   ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 }
 function tick(t){
   frame=0;if(!visible||document.hidden)return;
   if(dirty||t-last>=(motion.matches?200:65)){render(t);last=t;dirty=false;}
   if(state.status==='Playing')frame=requestAnimationFrame(tick);
 }
 function wake(){if(visible&&!document.hidden&&!frame){dirty=true;frame=requestAnimationFrame(tick);}}
 new ResizeObserver(()=>{// Render at a period-appropriate AVS buffer size. CSS presents the original pixels.
   const scale=Math.min(1,480/Math.max(1,canvas.clientWidth));
   width=Math.round(canvas.clientWidth*scale);height=Math.round(canvas.clientHeight*scale);if(!width||!height)return;
   canvas.width=width;canvas.height=height;backdrop();wake();}).observe(canvas);
 new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake();}).observe(canvas);
 document.addEventListener('visibilitychange',wake);
 document.addEventListener('receiver-state',wake);
}
if(!popup)startScope(document.querySelector('canvas'));
