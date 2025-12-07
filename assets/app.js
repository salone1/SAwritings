/* File: assets/app.js */

function qs(sel, ctx = document) { return ctx.querySelector(sel); }

const API = {
  async load() {
    const res = await fetch('/data/writings.json', { cache: 'no-store' });
    const json = await res.json();
    return Array.isArray(json) ? json : (json.items || []);
  }
};

/* Inline SVG icons (lightweight, no external libs) */
const Icons = {
  instagram: `<svg class="icon" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="6" r="1.5" fill="currentColor"/></svg>`,
  x: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M4 4 L20 20 M20 4 L4 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  telegram: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M3 12l18-7-5 16-5-6-4 3 2-6z" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
  share: `<svg class="icon" viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2" fill="currentColor"/><circle cx="18" cy="6" r="2" fill="currentColor"/><circle cx="18" cy="18" r="2" fill="currentColor"/><path d="M8 12l8-6M8 12l8 6" stroke="currentColor" stroke-width="2"/></svg>`,
  link: `<svg class="icon" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 017 0l2 2a5 5 0 01-7 7l-2-2M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l2-2" stroke="currentColor" stroke-width="2"/></svg>`
};

/* Global header/footer injection with hamburger menu and icons */
async function injectChrome() {
  const header = qs('#app-header');
  const footer = qs('#app-footer');

  if (header) {
    header.innerHTML = `
      <div class="nav container">
        <button id="menu-toggle" class="menu-toggle" aria-label="Open menu">☰</button>
        <div id="menu" class="menu-panel" role="menu">
          <a href="/" role="menuitem">Home</a>
          <a href="/about.html" role="menuitem">About</a>
          <a href="/contact.html" role="menuitem">Contact</a>
        </div>
        <div class="filters">
          <select id="filter-type" class="select" aria-label="Filter by type">
            <option value="">All types</option>
            <option value="books">Books</option>
            <option value="poem">Poems</option>
            <option value="quote">Quotes</option>
            <option value="article">Articles</option>
          </select>
          <select id="filter-lang" class="select" aria-label="Filter by language">
            <option value="">All languages</option>
            <option value="urdu">Urdu</option>
            <option value="english">English</option>
          </select>
        </div>
      </div>
    `;
    const toggle = qs('#menu-toggle');
    const panel = qs('#menu');
    toggle.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && e.target !== toggle) panel.style.display = 'none';
    });
  }

  if (footer) {
    footer.innerHTML = `
      <div class="container">
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
            <div>© ${new Date().getFullYear()} Sawrites</div>
            <div style="display:flex;gap:14px">
              <a href="https://instagram.com/sawrites" rel="noopener" aria-label="Instagram" title="Instagram">${Icons.instagram}</a>
              <a href="https://twitter.com/sawrites" rel="noopener" aria-label="X" title="X (Twitter)">${Icons.x}</a>
              <a href="https://t.me/sawrites" rel="noopener" aria-label="Telegram" title="Telegram">${Icons.telegram}</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

/* Index page logic */
async function initIndex() {
  const data = await API.load();
  const listEl = qs('#list');
  const searchEl = qs('#search');
  const typeEl = qs('#filter-type');
  const langEl = qs('#filter-lang');

  function render(items) {
    listEl.innerHTML = items.map(item => `
      <div class="card list-item">
        <h3><a href="/content.html?id=${encodeURIComponent(item.id)}">${item.title}</a></h3>
        <div class="badge">Type: ${item.type}</div>
        <div class="badge">Language: ${item.language}</div>
        <p class="excerpt">${item.excerpt || ''}</p>
      </div>
    `).join('');
  }

  function matches(item, q, type, lang) {
    const hit = (t) => (t || '').toLowerCase().includes(q);
    const inSearch = !q || [item.title, item.author, item.excerpt, item.content, (item.tags||[]).join(' ')].some(hit);
    const inType = !type || item.type === type;
    const inLang = !lang || item.language === lang;
    return inSearch && inType && inLang;
  }

  function update() {
    const q = (searchEl?.value || '').toLowerCase().trim();
    const type = typeEl?.value || '';
    const lang = langEl?.value || '';
    const filtered = data.filter(item => matches(item, q, type, lang));
    render(filtered);
  }

  if (searchEl && typeEl && langEl) {
    ['input', 'change'].forEach(ev => {
      searchEl.addEventListener(ev, update);
      typeEl.addEventListener(ev, update);
      langEl.addEventListener(ev, update);
    });
  }
  render(data);
}

/* Content page logic */
async function initContent() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const data = await API.load();
  const item = data.find(x => x.id === id);

  const body = qs('#content-body');
  const titleEl = qs('#content-title');
  const metaEl = qs('#content-meta');
  const wm = qs('.watermark');

  if (!item) {
    body.innerHTML = `<div class="card">Content not found.</div>`;
    return;
  }

  document.body.setAttribute('data-language', item.language);
  titleEl.textContent = item.title;
  metaEl.innerHTML = `
    <span class="badge">Type: ${item.type}</span>
    <span class="badge">Language: ${item.language}</span>
    ${item.author ? `<span class="badge">Author: ${item.author}</span>` : ''}
  `;
  body.innerText = item.content; // non-selectable text
  wm.setAttribute('data-mark', `Sawrites • ${new Date().toLocaleDateString()}`);

  /* Share: title + canonical link only */
  const url = `${location.origin}/content.html?id=${encodeURIComponent(item.id)}`;
  const shareRow = qs('#share-row');
  shareRow.innerHTML = `
    <button class="icon-btn" id="share-native">${Icons.share} <span>Share</span></button>
    <a class="icon-btn" id="share-x" rel="noopener" target="_blank"
      href="https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(url)}">${Icons.x} <span>X</span></a>
    <a class="icon-btn" id="share-telegram" rel="noopener" target="_blank"
      href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(item.title)}">${Icons.telegram} <span>Telegram</span></a>
    <button class="icon-btn" id="copy-link">${Icons.link} <span>Copy link</span></button>
  `;

  qs('#share-native').addEventListener('click', async () => {
    if (navigator.share) {
      try { await navigator.share({ title: item.title, url }); toast('Link shared'); }
      catch { toast('Share canceled'); }
    } else {
      navigator.clipboard.writeText(url);
      toast('Link copied');
    }
  });
  qs('#copy-link').addEventListener('click', async () => {
    await navigator.clipboard.writeText(url);
    toast('Link copied');
  });

  /* Deter copying */
  body.addEventListener('copy', e => { e.preventDefault(); toast('Copy disabled'); });
  body.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'u', 's', 'p'].includes(k)) {
      e.preventDefault(); toast('Action disabled');
    }
    if (e.key === 'PrintScreen') { toast('Screenshots discouraged'); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) body.style.filter = 'blur(3px)';
    else body.style.filter = '';
  });
}

/* Minimal toast */
let toastTimer;
function toast(msg) {
  clearTimeout(toastTimer);
  let t = qs('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  toastTimer = setTimeout(() => t.remove(), 1800);
}

/* Bootstrap: always inject header/footer, then page-specific init */
document.addEventListener('DOMContentLoaded', async () => {
  await injectChrome();
  const page = document.body.getAttribute('data-page');
  if (page === 'index') initIndex();
  else if (page === 'content') initContent();
  // About/contact pages use only the shared chrome.
});