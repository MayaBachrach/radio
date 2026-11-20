const {app,BrowserWindow,Menu,Tray,ipcMain}=require('electron');
const path=require('node:path');
let win,tray,mini=false,pinned=false,bounds;
app.whenReady().then(()=>{
 const icon=path.join(__dirname,'../extension/icon192.png');
 win=new BrowserWindow({width:1080,height:690,minWidth:360,minHeight:208,transparent:true,frame:false,icon,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,sandbox:true}});
 win.loadFile(path.join(__dirname,'../index.html'));
 tray=new Tray(icon);tray.setToolTip('MAYU ET AL.');
 tray.setContextMenu(Menu.buildFromTemplate([{label:'Show player',click:()=>win.show()},{role:'quit'}]));
 ipcMain.handle('resize',()=>{mini=!mini;if(mini){bounds=win.getBounds();win.setSize(360,208);win.setResizable(false);}else{win.setResizable(true);win.setBounds(bounds);}win.setAlwaysOnTop(mini&&pinned);win.webContents.send('mode',mini);});
 ipcMain.handle('pin',()=>{pinned=!pinned;win.setAlwaysOnTop(mini&&pinned);return pinned;});
});
app.on('window-all-closed',()=>app.quit());