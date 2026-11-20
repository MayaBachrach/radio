class Receiver {
  constructor(change) {
    this.media = new Audio();
    this.media.loop = true;
    this.volume = Number(localStorage.getItem('volume') ?? .7);
    this.media.volume = this.volume;
    this.status = 'Standby';
    this.filters = [];
    this.levels = Array(10).fill(0);
    this.equalized = true;
    for (const [event, status] of Object.entries({playing:'Playing',pause:'Paused',waiting:'Tuning',error:'Audio unavailable',ended:'Paused'})) {
      this.media.addEventListener(event, () => { this.status = status; change(this.state()); });
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({title:'MAYU ET AL.',artist:'Synchronized demo'});
      navigator.mediaSession.setActionHandler('play', () => this.command('play').catch(()=>{}));
      navigator.mediaSession.setActionHandler('pause', () => this.media.pause());
    }
  }
  state() { return {status:this.status, volume:this.volume, position:this.media.currentTime}; }
  async command(type, value) {
    if (type === 'play') {
      if (!this.media.src) this.media.src = window.makeElevatorAudioUrl();
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
      if(this.context) await this.context.resume();
      this.media.currentTime = ((Date.now()/1000-1795046400)%40+40)%40;
      await this.media.play();
    } else if(type === 'pause') this.media.pause();
    else if(type === 'volume') {this.media.volume = this.volume = Number(value); localStorage.setItem('volume',this.volume);}
    return this.state();
  }
  applyEQ(){ this.filters.forEach((f,i)=>f.gain.value=this.equalized?this.levels[i]:0); }
}