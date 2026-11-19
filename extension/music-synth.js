/* A tiny original synthesized elevator-music demo. Generated locally: no third-party recordings. */
(function () {
  "use strict";
  let audioUrl;
  function makeElevatorAudioUrl() {
    if (audioUrl) return audioUrl;
    const sampleRate = 22050, lengthSeconds = 40, count = sampleRate * lengthSeconds;
    const pcm = new Float32Array(count);
    // Four 10-second chord sections, four bars each at 96 BPM.
    const chords = [[261.63,329.63,392.00,493.88],[220,261.63,329.63,440],[174.61,261.63,349.23,440],[196,246.94,293.66,392]];
    const bass = [130.81,110,87.31,98];
    const melody = [392,440,493.88,392,329.63,392,440,329.63,349.23,392,440,349.23,392,493.88,440,392];
    function note(start, duration, frequency, amplitude, kind) {
      const startSample = Math.round(start * sampleRate);
      const endSample = Math.min(count,Math.round((start + duration) * sampleRate));
      for (let i=startSample; i<endSample; i++) {
        if (i<0) continue;
        const t=(i-startSample)/sampleRate, progress=t/duration;
        const attack=Math.min(1,t/(kind==="pad"?.30:.012));
        const release=Math.min(1,(duration-t)/(kind==="pad"?.75:.22));
        const envelope=Math.max(0,Math.min(attack,release));
        let value;
        if (kind==="pad") value=.67*Math.sin(2*Math.PI*frequency*t)+.22*Math.sin(2*Math.PI*frequency*2*t)+.11*Math.sin(2*Math.PI*frequency*3*t);
        else if (kind==="bass") value=.85*Math.sin(2*Math.PI*frequency*t)+.15*Math.sin(2*Math.PI*frequency*2*t);
        else value=Math.sin(2*Math.PI*frequency*t)*Math.exp(-t*1.7)+.18*Math.sin(2*Math.PI*frequency*2*t)*Math.exp(-t*3);
        pcm[i]+=value*envelope*amplitude;
      }
    }
    for(let bar=0;bar<16;bar++){
      const start=bar*2.5, idx=Math.floor(bar/4);
      chords[idx].forEach((hz,k)=>note(start,2.48,hz, .029-(k*.003),"pad"));
      for(let beat=0;beat<4;beat++){
        const at=start+beat*.625;
        note(at,.51,bass[idx]*(beat%2?2:1),.13,"bass");
        if(beat%2===1) note(at,.26,melody[(bar+beat+idx)%melody.length],.07,"bell");
      }
      note(start+.02,.55,melody[bar%melody.length],.085,"bell");
      note(start+1.27,.49,melody[(bar+4)%melody.length],.063,"bell");
    }
    // Fade only the full composition's opening and closing to make the loop less abrupt.
    let peak=0;
    for(let i=0;i<count;i++) peak=Math.max(peak,Math.abs(pcm[i]));
    const gain=Math.min(.9/(peak||1),1.2);
    const bytes=new ArrayBuffer(44+count*2), view=new DataView(bytes);
    function word(offset,text){for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))}
    word(0,"RIFF");view.setUint32(4,36+count*2,true);word(8,"WAVE");word(12,"fmt ");
    view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
    view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);
    view.setUint16(32,2,true);view.setUint16(34,16,true);word(36,"data");view.setUint32(40,count*2,true);
    for(let i=0;i<count;i++){
      const edge=Math.min(1,i/(sampleRate*.11),(count-1-i)/(sampleRate*.11));
      const wave=Math.max(-1,Math.min(1,pcm[i]*gain*Math.max(0,edge)));
      view.setInt16(44+i*2,Math.round(wave*32767),true);
    }
    audioUrl=URL.createObjectURL(new Blob([bytes],{type:"audio/wav"}));
    return audioUrl;
  }
  window.makeElevatorAudioUrl=makeElevatorAudioUrl;
})();