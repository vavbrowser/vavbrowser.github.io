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

// Dynamic layout mutation: Hide the original browser top navigation elements to force true OS view
if ($('tabs')) $('tabs').style.display = 'none';
// Check if a parent toolbar container exists and hide it (safeguard for varying HTML layouts)
const topBar = addr ? addr.parentElement : null;
if (topBar && topBar.className !== 'window-header') {
  topBar.style.display = 'none';
}

// Initialize Virtual Hard Drive Structure
if (!localStorage.getItem(STORAGE.DISK)) {
  const initialDisk = [
    { name: 'welcome.txt', content: 'Welcome to VavWindows WebOS! A multitasking interface running inside an isolated HTML layout engine.' },
    { name: 'system_manifest.json', content: '{ "os_version": "11.0.4", "kernel_build": "vav-9.2", "architecture": "x64-web" }' }
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
    alert(`⚙️ Driver Module [${name}] loaded successfully.`);
    renderWeb();
  } else {
    alert(`${name} driver is already active.`);
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
      scriptTag.textContent = `try { ${ext.script} } catch(e) { console.error("OS App Error:", e); }`;
      doc.body.appendChild(scriptTag);
    });
  } catch (e) {
    console.warn("Cross-Origin restriction active on link target.");
  }
}

// =======================================================
// CORE OS WINDOWS DESKTOP & DESKTOP ENVIRONMENT
// =======================================================
function getVavPage(url) {
  const target = url.toLowerCase().replace('vav://', '').trim() || 'home';
  
  // Windows Desktop Design Blueprint
  const windowsStyles = `
    <style>
      * { box-sizing: border-box; }
      body { 
        background: url('https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1920') no-repeat center center fixed; 
        background-size: cover;
        color: #fff; 
        font-family: 'Segoe UI', system-ui, sans-serif; 
        margin: 0; padding: 0; 
        height: 100vh; 
        overflow: hidden; 
        display: flex; 
        flex-direction: column; 
      }
      
      /* Desktop App Icons Grid */
      .desktop-area { flex: 1; position: relative; padding: 15px; display: grid; grid-template-columns: repeat(auto-fill, 85px); grid-template-rows: repeat(auto-fill, 95px); grid-auto-flow: column; gap: 10px; align-content: flex-start; }
      .shortcut { display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 6px; border-radius: 4px; border: 1px solid transparent; transition: all 0.15s; }
      .shortcut:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(5px); }
      .shortcut .icon { font-size: 34px; margin-bottom: 4px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.4)); }
      .shortcut .label { font-size: 12px; font-weight: 400; text-shadow: 0 1px 4px rgba(0,0,0,0.9); color: #f3f4f6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
      
      /* Fluent / Windows Style Window System */
      .window { position: absolute; min-width: 320px; min-height: 220px; background: rgba(28, 33, 46, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; box-shadow: 0 16px 40px rgba(0,0,0,0.5); display: flex; flex-direction: column; overflow: hidden; z-index: 10; transition: transform 0.1s ease-out; }
      .window-header { background: rgba(36, 43, 60, 0.5); padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
      .window-title { font-size: 12px; font-weight: 400; color: #e5e7eb; display: flex; align-items: center; gap: 8px; }
      .window-controls { display: flex; gap: 1px; }
      .win-btn { width: 32px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-family: monospace; cursor: pointer; border: none; background: transparent; color: #fff; border-radius: 3px; transition: background 0.15s; margin-top: -8px; margin-right: -12px; }
      .win-btn:hover { background: rgba(255,255,255,0.1); }
      .win-close:hover { background: #e81123 !important; }
      .window-body { flex: 1; padding: 0; overflow: auto; background: #0c0f16; }
      
      /* Centered Windows 11 Taskbar Elements */
      .taskbar { height: 48px; background: rgba(32, 38, 52, 0.75); backdrop-filter: blur(25px); border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; padding: 0 16px; justify-content: space-between; z-index: 9999; }
      .taskbar-center { position: absolute; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; align-items: center; }
      .start-button { background: transparent; border: none; font-size: 24px; cursor: pointer; border-radius: 4px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
      .start-button:hover { background: rgba(255,255,255,0.1); }
      .running-apps { display: flex; gap: 4px; }
      .active-task { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 4px; font-size: 20px; cursor: pointer; position: relative; transition: background 0.2s; }
      .active-task:hover { background: rgba(255,255,255,0.15); }
      .active-task::after { content: ''; position: absolute; bottom: 2px; left: 25%; width: 50%; height: 3px; background: #00bcd4; border-radius: 2px; }
      .system-tray { font-size: 11px; color: #e5e7eb; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; }
      
      /* Floating Windows Start Menu */
      .start-menu { position: absolute; bottom: 56px; left: 50%; transform: translateX(-50%) translateY(100px); width: 520px; height: 600px; background: rgba(24, 29, 41, 0.88); backdrop-filter: blur(30px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); z-index: 10000; display: none; opacity: 0; transition: all 0.25s cubic-bezier(0.1, 0.9, 0.2, 1); padding: 32px; }
      .start-menu.open { display: block; opacity: 1; transform: translateX(-50%) translateY(0); }
      .start-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; }
      .start-item { display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 12px; border-radius: 6px; transition: background 0.2s; }
      .start-item:hover { background: rgba(255,255,255,0.08); }
      .start-item .s-icon { font-size: 28px; margin-bottom: 8px; }
      .start-title { font-size: 13px; color: #e5e7eb; }
    </style>
  `;

  if (target === 'home' || target === 'os') {
    return `<html><head>${windowsStyles}</head><body>
      
      <div class="desktop-area" id="desktop">
        <div class="shortcut" onclick="launchApp('This PC', 'files', '💻')"><div class="icon">💻</div><div class="label">This PC</div></div>
        <div class="shortcut" onclick="launchApp('Microsoft Edge Web', 'browser', '🌐')"><div class="icon">🌐</div><div class="label">Web Explorer</div></div>
        <div class="shortcut" onclick="launchApp('Task Manager', 'tasks', '📊')"><div class="icon">📊</div><div class="label">Task Manager</div></div>
        <div class="shortcut" onclick="launchApp('Microsoft Store', 'mall', '🏪')"><div class="icon">🏪</div><div class="label">App Store</div></div>
        <div class="shortcut" onclick="launchApp('Settings', 'settings', '⚙️')"><div class="icon">⚙️</div><div class="label">Settings</div></div>
      </div>

      <div class="start-menu" id="startMenu">
        <input type="text" placeholder="Type here to search..." style="width:100%; padding:8px 14px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#fff; font-size:13px; outline:none;">
        <h4 style="margin: 24px 0 12px 0; font-weight:500; color:#9ca3af; font-size:12px;">Pinned Apps</h4>
        <div class="start-grid">
          <div class="start-item" onclick="toggleStart(); launchApp('This PC', 'files', '💻')"><div class="s-icon">💻</div><div class="start-title">File Explorer</div></div>
          <div class="start-item" onclick="toggleStart(); launchApp('Microsoft Edge Web', 'browser', '🌐')"><div class="s-icon">🌐</div><div class="start-title">Edge Web</div></div>
          <div class="start-item" onclick="toggleStart(); launchApp('Task Manager', 'tasks', '📊')"><div class="s-icon">📊</div><div class="start-title">Task Manager</div></div>
          <div class="start-item" onclick="toggleStart(); launchApp('Settings', 'settings', '⚙️')"><div class="s-icon">⚙️</div><div class="start-title">Settings</div></div>
        </div>
      </div>

      <div class="taskbar">
        <div></div> <div class="taskbar-center">
          <button class="start-button" onclick="toggleStart()">🪟</button>
          <div class="running-apps" id="taskbarApps"></div>
        </div>
        <div class="system-tray">
          <div id="clockTime" style="font-weight: 500;">00:00 PM</div>
          <div id="clockDate" style="color: #9ca3af; font-size:10px; margin-top:2px;">01/01/2026</div>
        </div>
      </div>

      <script>
        let windowCount = 0;
        
        function toggleStart() {
          document.getElementById('startMenu').classList.toggle('open');
        }

        function launchApp(name, targetId, glyphIcon) {
          windowCount++;
          const desktop = document.getElementById('desktop');
          const win = document.createElement('div');
          win.className = 'window';
          win.id = 'win-' + windowCount;
          win.style.top = (60 + (windowCount * 25) % 180) + 'px';
          win.style.left = (120 + (windowCount * 30) % 250) + 'px';
          win.style.width = '640px';
          win.style.height = '420px';
          
          win.innerHTML = \`
            <div class="window-header" onmousedown="startDrag(event, '\${win.id}')">
              <div class="window-title"><span>\${glyphIcon}</span> \${name}</div>
              <div class="window-controls">
                <button class="win-btn win-close" onclick="closeWindow('\${win.id}')">✕</button>
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
            const iconGlyph = w.querySelector('.window-title span').textContent;
            const btn = document.createElement('div');
            btn.className = 'active-task';
            btn.textContent = iconGlyph;
            btn.onclick = () => {
              w.style.zIndex = parseInt(w.style.zIndex || 10) + 5;
            };
            tray.appendChild(btn);
          });
        }

        function startDrag(e, winId) {
          if(e.target.className.includes('win-btn')) return;
          const win = document.getElementById(winId);
          
          // Elevate selected window to top visual layer depth on click interaction
          document.querySelectorAll('.window').forEach(x => x.style.zIndex = 10);
          win.style.zIndex = 100;

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

        // Live Windows Clock Synchronization Clock Routine Loop Tasks
        setInterval(() => {
          const d = new Date();
          document.getElementById('clockTime').textContent = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          document.getElementById('clockDate').textContent = d.toLocaleDateString();
        }, 1000);
      </script>
    </body></html>`;
  }
  
  return `<html><head>${windowsStyles}</head><body><h1>404</h1><p>Target Mapped Segment <code>vav://${target}</code> Fault.</p></body></html>`;
}

// =======================================================
// SYSTEM CORE NATIVE WINDOWS APP VIEW INJECTION ROUTERS
// =======================================================
function getOSAppContent(appId) {
  const innerStyle = `
    <style>
      body { background: #0b0f16; color: #f3f4f6; font-family: 'Segoe UI', sans-serif; padding: 16px; margin:0; font-size:13px; }
      h2 { color: #fff; font-size: 15px; margin-top: 0; font-weight: 500; margin-bottom:12px; }
      .row { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 10px; margin-bottom: 6px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
      .input-text { background: rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); color:#fff; padding:6px 12px; border-radius:4px; outline:none; font-size:12px; }
      .btn { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size:12px; transition: background 0.2s; }
      .btn:hover { background: rgba(255,255,255,0.15); }
      textarea { width:100%; height:80px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); color:#fff; padding:8px; border-radius:4px; font-family:monospace; resize:none; }
    </style>
  `;

  // Dynamic Virtual Address Web Explorer View Frame Module
  if (appId === 'browser') {
    return `<html><head>${innerStyle}</head><body style="padding:0; display:flex; flex-direction:column; height:100vh; overflow:hidden;">
      <div style="background:rgba(255,255,255,0.03); padding:8px; display:flex; gap:8px; border-bottom:1px solid rgba(255,255,255,0.08);">
        <input type="text" id="targetUrl" class="input-text" value="https://google.com" style="flex:1;">
        <button class="btn" onclick="browse()">Go</button>
      </div>
      <iframe id="webCanvas" src="https://google.com" style="flex:1; width:100%; border:none; background:#fff;"></iframe>
      <script>
        function browse() {
          let url = document.getElementById('targetUrl').value.trim();
          if(!/^https?:\\/\\//i.test(url)) url = 'https://' + url;
          document.getElementById('webCanvas').src = url;
        }
      </script>
    </body></html>`;
  }

  if (appId === 'files') {
    const disk = JSON.parse(localStorage.getItem(STORAGE.DISK) || '[]');
    let rows = disk.map(f => `
      <div class="row">
        <div>📄 <strong>${f.name}</strong> (${f.content.length} characters)</div>
        <button class="btn" onclick="alert(\`File Matrix Viewer:\\n\\n${f.content.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">Open</button>
      </div>
    `).join('');
    
    return `<html><head>${innerStyle}</head><body>
      <h2>💾 Local Disk Partition Sector C:\\</h2>
      <div style="margin-bottom:12px; font-size:12px; color:#9ca3af;">Create text asset parameters:</div>
      <input type="text" id="fn" class="input-text" placeholder="document.txt" style="width:100%; margin-bottom:6px;">
      <textarea id="fc" placeholder="Input string payload content vectors..."></textarea>
      <button class="btn" style="margin-top:8px; width:100%;" onclick="writeFile()">Write Allocation Table</button>
      <hr style="border-color:rgba(255,255,255,0.1); margin:16px 0;">
      ${rows || '<p>No structured files detected on primary sectors.</p>'}
      
      <script>
        function writeFile() {
          const name = document.getElementById('fn').value.trim();
          const content = document.getElementById('fc').value;
          if(!name) return alert('Error: Filename descriptor is blank.');
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
      <h2>📊 Real-Time Diagnostic Windows Task Manager</h2>
      <div class="row"><div>⚙️ CPU Kernel Processing Pool</div><span style="color:#10b981">1.4% Allocation Active</span></div>
      <div class="row"><div>🧠 System Frame Buffer Heap</div><span>Allocated Stack Normal</span></div>
      <div class="row"><div>📡 Injected Web Extensions</div><span>${extensions.length} Drivers Loaded</span></div>
      <button class="btn" style="width:100%; margin-top:10px; background:#e81123; border:none;" onclick="window.parent.location.reload()">Force Reset OS</button>
    </body></html>`;
  }

  if (appId === 'mall') {
    return `<html><head>${innerStyle}</head><body>
      <h2>🏪 Microsoft Store System Apps Catalog</h2>
      <div class="row">
        <div>🛡️ <strong>Global Security Shield (AdBlock)</strong><br><small style="color:#9ca3af">Filters malicious scripts and telemetry frames.</small></div>
        <button class="btn" onclick="window.parent.installExtension('adblock', 'AdBlock Matrix', 'document.querySelectorAll(\\'#ad, .ads\\').forEach(e => e.remove());')">Get</button>
      </div>
      <div class="row">
        <div>🎨 <strong>Neon Cyan Terminal Theme Pack</strong><br><small style="color:#9ca3af">Overrides document colors to high-contrast blue layouts.</small></div>
        <button class="btn" onclick="window.parent.installExtension('neon', 'Cyan Pack', 'const s=document.createElement(\\'style\\'); s.innerHTML=\\'* { color: #00ffff !important; }\\'; document.head.appendChild(s);')">Get</button>
      </div>
    </body></html>`;
  }

  if (appId === 'settings') {
    return `<html><head>${innerStyle}</head><body>
      <h2>⚙️ System Config Management Dashboard</h2>
      <div class="row"><div>OS Variant Build</div><strong>Windows 11 WebOS Core</strong></div>
      <div class="row"><div>Graphics Driver Stack</div><strong>WebGL Layer Canvas Mapping</strong></div>
      <div class="row"><div>Virtual Memory Status</div><strong>LocalStorage Cache Synced</strong></div>
      <button class="btn" onclick="alert('Diagnostics pass current kernel integrity validations.')">Run Updates System Check</button>
    </body></html>`;
  }

  return `<html><body>No Binary Execution Content Map Specified.</body></html>`;
}

window.getOSAppContent = getOSAppContent;

// =======================================================
// ADAPTED NAVIGATION CORE ROUTINES & LIFECYCLE HOOKS
// =======================================================
function createTab(url='',activate=true){
  if(!url) url = 'vav://os'; // Route primary interface layers straight to custom Windows Desktop canvas
  const id='t'+(nextTabId++);
  const tab={id,url,history:url?[url]:[],i:url?0:-1,title:'Windows Shell Workspace',iframe:null,favicon:''};
  tabs.push(tab);
  if(activate) activateTab(id);
  renderTabs();
}

function renderTabs(){
  if ($('tabs')) $('tabs').innerHTML = ''; // Keep layout clear
}

function activateTab(id){
  activeTabId=id; renderWeb();
}

function getTab(id){return tabs.find(t=>t.id===id);}

function renderWeb(){
  tabs.forEach(t=>{
    if(!t.iframe){
      const ifr = document.createElement('iframe');ifr.className='webview';ifr.dataset.tab=t.id;
      ifr.style.width = '100vw'; ifr.style.height = '100vh'; ifr.style.border = 'none';
      webArea.appendChild(ifr);t.iframe=ifr;
      ifr.addEventListener('load',()=>{
        injectExtensions(ifr);
        if(loading) loading.style.width='0%';
        if(status) status.textContent='Windows Boot Complete';
      });
    }
    t.iframe.style.display=t.id===activeTabId?'block':'none';
    
    if(t.id===activeTabId && t.url){
      if(t.url.startsWith('vav://')) {
        if(t.iframe.dataset.loadedUrl !== t.url) {
          t.iframe.dataset.loadedUrl = t.url;
          t.iframe.removeAttribute('src');
          if(loading) loading.style.width='70%';
          t.iframe.srcdoc = getVavPage(t.url);
        }
      }
    }
  });
}

function nav(raw){
  const t=getTab(activeTabId);if(!t)return;
  let u=raw.trim();if(!u)return;
  t.url=u;
  renderWeb();
}

// System Init Ignition Sequences
createTab('',true);
window.nav = nav;
window.installExtension = installExtension;
