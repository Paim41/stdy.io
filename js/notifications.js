/* ==========================================================================
   stdy.io — notifications.js
   In-app notification centre rendered as a dropdown panel from the header
   bell icon. Notifications are per-user and stored in stdyio_notifications.
   ========================================================================== */

function addNotification(userId, title, message, type = 'info') {
  const list = getData('stdyio_notifications', []);
  list.unshift({ id: generateId('ntf'), userId, title, message, type, read: false, createdAt: new Date().toISOString() });
  saveData('stdyio_notifications', list);
}

const NotificationsUI = (() => {
  let panelEl = null;
  let filter = 'all';

  const TYPE_ICON = {
    registration: Icons.user, login: Icons.login, enrollment: Icons.book, payment: Icons.payment,
    announcement: Icons.megaphone, reply: Icons.reply, quiz: Icons.check, progress: Icons.progress,
    completion: Icons.certificate, certificate: Icons.certificate, discussion: Icons.discussion, info: Icons.bell,
  };

  function mount() {
    if (panelEl) return;
    panelEl = document.createElement('div');
    panelEl.className = 'modal-overlay';
    panelEl.style.alignItems = 'flex-start';
    panelEl.style.justifyContent = 'flex-end';
    panelEl.innerHTML = `<div class="modal" style="max-width:380px; margin:calc(var(--header-h) + 8px) 16px 0 0;"></div>`;
    document.body.appendChild(panelEl);
    panelEl.addEventListener('click', (e) => { if (e.target === panelEl) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  function render() {
    const user = getCurrentUser();
    if (!user) return;
    const all = getData('stdyio_notifications', []).filter(n => n.userId === user.id);
    const items = filter === 'unread' ? all.filter(n => !n.read) : all;
    const modal = panelEl.querySelector('.modal');
    modal.innerHTML = `
      <div class="modal-head"><h3>Notifications</h3><button class="modal-close" aria-label="Close">${Icons.close}</button></div>
      <div class="tabs" style="margin-bottom:12px;">
        <button class="tab-btn ${filter==='all'?'active':''}" data-filter="all">All</button>
        <button class="tab-btn ${filter==='unread'?'active':''}" data-filter="unread">Unread</button>
      </div>
      <div class="flex justify-between mb-4"><button class="btn btn-ghost btn-sm" id="markAllReadBtn">Mark all as read</button></div>
      <div style="max-height:50vh; overflow-y:auto;">
        ${items.length ? items.map(renderItem).join('') : `
          <div class="empty-state" style="padding:32px 8px;">${Icons.bell}<h3 style="font-size:1rem;">No notifications</h3><p style="font-size:0.85rem;">You are all caught up.</p></div>`}
      </div>`;
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.filter; render(); }));
    modal.querySelector('#markAllReadBtn').addEventListener('click', () => {
      const list = getData('stdyio_notifications', []);
      list.forEach(n => { if (n.userId === user.id) n.read = true; });
      saveData('stdyio_notifications', list);
      render(); refreshBadge();
    });
    modal.querySelectorAll('[data-read]').forEach(b => b.addEventListener('click', () => { markRead(b.dataset.read); render(); refreshBadge(); }));
    modal.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { deleteOne(b.dataset.del); render(); refreshBadge(); }));
  }

  function renderItem(n) {
    return `<div class="reply-item" style="padding:12px 0; ${n.read ? '' : 'background:rgba(var(--primary-rgb),0.05);'}">
      <div class="benefit-icon" style="width:38px;height:38px;margin:0;flex-shrink:0;">${TYPE_ICON[n.type] || Icons.bell}</div>
      <div style="flex:1; min-width:0;">
        <p style="color:var(--text); font-weight:700; font-size:0.86rem;">${escapeHtml(n.title)}</p>
        <p style="font-size:0.82rem; margin:2px 0 6px;">${escapeHtml(n.message)}</p>
        <div class="flex items-center gap-3" style="font-size:0.74rem;">
          <span class="muted">${timeAgo(n.createdAt)}</span>
          ${!n.read ? `<button data-read="${n.id}" style="color:var(--primary); font-weight:700;">Mark read</button>` : ''}
          <button data-del="${n.id}" style="color:var(--danger); font-weight:700;">Delete</button>
        </div>
      </div>
    </div>`;
  }

  function markRead(id) {
    const list = getData('stdyio_notifications', []);
    const n = list.find(x => x.id === id);
    if (n) n.read = true;
    saveData('stdyio_notifications', list);
  }
  function deleteOne(id) {
    saveData('stdyio_notifications', getData('stdyio_notifications', []).filter(x => x.id !== id));
  }

  function refreshBadge() {
    const user = getCurrentUser();
    if (!user) return;
    const btn = document.getElementById('notifBtn');
    if (!btn) return;
    const unread = getData('stdyio_notifications', []).filter(n => n.userId === user.id && !n.read).length;
    let dot = btn.querySelector('.notif-dot');
    if (unread) {
      if (!dot) { dot = document.createElement('span'); dot.className = 'notif-dot'; btn.appendChild(dot); }
      dot.textContent = unread > 9 ? '9+' : unread;
    } else if (dot) dot.remove();
  }

  function toggle(anchorBtn) {
    if (!panelEl) mount();
    const isOpen = panelEl.classList.contains('show');
    if (isOpen) { close(); return; }
    render();
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => panelEl.classList.add('show'));
  }
  function close() {
    panelEl?.classList.remove('show');
    document.body.classList.remove('modal-open');
  }

  return { mount, toggle, refreshBadge };
})();

window.NotificationsUI = NotificationsUI;
window.addNotification = addNotification;
