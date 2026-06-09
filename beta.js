const $ = id => document.getElementById(id);
let tabs = [], activeTabId = null, nextTabId = 1;

// OS Storage Registries
const STORAGE = { BOOK: 'mc_bmk', HIST: 'mc_hist', EXT: 'mc_ext', DISK: 'vav_os_disk' };

const searchSel = $('searchEngine'), 
      addr = $('address'), 
      status = $('status'), 
      webArea = $('webviewArea'), 
      loading = $('loadingBar');
      
const bookmarksEl = $('bookmarksList'), 
      historyEl = $('historyList'), 
      addrFav = $('addrFavicon');

// Initialize Virtual OS Hard Drive Data Structs
if (!localStorage.getItem(STORAGE.DISK)) {
  const initialDisk = [
    { name: 'welcome.txt', content: 'Welcome to VavWebOS v1.0! A lightweight multitasking workspace operating inside an HTML browser container.' },
    { name: 'todo.txt', content: '- Upgrade kernel execution stack\n- Download more extensions from Web Mall\n- Configure custom desktop wallpaper matrix' }
  ];
  localStorage.setItem(STORAGE.DISK, JSON.stringify(initialDisk));
}

let extensions = JSON.parse(localStorage.getItem(STORAGE.EXT) || '[]');

function faviconFor(url){
  try{
    if(url.startsWith('vav://')) return "";
    let u=new URL(url);
    return "https://www.google.com/s2/favicons?sz=32&domain_url="+u.origin;
  }catch(e){return "";}
}

function installExtension(id, name, scriptContent) {
  let exts = JSON.parse(localStorage.getItem(STORAGE.EXT) || '[]');
  if (!exts.find(x => x.id === id)) {
    exts.push({ id, name, script: scriptContent });
    localStorage.setItem(STORAGE.EXT, JSON.stringify(exts));
    extensions = exts;
    alert(`⚡ Core System Module [${name}] loaded into kernel framework layers.`);
    renderWeb();
  } else {
    alert(`${name} is already active in memory.`);
  }
}

function injectExtensions(iframe) {
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc) return;
    extensions.forEach(ext => {
      if (doc.getElementById(`ext-${ext.id}`)) return;
      const scriptTag = doc.createElement('script');
      scriptTag.id = `ext-${ext.id}`;
      scriptTag.textContent = `try { ${ext.script} } catch(e) { console.error("OS App Exception:", e); }`;
      doc.body.appendChild(scriptTag);
    });
  } catch (e) {
    console.warn("Cross-Origin security protections running on external link target.");
  }
}

// =======================================================
// CORE OS DESKTOP & MULTITASKING SUB-SYSTEM ARCHITECTURE
// =======================================================
function getVavPage(url) {
  const target = url.toLowerCase().replace('vav://', '').trim() || 'home';
  
  // Base OS Component Stylesheets
  const osStyles = `
    <style>
      * { box-sizing: border-box; }
      body { background: radial-gradient(circle at center, #1e2530 0%, #0a0d14 100%); color: #fff; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 0; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
      
      /* Desktop Grid Layout */
      .desktop-area { flex: 1; position: relative; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, 90px); grid-template-rows: repeat(auto-fill, 100px); grid-auto-flow: column; gap: 15px; align-content: flex-start; }
      .shortcut { display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s; }
      .shortcut:hover { background: rgba(255, 255, 255, 0.1); }
      .shortcut .icon { font-size: 32px; margin-bottom: 6px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); }
      .shortcut .label { font-size: 12px; font-weight: 500; text-shadow: 0 1px 3px rgba(0,0,0,0.8); color: #e5e7eb; }
      
      /* Window Manager Subsystem */
      .window { position: absolute; min-width: 300px; min-height: 200px; background: #161a22; border: 1px solid #2a313e; border-radius: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); display: flex; flex-direction: column; overflow: hidden; z-index: 10; }
      .window-header { background: #1f2530; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; border-bottom: 1px solid #2a313e; }
      .window-title { font-size: 13px; font-weight: 600; color: #00bcd4; display: flex; align-items: center; gap: 6px; }
      .window-controls { display: flex; gap: 8px; }
      .win-btn { width: 12px; height: 12px; border-radius: 50%; cursor: pointer; border: none; }
      .win-close { background: #ef4444; } .win-max { background: #10b981; }
      .window-body { flex: 1; padding: 15px; overflow: auto; background: #0e1116; }
      
      /* App Layout Elements */
      .box-container { max-width: 100%; }
      h1 { color: #00bcd4; font-size: 20px; margin-top: 0; margin-bottom: 12px; font-weight: 500; }
      p { color: #9ca3af; font-size: 13px; margin-bottom: 16px; line-height: 1.5; }
      .card-item { background: #181c24; border: 1px solid #2a313e; padding: 12px; margin-bottom: 10px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
      .sys-btn { background: #1f242e; color: #fff; border: 1px solid #2a313e; padding: 6px 14px; border-radius: 15px; cursor: pointer; font-size: 12px; transition: all 0.2s; }
      .sys-btn:hover { background: #00bcd4; color: #0e1116; border-color: #00bcd4; }
      
      /* Taskbar Elements */
      .taskbar { height: 44px; background: rgba(24, 28, 36, 0.85); backdrop-filter: blur(10px); border-top: 1px solid rgba(42, 49, 62, 0.5); display: flex; align-items: center; padding: 0 12px; justify-content: space-between; z-index: 9999; }
      .taskbar-start { display: flex; gap: 8px; align-items: center; }
      .start-button { background: linear-gradient(135deg, #00bcd4, #00838f); color: #0e1116; font-weight: bold; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; }
      .running-apps { display: flex; gap: 6px; margin-left: 12px; }
      .active-task { background: #2a313e; border: 1px solid #00bcd4; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; }
      .system-tray { font-size: 12px; color: #9ca3af; font-family: monospace; }
    </style>
  `;

  // IFRAME OS DESKTOP ENVIRONMENT TARGET CONTAINER
  if (target === 'home' || target === 'os') {
    return `<html><head>${osStyles}</head><body>
      <div class="desktop-area" id="desktop">
        <div class="shortcut" onclick="launchApp('File Explorer', 'files')"><div class="icon">📁</div><div class="label">Files</div></div>
        <div class="shortcut" onclick="launchApp('Task Manager', 'tasks')"><div class="icon">📊</div><div class="label">Tasks</div></div>
        <div class="shortcut" onclick="launchApp('Web Mall', 'mall')"><div class="icon">🏪</div><div class="label">App Mall</div></div>
        <div class="shortcut" onclick="launchApp('Control Panel', 'settings')"><div class="icon">⚙️</div><div class="label">Settings</div></div>
        <div class="shortcut" onclick="window.parent.nav('https://google.com')"><div class="icon">🌐</div><div class="label">Web Browser</div></div>
      </div>

      <div class="taskbar">
        <div class="taskbar-start">
          <button class="start-button" onclick="alert('VavOS Kernel v1.00 - Connected.')">VavOS</button>
          <div class="running-apps" id="taskbarApps"></div>
        </div>
        <div class="system-tray" id="clock">00:00:00 AM</div>
      </div>

      <script>
        let windowCount = 0;
        
        function launchApp(name, targetId) {
          windowCount++;
          const desktop = document.getElementById('desktop');
          const win = document.createElement('div');
          win.className = 'window';
          win.id = 'win-' + windowCount;
          win.style.top = (50 + (windowCount * 25) % 200) + 'px';
          win.style.left = (50 + (windowCount * 25) % 300) + 'px';
          win.style.width = '500px';
          win.style.height = '350px';
          
          win.innerHTML = \`
            <div class="window-header" onmousedown="startDrag(event, '\${win.id}')">
              <div class="window-title">⚙️ \${name}</div>
              <div class="window-controls">
                <button class="win-btn win-max" onclick="alert('Window scaling maintained by kernel.')"></button>
                <button class="win-btn win-close" onclick="closeWindow('\${win.id}')"></button>
              </div>
            </div>
            <div class="window-body">
              <iframe srcdoc="\${window.parent.getOSAppContent(targetId)}" style="width:100%; height:100%; border:none; background:transparent;"></iframe>
            </div>
          \`;
          
          desktop.appendChild(win);
          updateTaskbar();
        }

        function closeWindow(id) {
          const w = document.getElementById(id);
          if(w) w.remove();
          updateTaskbar();
        }

        function updateTaskbar() {
          const tray = document.getElementById('taskbarApps');
          tray.innerHTML = '';
          document.querySelectorAll('.window').forEach(w => {
            const title = w.querySelector('.window-title').textContent;
            const btn = document.createElement('div');
            btn.className = 'active-task';
            btn.textContent = title;
            tray.appendChild(btn);
          });
        }

        // Draggable Window Script Engine Hook
        function startDrag(e, winId) {
          if(e.target.className === 'win-btn') return;
          const win = document.getElementById(winId);
          let posX = e.clientX, posY = e.clientY;
          
          function mouseMoveHandler(moveEvent) {
            const dx = moveEvent.clientX - posX;
            const dy = moveEvent.clientY - posY;
            posX = moveEvent.clientX;
            posY = moveEvent.clientY;
            win.style.top = (win.offsetTop + dy) + "px";
            win.style.left = (win.offsetLeft + dx) + "px";
          }
          
          function mouseUpHandler() {
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
          }
          
          document.addEventListener('mousemove', mouseMoveHandler);
          document.addEventListener('mouseup', mouseUpHandler);
        }

        // System Clock Tick Thread
        setInterval(() => {
          document.getElementById('clock').textContent = new Date().toLocaleTimeString();
        }, 1000);
      </script>
    </body></html>`;
  }
  
  // Return baseline fallback loop for external URL requests outside system root
  return `<html><head>${osStyles}</head><body><h1>404</h1><p>Kernel process target Address <code>vav://${target}</code> not mapped.</p></body></html>`;
}

// =======================================================
// SYSTEM CORE APPLICATION RUNTIME INTERFACES
// =======================================================
function getOSAppContent(appId) {
  const innerStyle = `
    <style>
      body { background: #0e1116; color: #fff; font-family: sans-serif; padding: 10px; margin:0; font-size:13px; }
      h2 { color: #00bcd4; font-size: 16px; margin-top: 0; }
      .item-row { background: #181c24; border: 1px solid #2a313e; padding: 8px; margin-bottom: 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
      .btn-action { background: #1f242e; color: #fff; border: 1px solid #2a313e; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size:11px; }
      .btn-action:hover { background: #00bcd4; color: #0e1116; }
      textarea { width:100%; height:80px; background:#181c24; border:1px solid #2a313e; color:#fff; padding:6px; border-radius:4px; font-family:monospace; resize:none; }
    </style>
  `;

  if (appId === 'files') {
    const disk = JSON.parse(localStorage.getItem(STORAGE.DISK) || '[]');
    let rows = disk.map(f => `
      <div class="item-row">
        <div>📄 <strong>${f.name}</strong> (${f.content.length} bytes)</div>
        <button class="btn-action" onclick="alert(\`File Content:\\n\\n${f.content.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">View</button>
      </div>
    `).join('');
    
    return `<html><head>${innerStyle}</head><body>
      <h2>📁 Virtual System Storage Explorer</h2>
      <div style="margin-bottom:12px;">Create Virtual Resource Node:</div>
      <input type="text" id="fn" placeholder="filename.txt" style="background:#181c24; border:1px solid #2a313e; color:#fff; padding:4px; margin-bottom:4px; width:100%;">
      <textarea id="fc" placeholder="Enter text data block values..."></textarea>
      <button class="btn-action" style="margin-top:6px; width:100%;" onclick="saveFile()">Write to Disk Sector</button>
      <hr style="border-color:#2a313e; margin:12px 0;">
      ${rows || '<p>No items registered on local sectors.</p>'}
      
      <script>
        function saveFile() {
          const name = document.getElementById('fn').value.trim();
          const content = document.getElementById('fc').value;
          if(!name) return alert('Specify file write mapping name.');
          let disk = JSON.parse(localStorage.getItem('${STORAGE.DISK}') || '[]');
          disk.push({name, content});
          localStorage.setItem('${STORAGE.DISK}', JSON.stringify(disk));
          location.reload();
        }
      </script>
    </body></html>`;
  }

  if (appId === 'tasks') {
    return `<html><head>${innerStyle}</head><body>
      <h2>📊 System Core Task Registry Monitor</h2>
      <p>Performance Context Allocation Profile:</p>
      <div class="item-row"><div>⚡ Core Engine Thread</div><span style="color:#10b981">STABLE RUNNING</span></div>
      <div class="item-row"><div>💾 Web Storage Sector Allocations</div><span>${localStorage.length} Profiles loaded</span></div>
      <div class="item-row"><div>📡 Program Extensions Installed</div><span>${extensions.length} Drivers Active</span></div>
      <button class="btn-action" style="width:100%; background:#ef4444;" onclick="window.parent.location.reload()">Flush Core Environment Cache</button>
    </body></html>`;
  }

  if (appId === 'mall') {
    return `<html><head>${innerStyle}</head><body>
      <h2>🏪 Global Application Mall Integration</h2>
      <p>Dynamically download modules directly into your OS workspace:</p>
      <div class="item-row">
        <div>🛡️ <strong>AdBlock Kernel Override</strong><br><small style="color:#9ca3af">Purges advertising framework elements layout blocks.</small></div>
        <button class="btn-action" onclick="window.parent.installExtension('adblock', 'AdBlock Core', 'document.querySelectorAll(\\'#ad, .ads\\').forEach(e => e.remove());')">Deploy</button>
      </div>
      <div class="item-row">
        <div>🎨 <strong>Matrix Neon UI Injection</strong><br><small style="color:#9ca3af">Forces neon cyan font styling rules universally.</small></div>
        <button class="btn-action" onclick="window.parent.installExtension('matrix', 'Neon Override', 'const s=document.createElement(\\'style\\'); s.innerHTML=\\'* { color: #00ffff !important; }\\'; document.head.appendChild(s);')">Deploy</button>
      </div>
    </body></html>`;
  }

  if (appId === 'settings') {
    return `<html><head>${innerStyle}</head><body>
      <h2>⚙️ Control Panel System Matrix</h2>
      <p>OS Metadata Variables:</p>
      <div class="item-row"><div>Kernel Variant</div><strong>VavWebOS Native</strong></div>
      <div class="item-row"><div>Sandbox Interface Platform</div><strong>Chromium Window Shell</strong></div>
      <div class="item-row"><div>Hardware Rendering Pipeline</div><strong>GPU Raster Vector Map</strong></div>
      <button class="btn-action" onclick="alert('Kernel telemetry checks pass verification standard profiles.')">Verify Integrity</button>
    </body></html>`;
  }

  return `<html><body>No Application Source Found.</body></html>`;
}

// Hook sub-app router to global layout target frames
window.getOSAppContent = getOSAppContent;

// =======================================================
// BASELINE WEB SHELL NAVIGATION ENGINE ADAPTERS
// =======================================================
function createTab(url='',activate=true){
  if(!url) url = 'vav://os'; // Route initial browser target straight to OS Workspace Container
  const id='t'+(nextTabId++);
  const tab={id,url,history:url?[url]:[],i:url?0:-1,title:'Operating System Workspace',iframe:null,favicon:''};
  tabs.push(tab);
  if(activate) activateTab(id);
  renderTabs();
}

function renderTabs(){
  $('tabs').innerHTML='';
  tabs.forEach(t=>{
    const el=document.createElement('div');
    el.className='tab'+(t.id===activeTabId?' active':'');
    el.innerHTML=`<div class="favicon">${t.favicon?`<img src="${t.favicon}">`:''}</div>
                  <div class="title">${t.title}</div>
                  <div class="close">✕</div>`;
    el.onclick=()=>activateTab(t.id);
    el.querySelector('.close').onclick=(e)=>{e.stopPropagation();closeTab(t.id)};
    $('tabs').appendChild(el);
  });
  const btn=document.createElement('button');btn.className='add-tab';btn.textContent='+';btn.onclick=()=>createTab('',true);
  $('tabs').appendChild(btn);
}

function activateTab(id){
  activeTabId=id;renderTabs();renderWeb();
  const t=getTab(id); if(t) { addr.value=t.url||'';addrFav.src=t.favicon||''; }
}

function getTab(id){return tabs.find(t=>t.id===id);}

function closeTab(id){
  const i=tabs.findIndex(x=>x.id===id);
  if(i < 0) return;
  if(tabs[i].iframe) tabs[i].iframe.remove();
  tabs.splice(i,1);
  activeTabId=tabs.length ? tabs[Math.max(0,i-1)].id : null;
  renderTabs(); renderWeb();
}

function renderWeb(){
  tabs.forEach(t=>{
    if(!t.iframe){
      const ifr = document.createElement('iframe');ifr.className='webview';ifr.dataset.tab=t.id;webArea.appendChild(ifr);t.iframe=ifr;
      ifr.addEventListener('load',()=>{
        if(t.url.startsWith('vav://')) {
          t.title = "VavWebOS System Workspace";
          t.favicon = '';
        } else {
          t.title=t.url||'Web Window Target';t.favicon=faviconFor(t.url);
        }
        injectExtensions(ifr);
        renderTabs();if(t.id===activeTabId)addrFav.src=t.favicon;
        loading.style.width='0%';status.textContent='System Loaded';
      });
    }
    t.iframe.style.display=t.id===activeTabId?'block':'none';
    
    if(t.id===activeTabId && t.url){
      if(t.url.startsWith('vav://')) {
        if(t.iframe.dataset.loadedUrl !== t.url) {
          t.iframe.dataset.loadedUrl = t.url;
          t.iframe.removeAttribute('src');
          loading.style.width='70%';status.textContent='Compiling Workspace Virtualization Environments...';
          t.iframe.srcdoc = getVavPage(t.url);
        }
      } else {
        if(t.iframe.src!==t.url){
          t.iframe.dataset.loadedUrl = '';
          t.iframe.removeAttribute('srcdoc');
          loading.style.width='70%';status.textContent='Accessing Remote Link...';
          t.iframe.src=t.url;
        }
      }
    }
  });
}

function nav(raw){
  const t=getTab(activeTabId);if(!t)return;
  let u=raw.trim();if(!u)return;
  
  if(/^vav:\/\//i.test(u)){
    // System core direct channel validation pass
  } else if(/\s/.test(u)||!u.includes('.')) {
    u=searchSel.value+encodeURIComponent(u);
  } else if(!/^https?:\/\//.test(u)) {
    u='https://'+u;
  }
  
  t.history=t.history.slice(0,t.i+1);t.history.push(u);t.i++;
  t.url=u;addr.value=u;t.favicon=faviconFor(u);addrFav.src=t.favicon;
  loading.style.width='40%';status.textContent='Processing...';
  renderWeb();pushHist(u);
}

function pushHist(u){const h=JSON.parse(localStorage.getItem(STORAGE.HIST)||'[]');h.unshift({u,ts:Date.now()});localStorage.setItem(STORAGE.HIST,JSON.stringify(h.slice(0,100)));renderPanels();}
function addBmk(u){const b=JSON.parse(localStorage.getItem(STORAGE.BOOK)||'[]');if(!b.find(x=>x.u===u)){b.unshift({u,ts:Date.now()});localStorage.setItem(STORAGE.BOOK,JSON.stringify(b));renderPanels();}}

function renderPanels(){
  bookmarksEl.innerHTML='';JSON.parse(localStorage.getItem(STORAGE.BOOK)||'[]').forEach(x=>{
    const d=document.createElement('div');d.className='card';d.innerHTML=`<div>${x.u}</div><small>★</small>`;d.onclick=()=>nav(x.u);bookmarksEl.appendChild(d);
  });
  historyEl.innerHTML='';JSON.parse(localStorage.getItem(STORAGE.HIST)||'[]').forEach(x=>{
    const d=document.createElement('div');d.className='card';d.innerHTML=`<div>${x.u}</div><small>${new Date(x.ts).toLocaleTimeString()}</small>`;d.onclick=()=>nav(x.u);historyEl.appendChild(d);
  });
}

$('goBtn').onclick=()=>nav(addr.value);addr.onkeydown=e=>{if(e.key==='Enter')nav(addr.value);}
$('reload').onclick=()=>{const t=getTab(activeTabId);if(t) { if(t.url.startsWith('vav://')) { t.iframe.srcdoc = getVavPage(t.url); } else { t.iframe.src=t.url; } } }
$('home').onclick=()=>nav('vav://os');
$('bookmarkBtn').onclick=()=>{const t=getTab(activeTabId);if(t&&t.url)addBmk(t.url);}
$('toggleBookmarks').onclick=()=>{$('sidePanels').style.display=$('sidePanels').style.display==='none'?'block':'none';}
$('back').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i>0){t.i--;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}
$('forward').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i<t.history.length-1){t.i++;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}

createTab('',true);renderPanels();
window.nav = nav;
window.installExtension = installExtension;
