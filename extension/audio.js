/* Clock-selected playlist playback: every listener joins approximately the same point. */
const MAYU_PUBLIC_ROOT='https://mayabachrach.github.io/radio/';
const MAYU_DEMO={epoch:1795046400,tracks:[{src:'generated:elevator',title:'Elevator To Nowhere',artist:'MAYU ET AL.',duration:40}]};
function mayuBroadcast(config,now=new Date()){
 const locate=(tracks,elapsed,playlist='demo')=>{
   const total=tracks.reduce((s,t)=>s+Number(t.duration||0),0);
   if(!Number.isFinite(total)||total<=0)return null;
   let at=((elapsed%total)+total)%total;
   for(const track of tracks){if(at<Number(track.duration))return {track,offset:at,playlist};at-=Number(track.duration);}
   return {track:tracks[0],offset:0,playlist};
 };
 if(config.schedule?.length&&config.playlists){
   let parts;
   try{parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:config.timeZone||'Asia/Jerusalem',weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(now).map(x=>[x.type,x.value]));}catch(_){}
   if(parts){
     const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday);
     const clock=(Number(parts.hour)%24)*3600+Number(parts.minute)*60+Number(parts.second);
     let selected=null;
     for(const slot of config.schedule){
       if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start||'')||!config.playlists[slot.playlist]?.tracks?.length)continue;
       const [h,m]=slot.start.split(':').map(Number);
       for(const d of slot.days||[0,1,2,3,4,5,6]){
         if(!Number.isInteger(d)||d<0||d>6)continue;
         let age=((day-d+7)%7)*86400+clock-h*3600-m*60;if(age<0)age+=7*86400;
         if(slot.durationMinutes!=null){
           const windowSeconds=Number(slot.durationMinutes)*60;
           if(!Number.isFinite(windowSeconds)||windowSeconds<=0||age>=windowSeconds)continue;
         }
         if(!selected||age<selected.age)selected={age,playlist:slot.playlist};
       }
     }
     if(selected)return locate(config.playlists[selected.playlist].tracks,selected.age,selected.playlist);
   }
   const fallback=config.playlists[config.fallbackPlaylist];
   if(fallback?.tracks?.length)return locate(fallback.tracks,now.getTime()/1000-Number(config.epoch||0),config.fallbackPlaylist);
 }
 return locate(config.tracks||MAYU_DEMO.tracks,now.getTime()/1000-Number(config.epoch||MAYU_DEMO.epoch));
}
class Receiver {
  constructor(change) {
    this.change = change;
    this.media = new Audio();
    this.media.crossOrigin='anonymous';
    this.media.loop = false;
    this.volume = Number(localStorage.getItem('volume') ?? .7);
    this.media.volume = this.volume;
    this.status = 'Standby';
    this.filters = [];
    this.levels = Array(10).fill(0);
    this.equalized = true;
    this.config=MAYU_DEMO;
    this.base=(location.protocol==='chrome-extension:'||location.protocol==='file:')?MAYU_PUBLIC_ROOT:new URL('../',document.currentScript?.src||location.href).href;
    this.ready=this.loadStation();
    setInterval(()=>this.loadStation().catch(()=>{}),60000);
    this.currentSource='';this.currentTrack=null;this.wantPlayback=false;this.syncing=null;
    for (const [event, status] of Object.entries({playing:'Playing',pause:'Paused',waiting:'Tuning',error:'Audio unavailable'})) {
      this.media.addEventListener(event, () => { this.status = status; change(this.state()); });
    }
    this.media.addEventListener('ended',()=>{if(this.wantPlayback)this.sync(true).catch(()=>{});});
    setInterval(()=>{if(this.wantPlayback&&!this.syncing)this.sync(false).catch(()=>{});},1500);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({title:'MAYU ET AL.',artist:'Synchronized demo'});
      navigator.mediaSession.setActionHandler('play', () => this.command('play').catch(()=>{}));
      navigator.mediaSession.setActionHandler('pause', () => this.media.pause());
    }
  }
  state() { return {status:this.status, volume:this.volume, position:this.media.currentTime}; }
  async loadStation(){
    try{
      const response=await fetch(new URL('station.json',this.base),{cache:'no-store'});
      if(!response.ok)throw Error('station.json HTTP '+response.status);
      const value=await response.json();
      if(!mayuBroadcast(value)?.track?.src)throw Error('Invalid station');
      this.config=value;
    }catch(e){console.warn('MAYU radio: retaining last station config (demo if unavailable)',e);}
  }
  async sync(force=false){
    if(this.syncing)return this.syncing;
    this.syncing=this._sync(force);
    try{return await this.syncing}finally{this.syncing=null;}
  }
  async _sync(force){
    await this.ready;
    const selection=mayuBroadcast(this.config);
    if(!selection)throw Error('No playable radio tracks');
    const track=selection.track;
    const source=track.src==='generated:elevator'?window.makeElevatorAudioUrl():new URL(track.src,this.base).href;
    const changed=source!==this.currentSource;
    this.currentTrack=track;
    if(changed){
      this.currentSource=source;this.media.src=source;this.media.load();
      await new Promise((resolve,reject)=>{
        if(this.media.readyState>=1)return resolve();
        const cleanup=()=>{this.media.removeEventListener('loadedmetadata',ready);this.media.removeEventListener('error',failed);};
        const ready=()=>{cleanup();resolve();};
        const failed=()=>{cleanup();reject(Error('Unable to load '+track.title));};
        this.media.addEventListener('loadedmetadata',ready,{once:true});
        this.media.addEventListener('error',failed,{once:true});
      });
      if('mediaSession' in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:track.title||'MAYU ET AL.',artist:track.artist||'Independent radio'});
    }
    const drift=Math.abs(this.media.currentTime-selection.offset);
    if(changed||force||(drift>2&&selection.offset<Number(track.duration)-.3))
      this.media.currentTime=Math.max(0,Math.min(selection.offset,(this.media.duration||track.duration)-.08));
    if(this.wantPlayback&&this.media.paused)await this.media.play();
    this.change(this.state());
  }
  async command(type, value) {
    if (type === 'play') {
      this.wantPlayback=true;
      try{
        if (!this.context && window.AudioContext) {
          this.context = new AudioContext();
          let node = this.context.createMediaElementSource(this.media);
          for (const frequency of [60,170,310,600,1000,3000,6000,12000,14000,16000]) {
            const filter = this.context.createBiquadFilter();
            filter.type = 'peaking'; filter.frequency.value = frequency;
            node.connect(filter); node = filter; this.filters.push(filter);
          }
          this.applyEQ();
          this.analyser = this.context.createAnalyser(); node.connect(this.analyser); this.analyser.connect(this.context.destination);
        }
        if(this.context)await this.context.resume();
        await this.sync(true);
      }catch(e){this.wantPlayback=false;this.status='Audio unavailable';this.change(this.state());throw e;}
    }else if(type==='pause'){
      this.wantPlayback=false;this.media.pause();
    }else if(type==='volume'){
      this.media.volume=this.volume=Math.max(0,Math.min(1,Number(value)));
      localStorage.setItem('volume',this.volume);
    }else if(type==='state'){
      await this.ready;
    }
    return this.state();
  }
  applyEQ(){ this.filters.forEach((f,i)=>f.gain.value=this.equalized?this.levels[i]:0); }
}