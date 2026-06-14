(function initializeBrowserUI() {
  // 1. Dynamically Inject CSS Styles into the Head
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --bg:#0e1116; --toolbar:#181c24; --tab:#1f242e; --active-tab:#2a313e; --muted:#9ca3af;
      --accent:#00bcd4; --radius:8px; --transition:0.18s;
      font-family: 'Segoe UI', Roboto, Inter, system-ui, sans-serif;
      color-scheme: dark;
    }
    html, body { margin:0; height:100%; background:var(--bg); color:#fff; }
    body { display:flex; flex-direction:column; height:100vh; }

    /* Tabs */
    .tabs { display:flex; align-items:flex-end; background:var(--toolbar); padding:0 8px; height:40px; }
    .tab {
      display:flex; align-items:center; gap:8px;
      padding:6px 12px; border-radius:10px 10px 0 0;
      background:var(--tab); margin-right:6px;
      cursor:pointer; transition:background var(--transition), color var(--transition);
      color:var(--muted); min-width:120px; max-width:240px;
      position:relative;
    }
    .tab.active { background:var(--active-tab); color:#fff; }
    .tab .title { overflow:hidden; white-space:nowrap; text-overflow:ellipsis; flex:1; }
    .tab .favicon { width:16px; height:16px; border-radius:3px; background:rgba(255,255,255,0.1); }
    .tab .favicon img { width:100%; height:100%; display:block; }
    .tab .close {
      font-size:13px; opacity:.6; padding:2px 6px; border-radius:50%; transition:background var(--transition);
    }
    .tab .close:hover { background:rgba(255,255,255,0.15); opacity:1; }

    .add-tab {
      background:none; border:none; color:var(--muted); font-size:18px;
      padding:6px 10px; cursor:pointer; border-radius:50%;
      transition:background var(--transition), color var(--transition);
    }
    .add-tab:hover { background:rgba(255,255,255,0.1); color:#fff; }

    /* Toolbar */
    .toolbar {
      display:flex; align-items:center; gap:8px; background:var(--toolbar); padding:6px 8px;
      box-shadow:0 1px 0 rgba(255,255,255,0.05);
    }
    .btn {
      width:34px; height:34px; display:grid; place-items:center; cursor:pointer;
      color:var(--muted); border-radius:50%; transition:background var(--transition), color var(--transition);
    }
    .btn:hover { background:rgba(255,255,255,0.1); color:#fff; }
    .address-bar {
      flex:1; display:flex; align-items:center; background:var(--tab);
      border-radius:20px; padding:0 10px; height:34px;
    }
    .address-bar img { width:16px; height:16px; margin-right:6px; border-radius:3px; }
    .address-bar input {
      flex:1; border:none; outline:none; background:transparent; color:#fff; font-size:14px;
    }
    select {
      background:var(--tab); border:none; border-radius:8px; padding:4px 8px; color:var(--muted);
    }

    /* Panels */
    .content { flex:1; display:flex; overflow:hidden; }
    .webview-area { flex:1; position:relative; background:#0b111b; }
    iframe.webview { position:absolute; inset:0; border:0; width:100%; height:100%; }
    .status {
      position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.6);
      padding:6px 12px; border-radius:6px; font-size:12px;
    }
    .side-panels { width:280px; background:var(--toolbar); overflow:auto; display:none; }
    .card { background:var(--tab); margin:8px; padding:10px; border-radius:var(--radius); cursor:pointer; }
    .card:hover { background:var(--active-tab); }
    .card small { color:var(--muted); }

    /* Loading bar */
    .loading-bar {
      position:absolute; top:0; left:0; height:3px; background:var(--accent);
      width:0%; transition:width 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // 2. Dynamically Inject Layout Architecture into the Body
  document.body.innerHTML = `
    <div class="tabs" id="tabs"></div>

    <div class="toolbar">
      <div class="btn" id="back">⟵</div>
      <div class="btn" id="forward">⟶</div>
      <div class="btn" id="reload">⟳</div>
      <div class="btn" id="home">⌂</div>

      <div class="address-bar">
        <img id="addrFavicon" src="" alt="icon" />
        <input id="address" placeholder="Search or type URL" />
      </div>
      <select id="searchEngine">
        <option value="https://www.google.com/search?q=" selected>Google</option>
        <option value="https://duckduckgo.com/?q=">DuckDuckGo</option>
        <option value="https://bing.com/search?q=">Bing</option>
      </select>
      <div class="btn" id="goBtn">▶</div>
      <div class="btn" id="bookmarkBtn">☆</div>
      <div class="btn" id="toggleBookmarks">☰</div>
    </div>

    <div class="content">
      <div class="webview-area" id="webviewArea">
        <div class="loading-bar" id="loadingBar"></div>
        <div class="status" id="status">Ready</div>
      </div>
      <div class="side-panels" id="sidePanels">
        <h3 style="padding:8px;color:var(--muted)">Bookmarks</h3>
        <div id="bookmarksList"></div>
        <h3 style="padding:8px;color:var(--muted)">History</h3>
        <div id="historyList"></div>
      </div>
    </div>
  `;
})();
const $=id=>document.getElementById(id);
let tabs=[],activeTabId=null,nextTabId=1;
const STORAGE={BOOK:'mc_bmk',HIST:'mc_hist'};
const searchSel=$('searchEngine'), addr=$('address'), status=$('status'), webArea=$('webviewArea'), loading=$('loadingBar');
const bookmarksEl=$('bookmarksList'), historyEl=$('historyList'), addrFav=$('addrFavicon');

function faviconFor(url){
  try{let u=new URL(url);return "https://www.google.com/s2/favicons?sz=32&domain_url="+u.origin;}catch(e){return "";}
}

function createTab(url='',activate=true){
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
        t.title=t.url||'New Tab';t.favicon=faviconFor(t.url);
        renderTabs();if(t.id===activeTabId)addrFav.src=t.favicon;
        loading.style.width='0%';status.textContent='Loaded';
      });
    }
    t.iframe.style.display=t.id===activeTabId?'block':'none';
    if(t.id===activeTabId && t.url && t.iframe.src!==t.url){
      loading.style.width='70%';status.textContent='Loading...';
      t.iframe.src=t.url;
    }
  });
}
function nav(raw){
  const t=getTab(activeTabId);if(!t)return;
  let u=raw.trim();if(!u)return;
  if(/\s/.test(u)||!u.includes('.'))u=searchSel.value+encodeURIComponent(u);
  else if(!/^https?:\/\//.test(u))u='https://'+u;
  t.history=t.history.slice(0,t.i+1);t.history.push(u);t.i++;
  t.url=u;addr.value=u;t.favicon=faviconFor(u);addrFav.src=t.favicon;
  loading.style.width='40%';status.textContent='Loading...';
  renderWeb();pushHist(u);
}
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
$('reload').onclick=()=>{const t=getTab(activeTabId);if(t)t.iframe.src=t.url;}
$('home').onclick=()=>nav('https://example.com');
$('bookmarkBtn').onclick=()=>{const t=getTab(activeTabId);if(t&&t.url)addBmk(t.url);}
$('toggleBookmarks').onclick=()=>{$('sidePanels').style.display=$('sidePanels').style.display==='none'?'block':'none';}
$('back').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i>0){t.i--;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}
$('forward').onclick=()=>{const t=getTab(activeTabId);if(t&&t.i<t.history.length-1){t.i++;t.url=t.history[t.i];addr.value=t.url;t.favicon=faviconFor(t.url);addrFav.src=t.favicon;renderWeb();}}
createTab('',true);renderPanels();
