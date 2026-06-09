const $=id=>document.getElementById(id);
let tabs=[],activeTabId=null,nextTabId=1;
const STORAGE={BOOK:'mc_bmk',HIST:'mc_hist'};
const searchSel=$('searchEngine'), addr=$('address'), status=$('status'), webArea=$('webviewArea'), loading=$('loadingBar');
const bookmarksEl=$('bookmarksList'), historyEl=$('historyList'), addrFav=$('addrFavicon');

function faviconFor(url){
  try{
    if(url.startsWith('vav://')) return "";
    let u=new URL(url);
    return "https://www.google.com/s2/favicons?sz=32&domain_url="+u.origin;
  }catch(e){return "";}
}

// Generates internal browser page structures
function getVavPage(url) {
  const target = url.toLowerCase().replace('vav://', '').trim() || 'home';
  const sharedStyle = `
    <style>
      body { background: #0e1116; color: #fff; font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; text-align: center; margin: 0; }
      h1 { color: #00bcd4; font-weight: 400; margin-bottom: 8px; font-size: 2.5rem; }
      p { color: #9ca3af; margin-bottom: 24px; }
      .box { max-width: 650px; margin: 0 auto; text-align: left; background: #181c24; padding: 24px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
      .card { background: #1f242e; padding: 14px; margin: 10px 0; border-radius: 8px; cursor: pointer; transition: background 0.2s, transform 0.1s; display: flex; justify-content: space-between; align-items: center; }
      .card:hover { background: #2a313e; transform: translateY(-1px); }
      .card a { color: #00bcd4; text-decoration: none; word-break: break-all; font-size: 14px; }
      .search-box { width: 100%; padding: 12px 18px; border-radius: 25px; border: 1px solid #2a313e; background: #1f242e; color: #fff; box-sizing: border-box; font-size: 16px; margin-top: 20px; outline: none; transition: border-color 0.2s; }
      .search-box:focus { border-color: #00bcd4; }
      .btn-row { margin-top: 20px; display: flex; gap: 12px; justify-content: center; }
      .nav-btn { background: #1f242e; color: #fff; border: 1px solid #2a313e; padding: 10px 20px; border-radius: 20px; cursor: pointer; transition: all 0.2s; font-size: 14px; }
      .nav-btn:hover { background: #00bcd4; color: #0e1116; border-color: #00bcd4; }
    </style>
  `;

  if (target === 'home') {
    return `<html><head>${sharedStyle}</head><body>
      <div style="margin-top: 10vh;">
        <h1>MiniChrome+</h1>
        <p>Explore the web inside your custom HTML browser shell</p>
        <div style="max-width: 500px; margin: 0 auto;">
          <input type="text" class="search-box" placeholder="Search or enter URL..." onkeydown="if(event.key==='Enter') window.parent.nav(this.value)">
          <div class="btn-row">
            <button class="nav-btn" onclick="window.parent.nav('vav://bookmarks')">Bookmarks</button>
            <button class="nav-btn" onclick="window.parent.nav('vav://history')">History</button>
            <button class="nav-btn" onclick="window.parent.nav('vav://mall')">Mall</button>
            <button class="nav-btn" onclick="window.parent.nav('vav://flags')">Flags</button>
          </div>
        </div>
      </div>
    </body></html>`;
  }

  if (target === 'bookmarks') {
    const data = JSON.parse(localStorage.getItem(STORAGE.BOOK) || '[]');
    let items = data.map(x => `<div class="card" onclick="window.parent.nav('${x.u}')"><a>${x.u}</a><small style="color:#00bcd4">★</small></div>`).join('');
    return `<html><head>${sharedStyle}</head><body>
      <div class="box">
        <h1>Bookmarks</h1>
        <p>Your saved references</p>
        ${items || '<p style="text-align:center; padding: 20px 0;">No bookmarks captured yet.</p>'}
      </div>
    </body></html>`;
  }

  if (target === 'history') {
    const data = JSON.parse(localStorage.getItem(STORAGE.HIST) || '[]');
    let items = data.map(x => `<div class="card" onclick="window.parent.nav('${x.u}')"><a>${x.u}</a><small style="color:#9ca3af">${new Date(x.ts).toLocaleTimeString()}</small></div>`).join('');
    return `<html><head>${sharedStyle}</head><body>
      <div class="box">
        <h1>History</h1>
        <p>Recently visited pages</p>
        ${items || '<p style="text-align:center; padding: 20px 0;">Your browsing history is empty.</p>'}
      </div>
    </body></html>`;
  }

  if (target === 'mall') {
    return `<html><head>${sharedStyle}</head><body>
      <div class="box">
        <h1>Vav Web Mall</h1>
        <p>Discover extensions, standalone web apps, and custom interface designs</p>
        <div class="card" onclick="alert('Mock Extension Added Successfully!')">
          <div><strong>🛡️ AdBlock Pro Max</strong><br><small style="color:#9ca3af">Blocks heavy tracking nodes and scripts.</small></div>
          <button class="nav-btn" style="padding: 6px 14px; font-size: 12px;">Get</button>
        </div>
        <div class="card" onclick="alert('Mock Theme Injected!')">
          <div><strong>🎨 Dark Cyberpunk Theme</strong><br><small style="color:#9ca3af">Turns layout properties neon blue and sharp pink.</small></div>
          <button class="nav-btn" style="padding: 6px 14px; font-size: 12px;">Get</button>
        </div>
        <div class="card" onclick="alert('Mock Plugin Activated!')">
          <div><strong>🤖 Reader Mode AI</strong><br><small style="color:#9ca3af">Extract clean readable content blocks automatically.</small></div>
          <button class="nav-btn" style="padding: 6px 14px; font-size: 12px;">Get</button>
        </div>
      </div>
    </body></html>`;
  }

  if (target === 'flags') {
    return `<html><head>${sharedStyle}
      <style>
        .flag-item { display: flex; justify-content: space-between; align-items: center; background: #1f242e; padding: 14px; margin: 10px 0; border-radius: 8px; }
        .flag-desc { color: #9ca3af; font-size: 13px; margin-top: 4px; }
        select { background: #2a313e; color: #fff; border: 1px solid #3f485c; padding: 6px 12px; border-radius: 6px; cursor: pointer; outline: none; }
      </style>
    </head><body>
      <div class="box">
        <h1>Vav Experimental Flags</h1>
        <p style="color: #ffb74d;">⚠️ WARNING: These settings are strictly experimental. Toggling options might compromise UI rendering stability.</p>
        
        <div class="flag-item">
          <div>
            <strong>#smooth-kinetic-scrolling</strong>
            <div class="flag-desc">Overrides baseline frame containers to use enhanced hardware-driven physics arrays.</div>
          </div>
          <select onchange="alert('Property saved. Restart shell to load updates.')">
            <option>Default</option>
            <option selected>Enabled</option>
            <option>Disabled</option>
          </select>
        </div>

        <div class="flag-item">
          <div>
            <strong>#strict-origin-isolation</strong>
            <div class="flag-desc">Saves unique browser environments separately per processing context.</div>
          </div>
          <select onchange="alert('Property saved. Restart shell to load updates.')">
            <option selected>Default</option>
            <option>Enabled</option>
            <option>Disabled</option>
          </select>
        </div>

        <div class="flag-item">
          <div>
            <strong>#force-gpu-rasterization</strong>
            <div class="flag-desc">Skips default CPU processing logic to force layer painting straight onto active GPU vectors.</div>
          </div>
          <select onchange="alert('Property saved. Restart shell to load updates.')">
            <option>Default</option>
            <option>Enabled</option>
            <option selected>Disabled</option>
          </select>
        </div>
      </div>
    </body></html>`;
  }

  return `<html><head>${sharedStyle}</head><body><h1>404</h1><p>Internal address <code>vav://${target}</code> not found.</p></body></html>`;
}

function createTab(url='',activate=true){
  if(!url) url = 'vav://home';
  const id='t'+(nextTabId++);
  const tab={id,url,history:url?[url]:[],i:url?0:-1,title:'New Tab',iframe:null,favicon:''};
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
  tabs.forEach(t=>{
    if(!t.iframe){
      const ifr=document.createElement('iframe');ifr.className='webview';ifr.dataset.tab=t.id;webArea.appendChild(ifr);t.iframe=ifr;
      ifr.addEventListener('load',()=>{
        if(t.url.startsWith('vav://')) {
          let name = t.url.replace('vav://','');
          t.title = name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Home';
          t.favicon = '';
        } else {
          t.title=t.url||'New Tab';t.favicon=faviconFor(t.url);
        }
        renderTabs();if(t.id===activeTabId)addrFav.src=t.favicon;
        loading.style.width='0%';status.textContent='Loaded';
      });
    }
    t.iframe.style.display=t.id===activeTabId?'block':'none';
    
    if(t.id===activeTabId && t.url){
      if(t.url.startsWith('vav://')) {
        if(t.iframe.dataset.loadedUrl !== t.url) {
          t.iframe.dataset.loadedUrl = t.url;
          t.iframe.removeAttribute('src');
          loading.style.width='70%';status.textContent='Loading internal page...';
          t.iframe.srcdoc = getVavPage(t.url);
        }
      } else {
        if(t.iframe.src!==t.url){
          t.iframe.dataset.loadedUrl = '';
          t.iframe.removeAttribute('srcdoc');
          loading.style.width='70%';status.textContent='Loading...';
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
    // Pass custom internal protocols straight through
  } else if(/\s/.test(u)||!u.includes('.')) {
    u=searchSel.value+encodeURIComponent(u);
  } else if(!/^https?:\/\//.test(u)) {
    u='https://'+u;
  }
  
  t.history=t.history.slice(0,t.i+1);t.history.push(u);t.i++;
  t.url=u;addr.value=u;t.favicon=faviconFor(u);addrFav.src=t.favicon;
  loading.style.width='40%';status.textContent='Loading...';
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
$('home').onclick=()=>nav('vav://home');
$('bookmarkBtn').onclick=()=>{const t=getTab(activeTabId);if(t&&t.url)addBmk(t.url);}
$('toggleBookmarks').onclick=()=>{$('sidePanels').style.display=$('sidePanels').style.display==='none'?'block':'none';}
$('back').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i>0){t.i--;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}
$('forward').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i<t.history.length-1){t.i++;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}

createTab('',true);renderPanels();
window.nav = nav;
// --- ALL-IN-ONE JS SPEECH TO TEXT LOGIC ---
(function() {
  const addressInput = document.getElementById('address');
  const goBtn = document.getElementById('goBtn');
  const statusEl = document.getElementById('status');

  // Safety check: make sure the address bar exists before doing anything
  if (!addressInput) return;

  // 1. Dynamically create the microphone element
  const micBtn = document.createElement('div');
  micBtn.id = 'micBtn';
  micBtn.innerText = '🎙️';
  micBtn.title = 'Search with your voice';
  
  // 2. Inject styles directly through JS so you don't need CSS edits
  micBtn.style.cursor = 'pointer';
  micBtn.style.padding = '0 6px';
  micBtn.style.opacity = '0.6';
  micBtn.style.transition = 'opacity 0.18s, transform 0.18s';
  micBtn.style.userSelect = 'none';

  // Add hover animations via JS listener
  micBtn.addEventListener('mouseenter', () => { micBtn.style.opacity = '1'; micBtn.style.transform = 'scale(1.1)'; });
  micBtn.addEventListener('mouseleave', () => { micBtn.style.opacity = '0.6'; micBtn.style.transform = 'scale(1)'; });

  // 3. Insert the microphone element right after the address input box
  addressInput.parentNode.insertBefore(micBtn, addressInput.nextSibling);

  // 4. Web Speech API Logic
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
      micBtn.innerText = '🛑';
      micBtn.style.opacity = '1';
      addressInput.value = '';
      addressInput.placeholder = 'Listening...';
      if (statusEl) statusEl.textContent = "Listening to voice input...";
    };

    recognition.onend = () => {
      isListening = false;
      micBtn.innerText = '🎙️';
      micBtn.style.opacity = '0.6';
      addressInput.placeholder = 'Search or type URL';
    };

    recognition.onresult = (event) => {
      const voiceResult = event.results[0][0].transcript;
      addressInput.value = voiceResult;
      if (statusEl) statusEl.textContent = "Searching for: " + voiceResult;
      
      // Auto-trigger search after a brief glance at the text
      setTimeout(() => {
        if (goBtn) goBtn.click();
      }, 500);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error: ", event.error);
      if (statusEl) statusEl.textContent = "Voice Search Error: " + event.error;
    };

  } else {
    // Hide mic element if browser platform doesn't support speech tracking
    micBtn.style.display = 'none';
  }
})();
