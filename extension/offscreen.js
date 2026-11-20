const radio=new Receiver(state=>chrome.runtime.sendMessage({target:'indicator',playing:state.status==='Playing'}));
chrome.runtime.onMessage.addListener((m,s,reply)=>{
  if(m.target!=='offscreen')return;
  radio.command(m.type,m.value).then(reply).catch(e=>reply({error:e.message}));return true;
});