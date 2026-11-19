const el=id=>document.getElementById(id);
let epoch=1795046400;
let tracks=[{title:"Elevator To Nowhere",artist:"RADIO 001 · Original",src:"generated:elevator",duration:40}];
function render(){
 el("tracks").replaceChildren(...tracks.map((t,i)=>{
 const section=document.createElement("section");section.className="track-row";
 for(const [key,label,type] of [["title","שם השיר","text"],["artist","אמן / קרדיט","text"],["src","קובץ · audio/name.mp3","text"],["duration","משך בשניות","number"]]){
  const wrap=document.createElement("div"),caption=document.createElement("label"),input=document.createElement("input");
  caption.textContent=label;input.type=type;input.value=t[key];input.required=true;
  if(type==="number"){input.min=".1";input.step=".01"}
  input.addEventListener("input",()=>t[key]=type==="number"?Number(input.value):input.value);
  wrap.append(caption,input);section.append(wrap);
 }
 const remove=document.createElement("button");remove.type="button";remove.className="btn remove";remove.textContent="✕ הסרת שיר";
 remove.addEventListener("click",()=>{if(tracks.length===1)return alert("חייב להישאר שיר אחד לפחות.");tracks.splice(i,1);render()});
 section.append(remove);return section;
 }));
}
el("add").addEventListener("click",()=>{tracks.push({title:"New track",artist:"",src:"audio/new-track.mp3",duration:180});render()});
el("editor").addEventListener("submit",event=>{
 event.preventDefault();
 if(tracks.some(t=>!t.src||!(Number(t.duration)>0)))return alert("בדקי את שמות הקבצים והמשכים");
 const blob=new Blob([JSON.stringify({name:el("name").value,tagline:el("tagline").value,epoch,tracks},null,2)+"\n"],{type:"application/json"});
 const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="station.json";link.click();
 setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
fetch("./station.json",{cache:"no-store"}).then(r=>r.ok?r.json():Promise.reject()).then(c=>{
 epoch=Number(c.epoch)||epoch;tracks=c.tracks||tracks;el("name").value=c.name||"RADIO 001";el("tagline").value=c.tagline||"";render();
}).catch(render);