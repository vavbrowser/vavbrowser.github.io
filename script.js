const $=id=>document.getElementById(id);
let tabs=[],activeTabId=null,nextTabId=1;
const STORAGE={BOOK:'mc_bmk',HIST:'mc_hist'};
const searchSel=$('searchEngine'), addr=$('address'), status=$('status'), webArea=$('webviewArea'), loading=$('loadingBar');
const bookmarksEl=$('bookmarksList'), historyEl=$('historyList'), addrFav=$('addrFavicon');

const SCRIPT_VERSION = "4.0"; // Increment this version number when pushing updates to GitHub!

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


// --- LIVE REPOSITORY SYNC & AUTOMATED HOT-RELOAD MODULE ---
async function checkLiveUpdate() {
  try {
    const response = await fetch(`https://vavbrowser.github.io/version.json?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      if (data.version && data.version !== SCRIPT_VERSION && status) {
        status.textContent = `New update compiled (v${data.version})! Refreshing modules...`;
        status.style.background = "var(--accent)";
        status.style.color = "#000";
        status.style.fontWeight = "bold";
        
        setTimeout(() => {
          window.location.reload(); 
        }, 1500);
      }
    }
  } catch(e) {}
}
setInterval(checkLiveUpdate, 30000); 
checkLiveUpdate();
