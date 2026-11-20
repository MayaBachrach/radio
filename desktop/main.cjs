const {app,BrowserWindow,Menu,Tray,ipcMain}=require('electron');
const path=require('node:path');
let win,tray,mini=false,pinned=false,bounds;
// Native hit region follows the CSS corner radius on Windows and Linux.
function shapeMiniWindow(){
 if(process.platform==='darwin'||typeof win.setShape!=='function')return;
 if(!mini){win.setShape([]);return;}
 const [width,height]=win.getSize(),radius=27,rows=[];
 for(let y=0;y<height;y++){
   const distance=Math.max(radius-y-.5,y+.5-(height-radius),0);
   const inset=Math.ceil(radius-Math.sqrt(radius*radius-distance*distance));
   rows.push({x:inset,y,width:width-2*inset,height:1});
 }
 win.setShape(rows);
}
app.whenReady().then(()=>{
 const icon=path.join(__dirname,'../extension/icon192.png');
 win=new BrowserWindow({width:1080,height:690,minWidth:360,minHeight:208,transparent:true,frame:false,icon,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true}});
 win.loadFile(path.join(__dirname,'../index.html'));
 tray=new Tray(icon);tray.setToolTip('MAYU ET AL.');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'Show player',click:()=>win.show()},{role:'quit'}]));
 ipcMain.handle('resize',()=>{mini=!mini;if(mini){bounds=win.getBounds();win.setSize(360,208);win.setResizable(false);}else{win.setResizable(true);win.setBounds(bounds);}shapeMiniWindow();win.setAlwaysOnTop(mini&&pinned);win.webContents.send('mode',mini);});
 ipcMain.handle('pin',()=>{pinned=!pinned;win.setAlwaysOnTop(mini&&pinned);return pinned;});
});
app.on('window-all-closed',()=>app.quit());