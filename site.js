"use strict";
const el=id=>document.getElementById(id);let toastTimer;
for(let i=0;i<22;i++)el("equalizer").appendChild(document.createElement("i"));
function toast(message){let node=el("toast");node.textContent=message;node.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("show"),4500)}
function time(s){return Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0")}
const player=new RadioEngine({onError:toast,onChange:s=>{
 el("title").textContent=s.track.title;
 el("artist").textContent=s.track.artist||"";
 el("tagline").textContent=s.tagline||"";
 el("elapsed").textContent=time(s.position);
 el("length").textContent=time(s.duration);
 el("progress").style.width=(100*s.position/s.duration)+"%";
 el("counter").textContent=String(s.trackNumber).padStart(2,"0")+" / "+String(s.trackCount).padStart(2,"0");
 el("symbol").textContent=s.playing?"Ⅱ":"▶";
 el("playtext").textContent=s.playing?"הפסקת האזנה":"האזנה לשידור";
 el("play").classList.toggle("is-playing",s.playing);
 el("equalizer").classList.toggle("active",s.playing);
 el("play").setAttribute("aria-label",s.playing?"עצירה":"האזנה לשידור");
}});
el("play").addEventListener("click",()=>player.playingRequested?player.pause():player.play());
el("volume").addEventListener("input",e=>player.setVolume(Number(e.target.value)/100));
function clock(){el("clock").textContent=new Date().toLocaleTimeString("he-IL",{hour12:false})}
clock();setInterval(clock,1000);player.load();setInterval(()=>player.load(),60000);
window.addEventListener("focus",()=>player.tick());