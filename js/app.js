/* ==========================================================================
   stdy.io — app.js
   Shared page shell: header/nav, footer, theme switching, mobile drawer,
   bottom navigation and the notification dropdown. Every page calls
   StdyApp.init('pageKey') once the DOM is ready.
   ========================================================================== */

const StdyApp = (() => {
  let activePageKey = '';

  function initTheme() {
    const saved = localStorage.getItem('stdyio_theme');
    const theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('stdyio_theme', next);
  }

  const PUBLIC_LINKS = [
    { key:'home', href:'index.html', label:'Home' },
    { key:'courses', href:'courses.html', label:'Courses' },
    { key:'instructors', href:'index.html#instructors', label:'Instructors' },
    { key:'community', href:'forum.html', label:'Community' },
    { key:'about', href:'about.html', label:'About' },
  ];
  const AUTH_LINKS = [
    { key:'home', href:'index.html', label:'Home' },
    { key:'courses', href:'courses.html', label:'Courses' },
    { key:'mylearning', href:'dashboard.html', label:'My Learning' },
    { key:'community', href:'forum.html', label:'Community' },
  ];

  function renderHeader(activeKey) {
    const mount = document.getElementById('site-header');
    if (!mount) return;
    const user = getCurrentUser();
    const links = user ? AUTH_LINKS : PUBLIC_LINKS;
    const navHtml = links.map(l => `<a href="${l.href}" class="${activeKey === l.key ? 'active' : ''}">${l.label}</a>`).join('');

    let actionsHtml = '';
    if (user) {
      const unread = getData('stdyio_notifications', []).filter(n => n.userId === user.id && !n.read).length;
      const dashHref = user.role === 'admin' ? 'admin-dashboard.html' : user.role === 'instructor' ? 'instructor-dashboard.html' : 'dashboard.html';
      actionsHtml = `
        <button class="icon-btn theme-toggle" id="themeToggleBtn" aria-label="Toggle dark mode">${Icons.moon}${Icons.sun}</button>
        <button class="icon-btn" id="notifBtn" aria-label="Notifications, ${unread} unread">${Icons.bell}${unread ? `<span class="notif-dot">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
        <a class="icon-btn" href="${dashHref}" aria-label="Dashboard" title="Dashboard">${Icons.dashboard}</a>
        <a href="profile.html" class="avatar-badge" title="${escapeHtml(user.name)}" aria-label="Profile: ${escapeHtml(user.name)}">${user.avatar || getInitials(user.name)}</a>
        <button class="hamburger icon-btn" id="hamburgerBtn" aria-label="Open menu" aria-expanded="false">${Icons.menu}</button>`;
    } else {
      actionsHtml = `
        <button class="icon-btn theme-toggle" id="themeToggleBtn" aria-label="Toggle dark mode">${Icons.moon}${Icons.sun}</button>
        <a href="login.html" class="btn btn-ghost btn-sm">Log In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Sign Up</a>
        <button class="hamburger icon-btn" id="hamburgerBtn" aria-label="Open menu" aria-expanded="false">${Icons.menu}</button>`;
    }

    mount.innerHTML = `
      <a class="skip-link" href="#main">Skip to main content</a>
      <div class="container">
        <a href="index.html" class="brand">${Icons.logo}<span>stdy.io</span></a>
        <nav class="main-nav" aria-label="Primary">${navHtml}</nav>
        <div class="header-actions">${actionsHtml}</div>
      </div>`;

    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('hamburgerBtn').addEventListener('click', () => openMobileDrawer(activeKey, user));
    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) notifBtn.addEventListener('click', () => window.NotificationsUI && window.NotificationsUI.toggle(notifBtn));

    if (user) renderBottomNav(activeKey);
  }

  function openMobileDrawer(activeKey, user) {
    let overlay = document.querySelector('.drawer-overlay');
    let drawer = document.querySelector('.mobile-drawer');
    if (!overlay) {
      overlay = document.createElement('div'); overlay.className = 'drawer-overlay';
      drawer = document.createElement('div'); drawer.className = 'mobile-drawer';
      document.body.append(overlay, drawer);
      overlay.addEventListener('click', closeMobileDrawer);
    }
    const links = user ? AUTH_LINKS : PUBLIC_LINKS;
    let extra = '';
    if (user) {
      const dashHref = user.role === 'admin' ? 'admin-dashboard.html' : user.role === 'instructor' ? 'instructor-dashboard.html' : 'dashboard.html';
      extra = `<a href="${dashHref}">${Icons.dashboard}Dashboard</a><a href="profile.html">${Icons.user}Profile</a><a href="certificates.html">${Icons.certificate}Certificates</a>
        <button id="drawerLogout" style="width:100%">${Icons.logout}Log Out</button>`;
    } else {
      extra = `<a href="login.html">${Icons.login}Log In</a><a href="register.html">${Icons.user}Sign Up</a>`;
    }
    drawer.innerHTML = `
      <div class="flex items-center justify-between mb-4"><a href="index.html" class="brand">${Icons.logo}<span>stdy.io</span></a>
      <button class="icon-btn modal-close" id="drawerClose" aria-label="Close menu">${Icons.close}</button></div>
      <nav>${links.map(l => `<a href="${l.href}" class="${activeKey===l.key?'active':''}">${l.label}</a>`).join('')}${extra}</nav>`;
    document.getElementById('drawerClose').addEventListener('click', closeMobileDrawer);
    const logoutBtn = document.getElementById('drawerLogout');
    if (logoutBtn) logoutBtn.addEventListener('click', () => { closeMobileDrawer(); window.Auth && window.Auth.logout(); });
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => { overlay.classList.add('show'); drawer.classList.add('show'); });
    document.getElementById('hamburgerBtn').setAttribute('aria-expanded', 'true');
  }

  function closeMobileDrawer() {
    document.querySelector('.drawer-overlay')?.classList.remove('show');
    document.querySelector('.mobile-drawer')?.classList.remove('show');
    document.body.classList.remove('modal-open');
    document.getElementById('hamburgerBtn')?.setAttribute('aria-expanded', 'false');
  }

  const BOTTOM_ITEMS = [
    { key:'home', href:'index.html', label:'Home', icon:Icons.home },
    { key:'courses', href:'courses.html', label:'Courses', icon:Icons.courses },
    { key:'mylearning', href:'dashboard.html', label:'Learning', icon:Icons.book },
    { key:'community', href:'forum.html', label:'Community', icon:Icons.discussion },
    { key:'profile', href:'profile.html', label:'Profile', icon:Icons.user },
  ];

  function renderBottomNav(activeKey) {
    if (document.querySelector('.bottom-nav')) return;
    document.body.classList.add('has-bottom-nav');
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', 'Primary mobile');
    nav.innerHTML = BOTTOM_ITEMS.map(i => `<a href="${i.href}" class="${activeKey===i.key?'active':''}">${i.icon}<span>${i.label}</span></a>`).join('');
    document.body.appendChild(nav);
  }

  function renderFooter() {
    const mount = document.getElementById('site-footer');
    if (!mount) return;
    mount.innerHTML = `
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="brand">${Icons.logo}<span>stdy.io</span></a>
            <p>Learn smarter. Grow further. A modern learning platform for students who want practical, career-ready skills.</p>
          </div>
          <div class="footer-col"><h4>Quick Links</h4>
            <a href="courses.html">Browse Courses</a><a href="forum.html">Community</a><a href="about.html">About Us</a><a href="contact.html">Contact</a>
          </div>
          <div class="footer-col"><h4>Categories</h4>
            <a href="courses.html?category=Web%20Development">Web Development</a><a href="courses.html?category=Programming">Programming</a>
            <a href="courses.html?category=UI%20and%20UX%20Design">UI and UX Design</a><a href="courses.html?category=Data%20Science">Data Science</a>
          </div>
          <div class="footer-col"><h4>Support</h4>
            <a href="contact.html">Help Centre</a><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms and Conditions</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} stdy.io. All rights reserved.</span>
          <div class="links"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms and Conditions</a></div>
        </div>
      </div>`;
  }

  function initScrollTop() {
    const btn = document.createElement('button');
    btn.className = 'scroll-top-btn'; btn.setAttribute('aria-label', 'Scroll to top');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6"/></svg>`;
    document.body.appendChild(btn);
    window.addEventListener('scroll', debounce(() => btn.classList.toggle('show', window.scrollY > 500), 100));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function protectRoleUrls() {
    // Prevent students from opening instructor/admin pages by editing the URL.
    const page = location.pathname.split('/').pop();
    if (page === 'instructor-dashboard.html') requireRole(['instructor']);
    if (page === 'admin-dashboard.html') requireRole(['admin']);
    if (['dashboard.html','learning.html','profile.html','certificates.html','transcript.html'].includes(page)) requireAuthentication();
  }

  function init(activeKey) {
    activePageKey = activeKey;
    initDatabase();
    initTheme();
    protectRoleUrls();
    renderHeader(activeKey);
    renderFooter();
    initScrollTop();
    if (window.NotificationsUI) window.NotificationsUI.mount();
  }

  function refreshShell() {
    renderHeader(activePageKey);
    renderFooter();
    if (window.NotificationsUI) window.NotificationsUI.mount();
  }

  return { init, refreshShell, toggleTheme, closeMobileDrawer };
})();
