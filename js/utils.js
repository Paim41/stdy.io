/* ==========================================================================
   stdy.io — utils.js
   Shared low-level helpers used across every page: storage access, id
   generation, formatting, toasts, confirmation dialogs and the SVG icon set.
   ========================================================================== */

/* ---------------- LocalStorage helpers ---------------- */

/** Read and JSON.parse a key from LocalStorage. Returns fallback on any error. */
function getData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`stdy.io: failed to read "${key}"`, err);
    return fallback;
  }
}

/** JSON.stringify and write a value to LocalStorage. */
function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`stdy.io: failed to save "${key}"`, err);
    showToast('Could not save data locally. Your browser storage may be full.', 'error');
    return false;
  }
}

function removeData(key) { try { localStorage.removeItem(key); } catch (e) {} }

/** Generate a reasonably unique id such as "usr_a1b2c3d4". */
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------------- Session / user helpers ---------------- */

function findUserByEmail(email) {
  const users = getData('stdyio_users', []);
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function findUserById(id) {
  const users = getData('stdyio_users', []);
  return users.find(u => u.id === id) || null;
}

/** Returns the logged-in user object, checking session storage first, then local. */
function getCurrentUser() {
  let id = sessionStorage.getItem('stdyio_current_user');
  let persistent = false;
  if (!id) { id = localStorage.getItem('stdyio_current_user'); persistent = true; }
  if (!id) return null;
  const user = findUserById(id);
  return user;
}

function setCurrentUser(userId, remember) {
  if (remember) {
    localStorage.setItem('stdyio_current_user', userId);
    sessionStorage.removeItem('stdyio_current_user');
  } else {
    sessionStorage.setItem('stdyio_current_user', userId);
    localStorage.removeItem('stdyio_current_user');
  }
}

function clearCurrentUser() {
  localStorage.removeItem('stdyio_current_user');
  sessionStorage.removeItem('stdyio_current_user');
}

function getSafeNextPath(value) {
  if (!value) return null;
  const candidate = String(value).trim();
  return /^[a-z0-9-]+\.html(?:\?[^\s#]*)?(?:#[^\s]*)?$/i.test(candidate) ? candidate : null;
}

/** Redirect to login if nobody is signed in. Returns the user or null (after redirecting). */
function requireAuthentication() {
  const user = getCurrentUser();
  if (!user) {
    const next = encodeURIComponent(`${location.pathname.split('/').pop()}${location.search}`);
    location.href = `login.html?next=${next}`;
    return null;
  }
  return user;
}

/** Redirect to an unauthorized page if the current user's role does not match. */
function requireRole(role) {
  const user = requireAuthentication();
  if (!user) return null;
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    location.href = 'dashboard.html';
    return null;
  }
  return user;
}

/* ---------------- Formatting ---------------- */

function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `RM ${n.toFixed(2)}`;
}

function formatDate(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-MY', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(dateInput) {
  const d = new Date(dateInput);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateInput);
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const initials = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return initials.toUpperCase();
}

/** Escape a string for safe insertion as text (protects against innerHTML injection). */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

function truncateText(str, max = 120) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max).trim() + '…' : str;
}

function debounce(fn, wait = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

/* ---------------- Toasts ---------------- */

function ensureToastStack() {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  return stack;
}

const TOAST_ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.5l2.2 2.2L15.5 9M12 21a9 9 0 100-18 9 9 0 000 18z"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M12 21a9 9 0 100-18 9 9 0 000 18z"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8h.01M11 12h1v5h1M12 21a9 9 0 100-18 9 9 0 000 18z"/></svg>',
};

function showToast(message, type = 'info', duration = 3800) {
  const stack = ensureToastStack();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${TOAST_ICONS[type] || TOAST_ICONS.info}<span>${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Dismiss notification">${Icons.close}</button>`;
  stack.appendChild(el);
  const remove = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 200); };
  el.querySelector('.toast-close').addEventListener('click', remove);
  const timer = setTimeout(remove, duration);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
}

/* ---------------- Confirmation / generic modal dialog ---------------- */

function ensureModalRoot() {
  let root = document.querySelector('.modal-overlay[data-role="confirm"]');
  if (!root) {
    root = document.createElement('div');
    root.className = 'modal-overlay';
    root.dataset.role = 'confirm';
    root.innerHTML = `<div class="modal" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(root);
  }
  return root;
}

/**
 * showConfirmationDialog({ title, message, confirmText, cancelText, danger })
 * Returns a Promise<boolean> resolved true if confirmed.
 */
function showConfirmationDialog(options = {}) {
  const { title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = options;
  return new Promise(resolve => {
    const overlay = ensureModalRoot();
    const modal = overlay.querySelector('.modal');
    modal.innerHTML = `
      <div class="modal-head"><h3>${escapeHtml(title)}</h3>
        <button class="modal-close" aria-label="Close dialog">${Icons.close}</button></div>
      <p>${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" data-act="cancel">${escapeHtml(cancelText)}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-act="confirm">${escapeHtml(confirmText)}</button>
      </div>`;
    const close = (result) => {
      overlay.classList.remove('show');
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    modal.querySelector('[data-act="cancel"]').onclick = () => close(false);
    modal.querySelector('[data-act="confirm"]').onclick = () => close(true);
    modal.querySelector('.modal-close').onclick = () => close(false);
    overlay.onclick = (e) => { if (e.target === overlay) close(false); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => overlay.classList.add('show'));
    modal.querySelector('[data-act="confirm"]').focus();
  });
}

/** Generic modal opener for custom content (used by lesson preview, report dialog, etc). */
function openModal(innerHtml, { onOpen } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${innerHtml}</div>`;
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
  const closeFn = () => {
    overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    setTimeout(() => overlay.remove(), 200);
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => { if (e.key === 'Escape') closeFn(); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeFn(); });
  document.addEventListener('keydown', onKey);
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.querySelectorAll('[data-close-modal]').forEach(b => b.addEventListener('click', closeFn));
  if (onOpen) onOpen(overlay, closeFn);
  return { overlay, close: closeFn };
}

/* ---------------- SVG Icon set (line icons, consistent stroke-width) ---------------- */

const Icons = {
  logo: `<span class="brand-mark" aria-hidden="true"><img src="assets/stdy-logo.png" alt=""></span>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>`,
  courses: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h8l6 6v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/><path stroke-linecap="round" stroke-linejoin="round" d="M14 4v6h6"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="M21 21l-4.3-4.3"/></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M7 12h10M10 18h4"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path stroke-linecap="round" d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`,
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 19.5V5a2 2 0 012-2h13v16H6a2 2 0 00-2 2.5z"/><path stroke-linecap="round" d="M4 19.5A2 2 0 016 17.5h13"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path fill="currentColor" stroke="none" d="M10 8.5l6 3.5-6 3.5z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3.5 2"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.5 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`,
  starOutline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linejoin="round" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.5 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>`,
  certificate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="5"/><path stroke-linecap="round" stroke-linejoin="round" d="M8.5 12.5L7 21l5-2.5L17 21l-1.5-8.5"/></svg>`,
  progress: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M4 19h16M4 19V9m5 10V5m5 14v-7m5 7v-3"/></svg>`,
  discussion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a8 8 0 01-11.5 7.2L4 20l1.1-4.2A8 8 0 1121 12z"/></svg>`,
  reply: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17l-5-5 5-5m-5 5h9a5 5 0 015 5v1"/></svg>`,
  upvote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path stroke-linecap="round" d="M13.7 21a2 2 0 01-3.4 0"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path stroke-linecap="round" d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.2a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.2a1.7 1.7 0 001.6-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.2a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9c.4.5.9.8 1.5 1H21a2 2 0 110 4h-.2a1.7 1.7 0 00-1.5 1z"/></svg>`,
  login: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.5 3h2l2.6 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.6L21 8H6"/></svg>`,
  payment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path stroke-linecap="round" d="M2.5 10h19M6 15h4"/></svg>`,
  receipt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path stroke-linecap="round" d="M9 8h6M9 12h6"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg>`,
  prev: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 18l6-6-6-6"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M17 3l4 4-11 11H6v-4z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h16M9 7V4h6v3m-8 0l1 13h8l1-13"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10" rx="2"/><path stroke-linecap="round" d="M8 10V7a4 4 0 018 0v3"/></svg>`,
  unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10" rx="2"/><path stroke-linecap="round" d="M8 10V7a4 4 0 017.9-1"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v13m0 0l-4.5-4.5M12 16l4.5-4.5M4 19h16"/></svg>`,
  print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-6a1 1 0 011-1h16a1 1 0 011 1v6a1 1 0 01-1 1h-2M6 14h12v7H6z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L2.4 18a1.8 1.8 0 001.6 2.6h16a1.8 1.8 0 001.6-2.6L13.7 3.9a1.8 1.8 0 00-3.4 0z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 4.2A10.4 10.4 0 0112 4c6.5 0 10 7 10 7a13.6 13.6 0 01-3.1 3.9M6.6 6.6C4 8.3 2 11 2 11s3.5 7 10 7c1.3 0 2.5-.2 3.5-.6"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3.5h12v17l-6-4-6 4z"/></svg>`,
  chevDown: `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
  moon: `<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/></svg>`,
  sun: `<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path stroke-linecap="round" d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/></svg>`,
  award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="9" r="5"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 13.5L7.5 21l4.5-2.3L16.5 21 15 13.5"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 21V4m0 1.5C7 4 8.5 6 11 6s4-2 6-2v9c-2 0-3.5 2-6 2s-4-2-6-2"/></svg>`,
  pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2a5 5 0 015 5c0 3.5-5 10-5 10s-5-6.5-5-10a5 5 0 015-5z"/><circle cx="12" cy="7" r="2"/></svg>`,
  megaphone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 11v2a2 2 0 002 2h1l4 5v-16l-4 5H5a2 2 0 00-2 2z"/><path stroke-linecap="round" d="M15 8a4 4 0 010 8m4-11a8 8 0 010 14"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 19h16M8 19V9m4 10V5m4 14v-6"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14m-6-6l6 6-6 6"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0012 3z"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 6.5l9 6.5 9-6.5"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 5c0 8.5 6.5 15 15 15l3-4-6-3-2 2c-2-1-4.5-3.5-5.5-5.5l2-2-3-6z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6z"/></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8 8l-4 4 4 4m8-8l4 4-4 4M13.5 5l-3 14"/></svg>`,
  fileText: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7 2h7l5 5v15H7z"/><path stroke-linecap="round" d="M9 12h6M9 16h6M14 2v5h5"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8.5" cy="8" r="3.5"/><path stroke-linecap="round" d="M2.5 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="3"/><path stroke-linecap="round" d="M15 20c.2-2.8 2-5 4.5-5"/></svg>`,
  puzzle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8h3.5a2 2 0 100-4H4v4zM4 8v6h4a2 2 0 110 4v3h4v-4a2 2 0 114 0v4h4v-6h-4a2 2 0 110-4h4V8h-6a2 2 0 11-4 0H4z"/></svg>`,
};
