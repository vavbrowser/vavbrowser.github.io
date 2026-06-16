const $=id=>document.getElementById(id);
let tabs=[],activeTabId=null,nextTabId=1;
const STORAGE={BOOK:'mc_bmk',HIST:'mc_hist'};
const searchSel=$('searchEngine'), addr=$('address'), status=$('status'), webArea=$('webviewArea'), loading=$('loadingBar');
const bookmarksEl=$('bookmarksList'), historyEl=$('historyList'), addrFav=$('addrFavicon');

const SCRIPT_VERSION = "4.1"; // Updated build iteration version number
let osEnabled = localStorage.getItem('vav_os_mode') === 'true';

// Create a built-in UI layer engine for internal system pages
const internalPage = document.createElement('div');
internalPage.id = 'internalPage';
internalPage.style.cssText = 'position:absolute; inset:0; background:var(--bg); padding:40px 30px; display:none; z-index:10; overflow:auto; box-sizing:border-box;';
webArea.appendChild(internalPage);

function faviconFor(url){
  try{
    if(url.toLowerCase().startsWith('vav://')) return "";
    let u=new URL(url); return "https://www.google.com/s2/favicons?sz=32&domain_url="+u.origin;
  }catch(e){return "";}
}

function createTab(url='',activate=true){
  const id='t'+(nextTabId++);
  const tab={id,url,history:url?[url]:[],i:url?0:-1,title:url.toLowerCase().startsWith('vav://')?url:'New Tab',iframe:null,favicon:''};
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
  const t=getTab(id);addr.value=t.url||'';addrFav.src=t.favicon||'';
}

function getTab(id){return tabs.find(t=>t.id===id);}

function closeTab(id){
  const i=tabs.findIndex(x=>x.id===id);
  if(i<0)return;
  if(tabs[i].iframe)tabs[i].iframe.remove();
  tabs.splice(i,1);
  activeTabId=tabs.length?tabs[Math.max(0,i-1)].id:null;
  renderTabs();renderWeb();
}

function renderWeb(){
  const activeTab = getTab(activeTabId);
  if(activeTab && activeTab.url && activeTab.url.toLowerCase().startsWith('vav://')){
    internalPage.style.display = 'block';
    renderInternalPage(activeTab.url);
  } else {
    internalPage.style.display = 'none';
  }

  tabs.forEach(t=>{
    if(!t.iframe){
      const ifr=document.createElement('iframe');ifr.className='webview';ifr.dataset.tab=t.id;webArea.appendChild(ifr);t.iframe=ifr;
      ifr.addEventListener('load',()=>{
        if(t.url && t.url.toLowerCase().startsWith('vav://')) return;
        t.title=t.url||'New Tab';t.favicon=faviconFor(t.url);
        renderTabs();if(t.id===activeTabId)addrFav.src=t.favicon;
        loading.style.width='0%';status.textContent='Loaded';
      });
    }
    t.iframe.style.display=(t.id===activeTabId && !t.url.toLowerCase().startsWith('vav://'))?'block':'none';
    if(t.id===activeTabId && t.url && !t.url.toLowerCase().startsWith('vav://') && t.iframe.src!==t.url){
      loading.style.width='70%';status.textContent='Loading...';
      t.iframe.src=t.url;
    }
  });
}

function nav(raw){
  const t=getTab(activeTabId);if(!t)return;
  let u=raw.trim();if(!u)return;
  
  const isInternal = u.toLowerCase().startsWith('vav://');
  if(!isInternal){
    if(/\s/.test(u)||!u.includes('.'))u=searchSel.value+encodeURIComponent(u);
    else if(!/^https?:\/\//.test(u))u='https://'+u;
  }
  
  t.history=t.history.slice(0,t.i+1);t.history.push(u);t.i++;
  t.url=u;addr.value=u;
  
  if(isInternal){
    t.title=u;t.favicon='';addrFav.src='';
    loading.style.width='0%';status.textContent='Ready';
    renderTabs();renderWeb();
  } else {
    t.favicon=faviconFor(u);addrFav.src=t.favicon;
    loading.style.width='40%';status.textContent='Loading...';
    renderWeb();pushHist(u);
  }
}

// Built-in render processing engine for native browser panels
function renderInternalPage(url) {
  const target = url.trim().toLowerCase();
  if (target === 'vav://settings') {
    internalPage.innerHTML = `
      <h2 style="color:var(--accent); margin-top:0;">System Settings</h2>
      <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:20px 0;">
      
      <div style="margin-bottom:25px; background:rgba(255,255,255,0.03); padding:15px; border-radius:8px;">
        <h3 style="margin-top:0; margin-bottom:5px; color:#fff; display:flex; align-items:center; gap:8px;">
          <span class="material-symbols-outlined" style="color:var(--accent)">desktop_windows</span> VAV OS Environment Mode
        </h3>
        <p style="color:var(--muted); font-size:14px; margin-top:0;">Transform this browser architecture structure into a complete desktop-driven environment layer modeled after Chrome OS.</p>
        <button id="osToggleBtn" style="border:none; color:#fff; padding:8px 16px; border-radius:6px; background:${osEnabled ? '#ef5350' : '#4caf50'}; cursor:pointer; font-weight:600;" onclick="window.toggleOSMode()">
          ${osEnabled ? 'Deactivate OS Layer' : 'Activate OS Environment'}
        </button>
      </div>

      <div style="margin-bottom:25px;">
        <h3 style="margin-bottom:5px;">Release Channel Deployment</h3>
        <p style="color:var(--muted); font-size:14px; margin-top:0;">Toggle software development compilation instances.</p>
        <button style="border:none; color:#fff; padding:8px 16px; border-radius:6px; background:var(--active-tab); cursor:pointer; font-weight:600;" onclick="window.location.search = window.location.search.includes('mode=beta') ? '' : '?mode=beta';">
          Switch System Channel
        </button>
      </div>
      <div>
        <h3>Build Diagnostics</h3>
        <p style="color:var(--muted); font-size:14px; margin:5px 0;">Script Registry: <strong style="color:#fff;">v${SCRIPT_VERSION}</strong></p>
        <p style="color:var(--muted); font-size:14px; margin:5px 0;">Runtime Branch: <strong style="color:#fff;">${window.location.search.includes('mode=beta') ? 'Beta Testing' : 'Stable Production'}</strong></p>
      </div>`;
  } else if (target === 'vav://history') {
    const historyHTML = historyEl?.innerHTML || '<p style="color:var(--muted);">No cached history instances detected.</p>';
    internalPage.innerHTML = `
      <h2 style="color:var(--accent); margin-top:0;">Global History Ledger</h2>
      <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:20px 0;">
      <div style="display:flex; flex-direction:column; gap:10px;">${historyHTML}</div>`;
  } else if (target === 'vav://bookmarks') {
    const bookmarksHTML = bookmarksEl?.innerHTML || '<p style="color:var(--muted);">No stored bookmarks references available.</p>';
    internalPage.innerHTML = `
      <h2 style="color:var(--accent); margin-top:0;">Directory Bookmarks</h2>
      <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:20px 0;">
      <div style="display:flex; flex-direction:column; gap:10px;">${bookmarksHTML}</div>`;
  } else if (target === 'vav://vav-urls') {
    internalPage.innerHTML = `
      <h2 style="color:var(--accent); margin-top:0;">Internal Command Directories</h2>
      <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:20px 0;">
      <p style="color:var(--muted); margin-bottom:20px;">Direct system indexing loops available inside this build layer:</p>
      <ul style="list-style:none; padding:0; display:flex; flex-direction:column; gap:14px;">
        <li><a href="#" style="color:var(--accent); text-decoration:none; font-weight:600; font-size:16px;" onclick="window.navInternal('vav://settings')">vav://settings</a> — System parameters</li>
        <li><a href="#" style="color:var(--accent); text-decoration:none; font-weight:600; font-size:16px;" onclick="window.navInternal('vav://history')">vav://history</a> — Full indexed session logs</li>
        <li><a href="#" style="color:var(--accent); text-decoration:none; font-weight:600; font-size:16px;" onclick="window.navInternal('vav://bookmarks')">vav://bookmarks</a> — Stored directory indices</li>
        <li><a href="#" style="color:var(--accent); text-decoration:none; font-weight:600; font-size:16px;" onclick="window.navInternal('vav://vav-urls')">vav://vav-urls</a> — Index reference mapping</li>
      </ul>`;
  } else {
    internalPage.innerHTML = `
      <h2 style="color:#ff5555; margin-top:0;">Address Verification Fault</h2>
      <p style="color:var(--muted);">The internal instruction link <strong>${url}</strong> does not exist.</p>
      <a href="#" style="color:var(--accent); text-decoration:none; font-weight:600;" onclick="window.navInternal('vav://vav-urls')">Return to index core →</a>`;
  }
}
window.navInternal = function(url) { nav(url); };

function pushHist(u){const h=JSON.parse(localStorage.getItem(STORAGE.HIST)||'[]');h.unshift({u,ts:Date.now()});localStorage.setItem(STORAGE.HIST,JSON.stringify(h.slice(0,100)));renderPanels();}
function addBmk(u){const b=JSON.parse(localStorage.getItem(STORAGE.BOOK)||'[]');if(!b.find(x=>x.u===u)){b.unshift({u,ts:Date.now()});localStorage.setItem(STORAGE.BOOK,JSON.stringify(b));renderPanels();}}

function renderPanels(){
  bookmarksEl.innerHTML='';JSON.parse(localStorage.getItem(STORAGE.BOOK)||'[]').forEach(x=>{
    const d=document.createElement('div');d.className='card';d.innerHTML=`<div>${x.u}</div><small>★</small>`;d.onclick=()=>createTab(x.u,true);bookmarksEl.appendChild(d);
  });
  historyEl.innerHTML='';JSON.parse(localStorage.getItem(STORAGE.HIST)||'[]').forEach(x=>{
    const d=document.createElement('div');d.className='card';d.innerHTML=`<div>${x.u}</div><small>${new Date(x.ts).toLocaleTimeString()}</small>`;d.onclick=()=>createTab(x.u,true);historyEl.appendChild(d);
  });
}

$('goBtn').onclick=()=>nav(addr.value);addr.onkeydown=e=>{if(e.key==='Enter')nav(addr.value);}
$('reload').onclick=()=>{const t=getTab(activeTabId);if(t){ if(t.url.toLowerCase().startsWith('vav://')) renderWeb(); else t.iframe.src=t.url; }}
$('home').onclick=()=>nav('https://example.com');
$('bookmarkBtn').onclick=()=>{const t=getTab(activeTabId);if(t&&t.url&&!t.url.toLowerCase().startsWith('vav://'))addBmk(t.url);}
$('toggleBookmarks').onclick=()=>{$('sidePanels').style.display=$('sidePanels').style.display==='none'?'block':'none';}
$('back').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i>0){t.i--;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}
$('forward').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i<t.history.length-1){t.i++;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}

createTab('',true);renderPanels();


// --- ALL-IN-ONE JS SPEECH TO TEXT (MATERIAL SYMBOLS EDITION) ---
(function() {
  const addressInput = document.getElementById('address');
  const goBtn = document.getElementById('goBtn');
  const statusEl = document.getElementById('status');

  if (!addressInput) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=mic';
  document.head.appendChild(link);

  const micBtn = document.createElement('span');
  micBtn.id = 'micBtn';
  micBtn.className = 'material-symbols-outlined';
  micBtn.innerText = 'mic';
  micBtn.title = 'Search with your voice';
  
  micBtn.style.cursor = 'pointer';
  micBtn.style.padding = '0 6px';
  micBtn.style.opacity = '0.6';
  micBtn.style.fontSize = '22px';
  micBtn.style.transition = 'opacity 0.18s, transform 0.18s, color 0.18s';
  micBtn.style.userSelect = 'none';
  micBtn.style.display = 'inline-flex';
  micBtn.style.alignItems = 'center';

  micBtn.addEventListener('mouseenter', () => { 
    micBtn.style.opacity = '1'; 
    micBtn.style.transform = 'scale(1.08)'; 
  });
  micBtn.addEventListener('mouseleave', () => { 
    micBtn.style.opacity = '0.6'; 
    micBtn.style.transform = 'scale(1)'; 
  });

  addressInput.parentNode.insertBefore(micBtn, addressInput.nextSibling);

  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let isListening = false;

    micBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    recognition.onstart = () => {
      isListening = true;
      micBtn.style.color = '#ef5350';
      micBtn.style.opacity = '1';
      addressInput.value = '';
      addressInput.placeholder = 'Listening...';
      if (statusEl) statusEl.textContent = "Listening to voice input...";
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.style.color = '';
      micBtn.style.opacity = '0.6';
      addressInput.placeholder = 'Search or type URL';
    };

    recognition.onresult = (event) => {
      const voiceResult = event.results[0][0].transcript;
      addressInput.value = voiceResult;
      if (statusEl) statusEl.textContent = "Searching for: " + voiceResult;
      
      setTimeout(() => {
        if (goBtn) goBtn.click();
      }, 500);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error: ", event.error);
      if (statusEl) statusEl.textContent = "Voice Search Error: " + event.error;
    };

  } else {
    micBtn.style.display = 'none';
  }
})();


// --- EXTENSION PARADIGM: CHROME OS ARCHITECTURE ENGINE ---
window.toggleOSMode = function() {
  osEnabled = !osEnabled;
  localStorage.setItem('vav_os_mode', osEnabled);
  window.location.reload(); 
};

if (osEnabled) {
  (function() {
    // 1. Dynamic Sheet Compiling for Hardware Accelerated Desktop Objects
    const osStyle = document.createElement('style');
    osStyle.innerHTML = `
      body {
        background: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920') no-repeat center center fixed !important;
        background-size: cover !important;
      }
      #browserWindow {
        position: fixed; top: 30px; left: 30px; right: 30px; bottom: 75px;
        background: var(--bg); border-radius: 12px;
        box-shadow: 0 15px 45px rgba(0,0,0,0.7);
        display: flex; flex-direction: column; overflow: hidden;
        z-index: 500; border: 1px solid rgba(255,255,255,0.08);
        transition: transform 0.25s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.2s ease;
      }
      #browserWindow.minimized {
        transform: scale(0.85) translateY(100px); opacity: 0; pointer-events: none;
      }
      .os-window-controls {
        position: absolute; right: 16px; top: 12px; display: flex; gap: 8px; z-index: 99999;
      }
      .os-win-btn {
        width: 13px; height: 13px; border-radius: 50%; border: none; cursor: pointer; transition: opacity 0.15s;
      }
      .os-win-btn:hover { opacity: 0.8; }
      .os-win-min { background: #ffbd44; }
      .os-win-close { background: #ff5c5c; }
      
      #osShelf {
        position: fixed; bottom: 0; left: 0; right: 0; height: 50px;
        background: rgba(20, 24, 33, 0.8); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
        z-index: 100000; display: flex; align-items: center; justify-content: space-between;
        padding: 0 20px; box-shadow: 0 -4px 20px rgba(0,0,0,0.4); user-select: none;
      }
      .shelf-left { display: flex; align-items: center; gap: 14px; }
      .shelf-right { display: flex; align-items: center; gap: 16px; color: #fff; font-size: 13px; font-weight: 500; }
      .shelf-icon {
        width: 36px; height: 36px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
        cursor: pointer; transition: background 0.2s, transform 0.1s; background: rgba(255,255,255,0.03);
        color: #fff; font-size: 20px;
      }
      .shelf-icon:hover { background: rgba(255,255,255,0.12); transform: scale(1.06); }
      .shelf-icon:active { transform: scale(0.95); }
      .shelf-icon.active-app { border-bottom: 3px solid var(--accent); border-radius: 50% 50% 0 0; background: rgba(255,255,255,0.08); }
      
      #osLauncher {
        position: fixed; bottom: 65px; left: 15px; width: 340px;
        background: rgba(24, 28, 36, 0.9); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; z-index: 100001;
        display: none; padding: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); animation: osPopup 0.22s ease-out;
      }
      @keyframes osPopup { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .launcher-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center; }
      .launcher-item {
        display: flex; flex-direction: column; align-items: center; gap: 8px;
        cursor: pointer; padding: 12px; border-radius: 12px; transition: background 0.2s; color: #fff; text-decoration: none; font-size: 13px;
      }
      .launcher-item:hover { background: rgba(255,255,255,0.08); }
      .launcher-item .material-symbols-outlined { font-size: 32px; }
    `;
    document.head.appendChild(osStyle);

    // 2. Structurally warp the Native Window layers on DOM Complete
    window.addEventListener('DOMContentLoaded', () => {
      // Pull and construct global link references to material sheet utilities
      if (!document.querySelector("link[href*='Material+Symbols']")) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
        document.head.appendChild(link);
      }

      const win = document.createElement('div');
      win.id = 'browserWindow';
      
      const tabGroup = $('tabs');
      const toolBar = document.querySelector('.toolbar');
      const coreContent = document.querySelector('.content');

      if (tabGroup) win.appendChild(tabGroup);
      if (toolBar) win.appendChild(toolBar);
      if (coreContent) win.appendChild(coreContent);

      document.body.appendChild(win);

      // Append hardware control clusters
      const controls = document.createElement('div');
      controls.className = 'os-window-controls';
      controls.innerHTML = `
        <button class="os-win-btn os-win-min" title="Minimize Window" onclick="window.osToggleWin()"></button>
        <button class="os-win-btn os-win-close" title="Exit OS System Mode" onclick="window.toggleOSMode()"></button>
      `;
      win.appendChild(controls);

      // Build desktop shelf dashboards
      const shelf = document.createElement('div');
      shelf.id = 'osShelf';
      shelf.innerHTML = `
        <div class="shelf-left">
          <div class="shelf-icon material-symbols-outlined" id="shelfLauncher">apps</div>
          <div class="shelf-icon material-symbols-outlined active-app" id="shelfBrowser">language</div>
          <div class="shelf-icon material-symbols-outlined" id="shelfSettings">settings</div>
        </div>
        <div class="shelf-right">
          <span class="material-symbols-outlined" style="font-size:18px;">wifi</span>
          <span class="material-symbols-outlined" style="font-size:18px;">battery_full</span>
          <span id="osClock">--:-- --</span>
        </div>
      `;
      document.body.appendChild(shelf);

      // Create the System App Launcher Menu Drawer
      const launcher = document.createElement('div');
      launcher.id = 'osLauncher';
      launcher.innerHTML = `
        <h4 style="margin-top:0; color:var(--muted); font-size:12px; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:15px;">Device Applications</h4>
        <div class="launcher-grid">
          <div class="launcher-item" onclick="window.osLaunchApp('browser')">
            <span class="material-symbols-outlined" style="color:var(--accent);">language</span>
            <div>Browser</div>
          </div>
          <div class="launcher-item" onclick="window.osLaunchApp('settings')">
            <span class="material-symbols-outlined" style="color:#a0aec0;">settings</span>
            <div>Settings</div>
          </div>
          <div class="launcher-item" onclick="window.osLaunchApp('youtube')">
            <span class="material-symbols-outlined" style="color:#ff5555;">smart_display</span>
            <div>YouTube</div>
          </div>
        </div>
      `;
      document.body.appendChild(launcher);

      // Application control mappings
      $('shelfLauncher').onclick = (e) => {
        e.stopPropagation();
        launcher.style.display = launcher.style.display === 'block' ? 'none' : 'block';
      };
      $('shelfBrowser').onclick = () => window.osToggleWin();
      $('shelfSettings').onclick = () => window.osLaunchApp('settings');

      document.addEventListener('click', () => { launcher.style.display = 'none'; });
      launcher.onclick = (e) => e.stopPropagation();

      // Dedicated Operating System Clock Task loop
      function runClock() {
        const d = new Date();
        let h = d.getHours();
        let m = d.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12; h = h ? h : 12;
        m = m < 10 ? '0' + m : m;
        const clockEl = document.getElementById('osClock');
        if (clockEl) clockEl.textContent = `${h}:${m} ${ampm}`;
      }
      setInterval(runClock, 1000);
      runClock();
    });

    window.osToggleWin = function() {
      const win = document.getElementById('browserWindow');
      const icon = document.getElementById('shelfBrowser');
      if (win) {
        win.classList.toggle('minimized');
        if (win.classList.contains('minimized')) icon.classList.remove('active-app');
        else icon.classList.add('active-app');
      }
    };

    window.osLaunchApp = function(target) {
      const win = document.getElementById('browserWindow');
      if (win && win.classList.contains('minimized')) window.osToggleWin();
      document.getElementById('osLauncher').style.display = 'none';

      if (target === 'settings') nav('vav://settings');
      else if (target === 'youtube') createTab('https://www.youtube.com', true);
    };
  })();
}
