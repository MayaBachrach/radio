"use strict";
(() => {
  const REPO="MayaBachrach/radio";
  const DAYS=["יום א׳","יום ב׳","יום ג׳","יום ד׳","יום ה׳","יום ו׳","שבת"];
  const $=id=>document.getElementById(id);
  let station={schedule:[],playlists:{}},day=0,hour=20,loadError=false;
  const clock=h=>String(h).padStart(2,"0")+":00";
  const slotAt=(d,h)=>(station.schedule||[]).find(s=>Array.isArray(s.days)&&s.days.includes(d)&&s.start===clock(h)&&s.durationMinutes===60);
  function spotifyUrl(input){
    try{
      const u=new URL(input.trim());
      const id=u.pathname.match(/^\/playlist\/([A-Za-z0-9]{22})\/?$/);
      return u.protocol==="https:"&&u.hostname==="open.spotify.com"&&id?"https://open.spotify.com/playlist/"+id[1]:null;
    }catch{return null;}
  }
  function refreshSelection(){
    const old=slotAt(day,hour);
    const span=document.createElement("bdi");span.setAttribute("dir","ltr");span.textContent=clock(hour)+"–"+clock((hour+1)%24);
    $("selectedTime").replaceChildren(document.createTextNode(DAYS[day]+" · "),span);
    $("replaceLine").style.display=old?"flex":"none";
    if(!old)$("replace").checked=false;
    $("occupiedNotice").textContent=old?"כבר משובץ: "+(station.playlists?.[old.playlist]?.name||old.playlist):"השעה הזאת פנויה";
  }
  function render(){
    $("days").replaceChildren(...DAYS.map((name,d)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=name;button.setAttribute("aria-pressed",String(d===day));
      button.onclick=()=>{day=d;render();};
      return button;
    }));
    $("slots").replaceChildren(...Array.from({length:24},(_,h)=>{
      const old=slotAt(day,h);
      const button=document.createElement("button");
      button.type="button";button.className="slot"+(old?" occupied":"")+(h===hour?" active":"");
      button.setAttribute("aria-pressed",String(h===hour));
      const time=document.createElement("span");time.className="slot-hour";time.textContent=clock(h);
      const label=document.createElement("span");label.className="slot-playlist";
      label.textContent=old?(station.playlists?.[old.playlist]?.name||old.playlist):"פנוי";
      button.title=clock(h)+" — "+label.textContent;button.append(time,label);
      button.onclick=()=>{hour=h;render();};
      return button;
    }));
    refreshSelection();
  }
  async function load(){
    try{
      const response=await fetch("./station.json?refresh="+Date.now(),{cache:"no-store"});
      if(!response.ok)throw Error("HTTP "+response.status);
      station=await response.json();loadError=false;
      $("scheduleStatus").textContent="שעות בשעון ישראל. רעננו את הדף כדי לראות שיבוצים חדשים.";
    }catch(error){
      loadError=true;
      $("scheduleStatus").textContent="לא הצלחתי לטעון את לוח השידורים. רעננו את הדף.";
    }
    render();
  }
  const drop=$("dropzone");
  for(const event of ["dragenter","dragover"])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.add("dragover");});
  for(const event of ["dragleave","drop"])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.remove("dragover");});
  drop.addEventListener("drop",e=>{
    const text=e.dataTransfer.getData("text/uri-list")||e.dataTransfer.getData("text/plain");
    $("playlistUrl").value=(text||"").split(/\r?\n/).find(line=>line.includes("open.spotify.com/playlist/"))||(text||"").trim();
  });
  $("requestForm").addEventListener("submit",e=>{
    e.preventDefault();
    if(loadError){alert("הלוח לא נטען, רעננו את העמוד לפני השיבוץ.");return;}
    const url=spotifyUrl($("playlistUrl").value);
    if(!url){alert("נא להדביק קישור תקין לפלייליסט Spotify.");return;}
    const existing=slotAt(day,hour);
    if(existing&&!$("replace").checked){alert("השעה הזאת כבר תפוסה. סמנו החלפה או בחרו שעה אחרת.");return;}
    if(!$("rights").checked){alert("נדרש אישור לשידור ההקלטות.");return;}
    const payload={
      version:1,day,hour,curator:$("curator").value.trim(),name:$("playlistName").value.trim(),
      spotify_url:url,replace:Boolean(existing),
      expected_playlist:existing?.playlist||null,rights_confirmed:true
    };
    if(!payload.curator||!payload.name){alert("נא להזין שם ושם פלייליסט.");return;}
    if(existing&&!confirm("להחליף את "+(station.playlists?.[existing.playlist]?.name||existing.playlist)+" בשעה הזאת?"))return;
    const body=[
      "<!-- MAYU-SCHEDULE-V1 -->","בקשת שיבוץ שנוצרה בממשק MAYU ET AL. MUSIC DESK.","",
      "~~~json",JSON.stringify(payload,null,2),"~~~","",
      "יום ושעה: "+DAYS[day]+" "+clock(hour)+" לפי שעון ישראל.",
      "הבקשה תעובד רק לאחר מתן ההרשאה הנדרשת."
    ].join("\n");
    const urlIssue=new URL("https://github.com/"+REPO+"/issues/new");
    urlIssue.searchParams.set("title","MAYU AIRTIME | "+DAYS[day]+" "+clock(hour)+" | "+payload.name);
    urlIssue.searchParams.set("body",body);
    window.open(urlIssue.href,"_blank","noopener,noreferrer");
  });
  load();
})();
