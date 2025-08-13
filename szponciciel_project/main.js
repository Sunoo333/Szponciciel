const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs'); const path = require('path');

let mainWindow, splash;
const CONFIG_DIR = app.getPath('userData');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const DOCS_DIR = app.getPath('documents');
const ROOT_DIR = path.join(DOCS_DIR, 'Szponciciel');

const DEFAULTS = ["shoot gg","majestic rp","oslo rp","redux altv","citizen fivem"];

function ensureBase(){ if(!fs.existsSync(ROOT_DIR)) fs.mkdirSync(ROOT_DIR, { recursive: true }); }
function loadConfig(){
  if(!fs.existsSync(CONFIG_PATH)){
    const cfg = { accent: "#c21a1a", firstRun: true };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2)); return cfg;
  }
  try{ return JSON.parse(fs.readFileSync(CONFIG_PATH,'utf8')); }
  catch{ return { accent:"#c21a1a", firstRun:true }; }
}
function saveConfig(cfg){ fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg,null,2)); }

function createSplash(){
  splash = new BrowserWindow({ width:720,height:420,frame:false,resizable:false,show:false,backgroundColor:"#000000" });
  splash.loadFile(path.join(__dirname,'splash.html'));
  splash.once('ready-to-show', ()=> splash.show());
}
function createWindow(){
  mainWindow = new BrowserWindow({
    width:1200,height:800,show:false,backgroundColor:"#000000",title:"Szponciciel",
    icon: path.join(__dirname,'assets','icon.png'),
    webPreferences:{ preload: path.join(__dirname,'preload.js'), nodeIntegration:false, contextIsolation:true }
  });
  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname,'index.html'));
  mainWindow.once('ready-to-show', ()=> setTimeout(()=>{ splash?.close(); splash=null; mainWindow.show(); }, 3000));
}

app.whenReady().then(()=>{ ensureBase(); createSplash(); createWindow(); });
app.on('window-all-closed', ()=>{ if(process.platform!=='darwin') app.quit(); });

function fmt(ts){ const d=new Date(ts); const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; }

ipcMain.handle('loadConfig', async ()=> loadConfig());
ipcMain.handle('setAccent', async (e,hex)=>{ const c=loadConfig(); c.accent=hex; saveConfig(c); return true; });
ipcMain.handle('listFolders', async ()=>{ ensureBase(); return fs.readdirSync(ROOT_DIR,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name).sort((a,b)=>a.localeCompare(b)); });
ipcMain.handle('createFolder', async (e,name)=>{ ensureBase(); const safe=name.replace(/[\\/:*?"<>|]/g,'_').trim(); if(!safe) return false; const dir=path.join(ROOT_DIR,safe); if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true}); return true; });
ipcMain.handle('finishFirstRun', async (e,chosen)=>{ ensureBase(); (Array.isArray(chosen)?chosen:[]).forEach(n=>{ const d=path.join(ROOT_DIR,n); if(!fs.existsSync(d)) fs.mkdirSync(d,{recursive:true}); }); const c=loadConfig(); c.firstRun=false; saveConfig(c); return true; });
ipcMain.handle('listFiles', async (e,folder)=>{ ensureBase(); const dir=path.join(ROOT_DIR,folder); if(!fs.existsSync(dir)) return []; return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isFile()).map(e=>{ const p=path.join(dir,e.name); const s=fs.statSync(p); return { name:e.name, created:fmt(s.birthtimeMs||s.ctimeMs), ext:path.extname(e.name).toLowerCase() }; }).sort((a,b)=>a.name.localeCompare(b.name)); });
ipcMain.handle('importFiles', async (e,folder,paths)=>{ ensureBase(); const dir=path.join(ROOT_DIR,folder); if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true}); for(const src of paths){ try{ const base=path.basename(src); let dst=path.join(dir,base); const ext=path.extname(base); const stem=path.basename(base,ext); let i=1; while(fs.existsSync(dst)){ dst=path.join(dir,`${stem} (${i})${ext}`); i++; } fs.copyFileSync(src,dst); try{ const st=fs.statSync(src); fs.utimesSync(dst,st.atime,st.mtime);}catch{} }catch(err){ console.error('copy failed',src,err);} } return true; });
