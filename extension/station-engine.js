/* Clock-synchronized station player. This is a browser-based simulation, not a live server stream. */
(function(){
"use strict";
const fallback={name:"RADIO 001",tagline:"מוזיקה מוזרה לאנשים מעניינים.",epoch:1795046400,
tracks:[{title:"Elevator To Nowhere",artist:"RADIO 001 · Original",src:"generated:elevator",duration:40}]};
class RadioEngine{
 constructor(opts={}){
  this.baseUrl=opts.baseUrl||document.baseURI; this.onChange=opts.onChange||(()=>{});this.onError=opts.onError||(()=>{});
  this.audio=new Audio();this.audio.preload="auto";this.audio.volume=.75;
  this.config=fallback;this.activeTrack=-1;this.activeUrl="";this.playingRequested=false;
  this.audio.addEventListener("loadedmetadata",()=>{this.seek();if(this.playingRequested)this.audio.play().catch(e=>this.onError(e.message));});
  this.audio.addEventListener("play",()=>this.onChange(this.getState()));
  this.audio.addEventListener("pause",()=>this.onChange(this.getState()));
  this.audio.addEventListener("error",()=>this.onError("לא ניתן לטעון את השיר."));
  this.timer=setInterval(()=>this.tick(),1000);
 }
 source(track){
  if(track.src==="generated:elevator")return window.makeElevatorAudioUrl();
  try{return new URL(track.src,this.baseUrl).href}catch(_){return track.src}
 }
 position(){
  const tracks=this.config.tracks;const total=tracks.reduce((a,t)=>a+Number(t.duration),0);
  let elapsed=((Date.now()/1000-Number(this.config.epoch||0))%total+total)%total;
  for(let i=0;i<tracks.length;i++){
   if(elapsed<Number(tracks[i].duration))return{index:i,offset:elapsed,track:tracks[i]};
   elapsed-=Number(tracks[i].duration);
  }
  return{index:0,offset:0,track:tracks[0]};
 }
 seek(){
  if(this.audio.readyState<1)return;
  const p=this.position();const duration=Number.isFinite(this.audio.duration)?this.audio.duration:Number(p.track.duration);
  this.audio.currentTime=Math.max(0,Math.min(p.offset,duration-.07));
 }
 tick(){
  const p=this.position(),src=this.source(p.track);
  if(this.activeTrack!==p.index||this.activeUrl!==src){
    this.activeTrack=p.index;this.activeUrl=src;this.audio.loop=this.config.tracks.length===1;
    this.audio.src=src;this.audio.load();
  }else if(this.playingRequested&&this.audio.readyState>=1){
    const drift=Math.abs(this.audio.currentTime-p.offset);
    if(drift>1.6&&drift<Number(p.track.duration)-.6)this.seek();
    if(this.audio.paused)this.audio.play().catch(e=>this.onError(e.message));
  }
  this.onChange(this.getState());
 }
 async load(){
  try{
   const r=await fetch(new URL("station.json",this.baseUrl),{cache:"no-store"});
   if(!r.ok)throw new Error("configuration not found");
   const conf=await r.json();
   if(!Array.isArray(conf.tracks)||!conf.tracks.length||conf.tracks.some(t=>!t.src||!(Number(t.duration)>0)))throw new Error("Invalid playlist");
   this.config=conf;
  }catch(_){this.config=fallback}
  this.tick();
  return this.config;
 }
 async play(){
  this.playingRequested=true;this.tick();this.seek();
  try{await this.audio.play()}catch(e){this.playingRequested=false;this.onError("נדרש אישור השמעה מהדפדפן: "+e.message)}
  this.onChange(this.getState());
 }
 pause(){this.playingRequested=false;this.audio.pause();this.onChange(this.getState())}
 setVolume(v){this.audio.volume=Math.max(0,Math.min(1,Number(v)));this.onChange(this.getState())}
 getState(){const p=this.position();return{name:this.config.name,tagline:this.config.tagline,track:p.track,
 position:p.offset,duration:Number(p.track.duration),playing:this.playingRequested&&!this.audio.paused,
 volume:this.audio.volume,trackNumber:p.index+1,trackCount:this.config.tracks.length}}
}
window.RadioEngine=RadioEngine;
})();