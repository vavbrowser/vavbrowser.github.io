const $ = id => document.getElementById(id);

// OS Persistent Storage Sectors
const STORAGE = { DISK: 'vav_os_disk', EXT: 'mc_ext' };

// --- 1. CORE SANITIZATION: WIPE BROWSER UI CHROME ---
// Dynamically purge tab strips, address inputs, and layout frames from the master document
const domClean targets = ['tabs', 'searchEngine', 'address', 'goBtn', 'bookmarkBtn', 'toggleBookmarks', 'sidePanels'];
targets.forEach(tId => {
  const el = $(tId);
  if (el) el.remove();
});

// Force the master container to full-viewport size and scrub its structure
if ($('webviewArea')) {
  $('webviewArea').style.width = '100vw';
  $('webviewArea').style.height = '100vh';
  $('webviewArea').style.padding = '0';
  $('webviewArea').style.margin = '0';
  $('webviewArea').style.background = '#000';
  $('webviewArea').innerHTML = ''; // Detach old browser frame wrappers
}

// Initialize Persistent Virtual File Allocation Table
if (!localStorage.getItem(STORAGE.DISK)) {
  const freshInstallationDisk = [
    { name: 'desktop_readme.txt', content: 'Welcome to your standalone VavWindows WebOS environment!\n\nThe browser navigation tabs have been detached. All tools run inside this integrated multitasking layout.' },
    { name: 'system_reg.json', content: '{ "build_rev": 1042, "ui_mode": "chromeless_os", "filesystem": "localstorage_v1" }' }
  ];
  localStorage.setItem(STORAGE.DISK, JSON.stringify(freshInstallationDisk));
}

let activeExtensions = JSON.parse(localStorage.getItem(STORAGE.EXT) || '[]');

// =======================================================
// SYSTEM CORE MAPPING: GENERATE TRUE SYSTEM DESKTOP
// =======================================================
function bootSystemOS() {
  const webArea = $('webviewArea');
  if (!webArea) return;

  // Build the master OS operational environment frame
  const osIframe = document.createElement('iframe');
  osIframe.style.width = '100%';
  osIframe.style.height = '100%';
  osIframe.style.border = 'none';
  webArea.appendChild(osIframe);

  const windowsAesthetics = `
    <style>
      * { box-sizing: border-box; }
      body { 
        background: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920') no-repeat center center fixed; 
        background-size: cover;
        color: #fff; 
        font-family: 'Segoe UI', system-ui, sans-serif; 
        margin: 0; padding: 0; 
        height: 100vh; 
        overflow: hidden; 
        display: flex; 
        flex-direction: column; 
      }
      
      /* Desktop Workspace Grid */
      .workspace { flex: 1; position: relative; padding: 20px; display: grid; grid-template-columns: repeat(auto-fill, 90px); grid-template-rows: repeat(auto-fill, 100px); grid-auto-flow: column; gap: 15px; align-content: flex-start; }
      .desktop-icon { display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 8px; border-radius: 6px; border: 1px solid transparent; transition: all 0.1s; user-select: none; }
      .desktop-icon:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); }
      .desktop-icon .glyph { font-size: 34px; margin-bottom: 6px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
      .desktop-icon .title { font-size: 11px; text-shadow: 0 1px 3px rgba(0,0,0,0.9); color: #f9fafb; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
      
      /* Multitasking Functional Window Frame */
      .os-window { position: absolute; min-width: 350px; min-height: 250px; background: rgba(24, 28, 36, 0.88); backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; box-shadow: 0 20px 50px rgba(0,0,0,0.55); display: flex; flex-direction: column; overflow: hidden; z-index: 10; }
      .window-bar { background: rgba(32, 38, 52, 0.4); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .window-caption { font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
      .window-actions { display: flex; gap: 4px; }
      .action-btn { width: 28px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; cursor: pointer; border: none; background: transparent; color: #fff; border-radius: 4px; transition: background 0.15s; margin-top: -6px; margin-right: -10px; }
      .action-btn:hover { background: rgba(255,255,255,0.1); }
      .close-btn:hover { background: #e81123 !important; }
      .window-viewport { flex: 1; padding: 0; overflow: auto; background: #0b0d13; }
      
      /* Taskbar Architecture (Windows 11 Centered Array) */
      .taskbar { height: 48px; background: rgba(20, 24, 33, 0.8); backdrop-filter: blur(20px); border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; padding: 0 16px; justify-content: space-between; z-index: 99999; }
      .taskbar-center-tray { position: absolute; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; align-items: center; }
      .windows-start { background: transparent; border: none; font-size: 24px; cursor: pointer; border-radius: 4px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
      .windows-start:hover { background: rgba(255,255,255,0.1); }
      .active-apps-dock { display: flex; gap: 6px; }
      .dock-tile { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.05); border-radius: 4px; font-size: 20px; cursor: pointer; position: relative; transition: all 0.2s; }
      .dock-tile:hover { background: rgba(255,255,255,0.14); }
      .dock-tile.focused::after { content: ''; position: absolute; bottom: 3px; left: 20%; width: 60%; height: 3px; background: #00bcd4; border-radius: 2px; }
      .tray-clock { font-size: 11px; text-align: right; color: #e5e7eb; user-select: none; }
      
      /* Windows Start Panel Layout Matrix */
      .start-flyout { position: absolute; bottom: 58px; left: 50%; transform: translateX(-50%) translateY(120px); width: 480px; height: 520px; background: rgba(18, 22, 30, 0.92); backdrop-filter: blur(35px); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; box-shadow: 0 25px 60px rgba(0,0,0,0.7); z-index: 100000; display: none; opacity: 0; transition: all 0.2s cubic-bezier(0.05, 0.7, 0.1, 1); padding: 24px; }
      .start-flyout.active { display: block; opacity: 1; transform: translateX(-50%) translateY(0); }
      .start-menu-apps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 20px; }
      .app-tile { display: flex; flex-direction: column; align-items: center; text-align: center; cursor: pointer; padding: 12px; border-radius: 6px; transition: background 0.15s; }
      .app-tile:hover { background: rgba(255,255,255,0.06); }
      .app-tile .t-glyph { font-size: 28px; margin-bottom: 6px; }
      .app-tile .t-name { font-size: 12px; color: #e5e7eb; }
    </style>
  `;

  osIframe.srcdoc = `
    <html>
    <head>${windowsAesthetics}</head>
    <body>
      
      <div class="workspace" id="workspace" onclick="dismissStartMenu(event)">
        <div class="desktop-icon" onclick="launchOSApp('This PC', 'files', '💻')"><div class="glyph">💻</div><div class="title">This PC</div></div>
        <div class="desktop-icon" onclick="launchOSApp('Edge Browser', 'browser', '🌐')"><div class="glyph">🌐</div><div class="title">Web Browser</div></div>
        <div class="desktop-icon" onclick="launchOSApp('Task Manager', 'tasks', '📊')"><div class="glyph">📊</div><div class="title">Task Manager</div></div>
        <div class="desktop-icon" onclick="launchOSApp('Vav Store', 'mall', '🏪')"><div class="glyph">🏪</div><div class="title">Vav Store</div></div>
        <div class="desktop-icon" onclick="launchOSApp('Settings Panel', 'settings', '⚙️')"><div class="glyph">⚙️</div><div class="title">Settings</div></div>
      </div>

      <div class="start-flyout" id="startPanel">
        <input type="text" placeholder="Search for apps, settings, and files..." style="width:100%; padding:10px 14px; background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.1); border-radius:6px; color:#fff; font-size:12px; outline:none;">
        <h5 style="margin: 20px 0 10px 0; font-weight:400; color:#9ca3af; font-size:11px; uppercase; letter-spacing:0.5px;">Pinned Applications</h5>
        <div class="start-menu-apps">
          <div class="app-tile" onclick="toggleStart(); launchOSApp('This PC', 'files', '💻')"><div class="t-glyph">💻</div><div class="t-name">File System</div></div>
          <div class="app-tile" onclick="toggleStart(); launchOSApp('Edge Browser', 'browser', '🌐')"><div class="t-glyph">🌐</div><div class="t-name">Web Browser</div></div>
          <div class="app-tile" onclick="toggleStart(); launchOSApp('Task Manager', 'tasks', '📊')"><div class="t-glyph">📊</div><div class="t-name">Diagnostics</div></div>
          <div class="app-tile" onclick="toggleStart(); launchOSApp('Settings Panel', 'settings', '⚙️')"><div class="t-glyph">⚙️</div><div class="t-name">Settings</div></div>
        </div>
      </div>

      <div class="taskbar">
        <div></div> <div class="taskbar-center-tray">
          <button class="windows-start" onclick="toggleStart()">🪟</button>
          <div class="active-apps-dock" id="dockContainer"></div>
        </div>
        <div class="tray-clock">
          <div id="timeVal" style="font-weight: 500;">00:00 PM</div>
          <div id="dateVal" style="color:#9ca3af; font-size:10px; margin-top:1px;">01/01/2026</div>
        </div>
      </div>

      <script>
        let runningProcessCount = 0;
        let runningAppsRegistry = {};

        function toggleStart() {
          document.getElementById('startPanel').classList.toggle('active');
        }
        
        function dismissStartMenu(e) {
          if (e.target.id === 'workspace') {
            document.getElementById('startPanel').classList.remove('active');
          }
        }

        function launchOSApp(name, appId, structuralGlyph) {
          runningProcessCount++;
          const processId = 'p-' + runningProcessCount;
          const workspace = document.getElementById('workspace');
          
          const targetWindow = document.createElement('div');
          targetWindow.className = 'os-window';
          targetWindow.id = processId;
          targetWindow.style.top = (50 + (runningProcessCount * 25) % 180) + 'px';
          targetWindow.style.left = (100 + (runningProcessCount * 30) % 250) + 'px';
          targetWindow.style.width = '620px';
          targetWindow.style.height = '400px';
          
          targetWindow.innerHTML = \`
            <div class="window-bar" onmousedown="focusAndDragWindow(event, '\${processId}')">
              <div class="window-caption">\${structuralGlyph} \${name}</div>
              <div class="window-actions">
                <button class="action-btn close-btn" onclick="terminateProcess('\${processId}')">✕</button>
              </div>
            </div>
            <div class="window-viewport">
              <iframe srcdoc="\${window.parent.getAppContentPayload(appId)}" style="width:100%; height:100%; border:none; background:transparent;"></iframe>
            </div>
          \`;
          
          workspace.appendChild(targetWindow);
          runningAppsRegistry[processId] = { name, glyph: structuralGlyph };
          
          focusTargetLayer(processId);
          rebuildTaskbarDock();
        }

        function terminateProcess(pId) {
          const winNode = document.getElementById(pId);
          if (winNode) winNode.remove();
          delete runningAppsRegistry[pId];
          rebuildTaskbarDock();
        }

        function focusTargetLayer(pId) {
          document.querySelectorAll('.os-window').forEach(w => w.style.zIndex = 10);
          const activeWin = document.getElementById(pId);
          if (activeWin) activeWin.style.zIndex = 100;
          
          // Sync visually focused attributes down to running taskbar apps
          document.querySelectorAll('.dock-tile').forEach(tile => {
            tile.classList.toggle('focused', tile.dataset.process === pId);
          });
        }

        function rebuildTaskbarDock() {
          const dock = document.getElementById('dockContainer');
          dock.innerHTML = '';
          
          Object.keys(runningAppsRegistry).forEach(pId => {
            const meta = runningAppsRegistry[pId];
            const tile = document.createElement('div');
            tile.className = 'dock-tile';
            tile.dataset.process = pId;
            tile.textContent = meta.glyph;
            tile.title = meta.name;
            tile.onclick = () => focusTargetLayer(pId);
            dock.appendChild(tile);
          });
        }

        function focusAndDragWindow(e, pId) {
          if (e.target.className.includes('action-btn')) return;
          const win = document.getElementById(pId);
          focusTargetLayer(pId);

          let initialX = e.clientX, initialY = e.clientY;
          
          function onMouseMove(moveEvent) {
            const dx = moveEvent.clientX - initialX;
            const dy = moveEvent.clientY - initialY;
            initialX = moveEvent.clientX;
            initialY = moveEvent.clientY;
            win.style.top = (win.offsetTop + dy) + "px";
            win.style.left = (win.offsetLeft + dx) + "px";
          }
          
          function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          }
          
          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }

        // Live Clock Service Synchronizer Loop Thread
        setInterval(() => {
          const time = new Date();
          document.getElementById('timeVal').textContent = time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          document.getElementById('dateVal').textContent = time.toLocaleDateString();
        }, 1000);
      </script>
    </body>
    </html>
  `;
}

// =======================================================
// CORE OPERATING SYSTEM APP FILE SYSTEM & RUNTIMES
// =======================================================
function getAppContentPayload(appId) {
  const commonFrameCSS = `
    <style>
      body { background: #0c0e14; color: #e5e7eb; font-family: 'Segoe UI', system-ui, sans-serif; padding: 16px; margin: 0; font-size: 13px; }
      h3 { color: #fff; margin-top: 0; font-weight: 500; font-size: 15px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
      .sys-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); padding: 12px; margin-bottom: 8px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
      .txt-field { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 6px 12px; border-radius: 4px; outline: none; font-size: 12px; }
      .os-btn { background: rgba(255,255,255,0.07); color: #fff; border: 1px solid rgba(255,255,255,0.1); padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.2s; }
      .os-btn:hover { background: rgba(255,255,255,0.14); }
      textarea { width: 100%; height: 90px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.12); color: #fff; padding: 8px; border-radius: 4px; font-family: monospace; resize: none; margin-top: 4px; }
    </style>
  `;

  if (appId === 'browser') {
    return `<html><head>${commonFrameCSS}</head><body style="padding:0; display:flex; flex-direction:column; height:100vh; overflow:hidden;">
      <div style="background: rgba(255,255,255,0.02); padding: 8px; display: flex; gap: 6px; border-bottom: 1px solid rgba(255,255,255,0.08);">
        <input type="text" id="targetNavUrl" class="txt-field" value="https://google.com" style="flex:1;">
        <button class="os-btn" onclick="navigateFrame()">Browse</button>
      </div>
      <iframe id="viewportCanvas" src="https://google.com" style="flex:1; width:100%; border:none; background:#fff;"></iframe>
      <script>
        function navigateFrame() {
          let address = document.getElementById('targetNavUrl').value.trim();
          if(!/^https?:\\/\\//i.test(address)) address = 'https://' + address;
          document.getElementById('viewportCanvas').src = address;
        }
      </script>
    </body></html>`;
  }

  if (appId === 'files') {
    const disk = JSON.parse(localStorage.getItem(STORAGE.DISK) || '[]');
    let itemsMarkup = disk.map(f => `
      <div class="sys-card">
        <div>📄 <strong>${f.name}</strong> (${f.content.length} characters)</div>
        <button class="os-btn" onclick="alert(\`File Allocation View [${f.name}]:\\n\\n${f.content.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">Read</button>
      </div>
    `).join('');

    return `<html><head>${commonFrameCSS}</head><body>
      <h3>📁 Virtual Local Storage Workspace System Partition (C:\\)</h3>
      <div style="margin-bottom:8px; font-size:12px; color:#9ca3af;">Commit custom resource vectors to system sectors:</div>
      <input type="text" id="fileName" class="txt-field" placeholder="log_dump.txt" style="width:100%; margin-bottom:6px;">
      <textarea id="filePayload" placeholder="Write plain text characters configuration vectors here..."></textarea>
      <button class="os-btn" style="margin-top:6px; width:100%;" onclick="commitToDisk()">Execute Write Block Task</button>
      <hr style="border-color:rgba(255,255,255,0.08); margin:14px 0;">
      ${itemsMarkup || '<p style="color:#9ca3af;">Local directory partition sectors are clear.</p>'}
      
      <script>
        function commitToDisk() {
          const name = document.getElementById('fileName').value.trim();
          const content = document.getElementById('filePayload').value;
          if(!name) return alert('Operation Aborted: File descriptor token missing.');
          let partition = JSON.parse(localStorage.getItem('${STORAGE.DISK}') || '[]');
          partition.push({name, content});
          localStorage.setItem('${STORAGE.DISK}', JSON.stringify(partition));
          location.reload();
        }
      </script>
    </body></html>`;
  }

  if (appId === 'tasks') {
    return `<html><head>${commonFrameCSS}</head><body>
      <h3>📊 Diagnostic System Task Architecture Monitor</h3>
      <div class="sys-card"><div>💻 Virtual Kernel Engine Runtime</div><span style="color:#10b981">OPERATIONAL NORMAL</span></div>
      <div class="sys-card"><div>🗄️ Local Disk Allocation Records</div><span>${localStorage.length} Partition Keys Loaded</span></div>
      <div class="sys-card"><div>🛡️ System Background Daemons</div><span>Active Hardware Hooks Guard Verified</span></div>
      <button class="os-btn" style="width:100%; margin-top:14px; background:#e81123; border:none;" onclick="window.parent.location.reload()">Force Restart Kernel Layer</button>
    </body></html>`;
  }

  if (appId === 'mall') {
    return `<html><head>${commonFrameCSS}</head><body>
      <h3>🏪 Vav Store System Core Application Repository</h3>
      <p style="color:#9ca3af; margin-top:0;">Download dynamic modules straight into running operating states:</p>
      <div class="sys-card">
        <div>🛡️ <strong>AdBlock Engine Core Hook</strong><br><small style="color:#9ca3af">Sifting layout nodes to isolate running frame telemetry elements.</small></div>
        <button class="os-btn" onclick="alert('Module verified. Drivers loaded.')">Install</button>
      </div>
      <div class="sys-card">
        <div>🎨 <strong>Cyberpunk Terminal Color Matrix</strong><br><small style="color:#9ca3af">Forces systemic color arrays down into visual workspace vectors.</small></div>
        <button class="os-btn" onclick="alert('Interface package active.')">Install</button>
      </div>
    </body></html>`;
  }

  if (appId === 'settings') {
    return `<html><head>${commonFrameCSS}</head><body>
      <h3>⚙️ Operational Environment System Properties</h3>
      <div class="sys-card"><div>Product Name</div><strong>VavWindows Standalone Core Edition</strong></div>
      <div class="sys-card"><div>Kernel Thread Pipeline</div><strong>Isolated Browser Tab Container Interface</strong></div>
      <div class="sys-card"><div>Memory Map Allocation</div><strong>Synchronous Base64 Storage Cluster</strong></div>
      <button class="os-btn" onclick="alert('Telemetry channels reporting stable operation.')">Run Framework Diagnostics</button>
    </body></html>`;
  }

  return `<html><body>System Binary Module Address Reference Error.</body></html>`;
}

// Bind sub-application router interfaces back to parent engine global scope
window.getAppContentPayload = getAppContentPayload;

// Execute desktop system bootstrap sequences immediately
bootSystemOS();
