/* ==========================================================================
   stdy.io — courses.js
   Course card rendering, homepage sections, the course catalog (search /
   filter / sort / pagination / grid-list), and the course details page.
   ========================================================================== */

const CATEGORY_ICONS = {
  'Web Development': Icons.code, 'Mobile Development': Icons.puzzle, 'Programming': Icons.code,
  'UI and UX Design': Icons.bulb, 'Data Science': Icons.chart, 'Cybersecurity': Icons.shield,
  'Cloud Computing': Icons.globe, 'Digital Marketing': Icons.megaphone,
};
const CATEGORY_COLORS = {
  'Web Development': ['#045E45','#18B980'], 'Programming': ['#0A7053','#63DDB0'],
  'UI and UX Design': ['#185C49','#8DE9C4'], 'Data Science': ['#063B2E','#11A875'],
  'Cybersecurity': ['#021A12','#0B805B'], 'Cloud Computing': ['#0A7053','#A0F2D1'],
  'Digital Marketing': ['#124E3E','#4DD6A4'], 'Mobile Development': ['#075A43','#22C58A'],
};

// Replace this URL later with the preferred course-preview video.
const DEMO_LESSON_PREVIEW_URL = 'https://www.youtube-nocookie.com/embed/UB1O30fR-EE?rel=0';

function getCourseThumbnailSVG(category) {
  const [c1, c2] = CATEGORY_COLORS[category] || ['#045E45', '#18B980'];
  const icon = (CATEGORY_ICONS[category] || Icons.book).replace('currentColor', '#fff');
  const gid = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(category)} course thumbnail">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="320" y2="180"><stop stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="320" height="180" fill="url(#${gid})"/>
    <circle cx="270" cy="30" r="70" fill="rgba(255,255,255,0.08)"/>
    <circle cx="30" cy="160" r="50" fill="rgba(255,255,255,0.07)"/>
    <g transform="translate(136,66) scale(2)">${icon}</g>
  </svg>`;
}

function getBookmarks() {
  const user = getCurrentUser();
  if (!user) return [];
  return getData(`stdyio_bookmarks_${user.id}`, []);
}
function toggleBookmark(courseId) {
  const user = getCurrentUser();
  if (!user) { showToast('Log in to bookmark courses.', 'info'); return false; }
  const key = `stdyio_bookmarks_${user.id}`;
  let list = getData(key, []);
  const has = list.includes(courseId);
  list = has ? list.filter(id => id !== courseId) : [...list, courseId];
  saveData(key, list);
  return !has;
}

function addRecentlyViewed(courseId) {
  let list = getData('stdyio_recently_viewed', []);
  list = [courseId, ...list.filter(id => id !== courseId)].slice(0, 6);
  saveData('stdyio_recently_viewed', list);
}

function getInstructor(id) { return findUserById(id); }

function courseCardHtml(course, { listView = false } = {}) {
  const instructor = getInstructor(course.instructorId);
  const bookmarked = getBookmarks().includes(course.id);
  const priceHtml = course.priceType === 'free'
    ? `<span class="badge-price free">Free</span>`
    : `<span class="badge-price paid">${formatCurrency(course.price)}</span>`;
  return `<article class="course-card ${listView ? 'course-card-list' : ''}" data-course-id="${course.id}" data-course-link="course-details.html?id=${course.id}" tabindex="0" aria-label="View ${escapeHtml(course.title)}">
    <div class="course-thumb">
      ${getCourseThumbnailSVG(course.category)}
      ${priceHtml}
      <button class="bookmark-btn ${bookmarked ? 'active' : ''}" data-bookmark="${course.id}" aria-label="${bookmarked ? 'Remove bookmark' : 'Bookmark this course'}">
        ${bookmarked ? Icons.bookmark.replace('fill="none"','fill="currentColor"') : Icons.bookmark}
      </button>
    </div>
    <div class="course-body">
      <span class="course-cat">${escapeHtml(course.category)}</span>
      <h3><a href="course-details.html?id=${course.id}">${escapeHtml(course.title)}</a></h3>
      <p class="course-desc">${escapeHtml(truncateText(course.description, 90))}</p>
      <div class="course-meta">
        <span>${Icons.clock}${course.duration}h</span>
        <span>${Icons.book}${course.difficulty}</span>
        <span>${Icons.user}${course.studentCount.toLocaleString()} students</span>
      </div>
      <div class="course-foot">
        <span class="course-instructor">${instructor ? escapeHtml(instructor.name) : 'stdy.io Instructor'}</span>
        <span class="course-rating">${Icons.star}${course.rating.toFixed(1)}</span>
      </div>
      <div class="course-card-action"><span>View course</span>${Icons.arrowRight}</div>
    </div>
  </article>`;
}

function attachCourseCardEvents(root = document) {
  root.querySelectorAll('[data-course-link]').forEach(card => {
    const openCourse = () => { location.href = card.dataset.courseLink; };
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, select, textarea')) return;
      openCourse();
    });
    card.addEventListener('keydown', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('a, button, input, select, textarea')) {
        event.preventDefault();
        openCourse();
      }
    });
  });
  root.querySelectorAll('[data-bookmark]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      const id = btn.dataset.bookmark;
      const nowActive = toggleBookmark(id);
      btn.classList.toggle('active', nowActive);
      btn.classList.add('pop');
      btn.innerHTML = nowActive ? Icons.bookmark.replace('fill="none"','fill="currentColor"') : Icons.bookmark;
      setTimeout(() => btn.classList.remove('pop'), 400);
      showToast(nowActive ? 'Course saved to your bookmarks.' : 'Removed from bookmarks.', 'success');
    });
  });
}

function skeletonCards(n = 6) {
  return Array.from({ length: n }).map(() => `
    <div class="course-card">
      <div class="skeleton" style="aspect-ratio:16/9;"></div>
      <div class="course-body">
        <div class="skeleton" style="height:12px; width:40%;"></div>
        <div class="skeleton" style="height:18px; width:80%;"></div>
        <div class="skeleton" style="height:12px; width:100%;"></div>
        <div class="skeleton" style="height:12px; width:60%;"></div>
      </div>
    </div>`).join('');
}

/* ============================================================
   HOMEPAGE
   ============================================================ */
function initHomePage() {
  const user = getCurrentUser();
  const courses = getData('stdyio_courses', []);

  // Hero search
  const heroForm = document.getElementById('heroSearchForm');
  if (heroForm) heroForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('heroSearchInput').value.trim();
    location.href = `courses.html?q=${encodeURIComponent(q)}`;
  });
  document.getElementById('heroStartLearning')?.addEventListener('click', () => {
    location.href = user ? 'dashboard.html' : 'register.html';
  });

  // Category chips
  const catMount = document.getElementById('categoryChips');
  if (catMount) {
    const cats = ['Web Development','Programming','UI and UX Design','Data Science','Cybersecurity','Digital Marketing'];
    catMount.innerHTML = cats.map(c => `<a href="courses.html?category=${encodeURIComponent(c)}" class="category-chip">${CATEGORY_ICONS[c] || Icons.book}${c}</a>`).join('');
  }

  // Featured courses
  const featMount = document.getElementById('featuredCourses');
  if (featMount) {
    featMount.innerHTML = skeletonCards(6);
    setTimeout(() => {
      const featured = courses.filter(c => c.featured).slice(0, 6);
      featMount.innerHTML = featured.map(c => courseCardHtml(c)).join('');
      featMount.classList.add('stagger');
      attachCourseCardEvents(featMount);
    }, 350);
  }

  // Instructors
  const instrMount = document.getElementById('topInstructors');
  if (instrMount) {
    const instructors = getData('stdyio_users', []).filter(u => u.role === 'instructor');
    instrMount.innerHTML = instructors.slice(0, 4).map(instructorCardHtml).join('');
  }

  // Testimonials
  initTestimonialSlider();

  // CTA
  document.getElementById('ctaCreateAccount')?.addEventListener('click', () => location.href = user ? 'courses.html' : 'register.html');
}

function instructorCardHtml(instructor) {
  const courses = getData('stdyio_courses', []).filter(c => c.instructorId === instructor.id);
  const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);
  const avgRating = courses.length ? (courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1) : '5.0';
  return `<div class="instructor-card">
    <div class="instructor-avatar avatar-badge" style="width:84px;height:84px;font-size:1.6rem;">${getInitials(instructor.name)}</div>
    <h3>${escapeHtml(instructor.name)}</h3>
    <p class="instructor-title">${escapeHtml(instructor.title || 'Instructor')}</p>
    <div class="instructor-stats">
      <span>${Icons.star} ${avgRating}</span><span>${Icons.book} ${courses.length} courses</span><span>${Icons.user} ${totalStudents.toLocaleString()}</span>
    </div>
    <a href="courses.html?instructor=${instructor.id}" class="btn btn-secondary btn-sm w-full">View Profile</a>
  </div>`;
}

function initTestimonialSlider() {
  const slider = document.getElementById('testimonialSlider');
  if (!slider) return;
  const items = getData('stdyio_testimonials', []);
  let index = 0, timer = null;
  const track = slider.querySelector('.testimonial-track');
  const dotsWrap = slider.querySelector('.testimonial-dots');

  function render() {
    const t = items[index];
    track.innerHTML = `<div class="testimonial-slide animate-fade">
      <div class="flex justify-between items-center" style="justify-content:center; gap:4px;">${Array.from({length:5}).map((_,i)=> i < t.rating ? Icons.star : Icons.starOutline).join('')}</div>
      <p>“${escapeHtml(t.text)}”</p>
      <div class="avatar-badge" style="margin:0 auto 8px;">${getInitials(t.name)}</div>
      <strong>${escapeHtml(t.name)}</strong><div class="muted" style="font-size:0.82rem;">Completed ${escapeHtml(t.course)}</div>
    </div>`;
    dotsWrap.innerHTML = items.map((_, i) => `<button class="dot ${i === index ? 'active' : ''}" data-i="${i}" aria-label="Testimonial ${i+1}"></button>`).join('');
    dotsWrap.querySelectorAll('[data-i]').forEach(d => d.addEventListener('click', () => { index = +d.dataset.i; render(); restart(); }));
  }
  function next() { index = (index + 1) % items.length; render(); }
  function prev() { index = (index - 1 + items.length) % items.length; render(); }
  function restart() { clearInterval(timer); timer = setInterval(next, 5000); }

  slider.querySelector('.ts-prev')?.addEventListener('click', () => { prev(); restart(); });
  slider.querySelector('.ts-next')?.addEventListener('click', () => { next(); restart(); });
  slider.addEventListener('mouseenter', () => clearInterval(timer));
  slider.addEventListener('mouseleave', restart);
  slider.addEventListener('focusin', () => clearInterval(timer));
  slider.addEventListener('focusout', restart);
  render(); restart();
}

/* ============================================================
   COURSE CATALOG
   ============================================================ */
function initCoursesPage() {
  const params = new URLSearchParams(location.search);
  const state = {
    q: params.get('q') || '',
    category: params.get('category') ? [params.get('category')] : [],
    difficulty: [], instructor: params.get('instructor') ? [params.get('instructor')] : [],
    priceType: [], minRating: 0, sort: 'popularity', view: 'grid', page: 1,
  };
  const perPage = 9;
  const allCourses = getData('stdyio_courses', []);
  const instructors = getData('stdyio_users', []).filter(u => u.role === 'instructor');
  const grid = document.getElementById('courseGrid');
  const resultCount = document.getElementById('resultCount');
  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) searchInput.value = state.q;

  function saveSearchHistory(q) {
    if (!q) return;
    let hist = getData('stdyio_search_history', []);
    hist = [q, ...hist.filter(h => h.toLowerCase() !== q.toLowerCase())].slice(0, 8);
    saveData('stdyio_search_history', hist);
  }

  function applyFilters() {
    let list = allCourses.filter(c => {
      if (state.q && !`${c.title} ${c.description}`.toLowerCase().includes(state.q.toLowerCase())) return false;
      if (state.category.length && !state.category.includes(c.category)) return false;
      if (state.difficulty.length && !state.difficulty.includes(c.difficulty)) return false;
      if (state.instructor.length && !state.instructor.includes(c.instructorId)) return false;
      if (state.priceType.length && !state.priceType.includes(c.priceType)) return false;
      if (state.minRating && c.rating < state.minRating) return false;
      return true;
    });
    switch (state.sort) {
      case 'rating': list.sort((a,b) => b.rating - a.rating); break;
      case 'newest': list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'price-low': list.sort((a,b) => a.price - b.price); break;
      case 'price-high': list.sort((a,b) => b.price - a.price); break;
      default: list.sort((a,b) => b.studentCount - a.studentCount);
    }
    return list;
  }

  function renderChips() {
    const wrap = document.getElementById('activeFilterChips');
    if (!wrap) return;
    const chips = [];
    state.category.forEach(v => chips.push(['category', v]));
    state.difficulty.forEach(v => chips.push(['difficulty', v]));
    state.priceType.forEach(v => chips.push(['priceType', v]));
    if (state.minRating) chips.push(['minRating', state.minRating + '+ stars']);
    wrap.innerHTML = chips.map(([type, val]) => `
      <span class="chip chip-primary remove-chip">${escapeHtml(val)} <button data-remove="${type}" data-val="${escapeHtml(val)}" aria-label="Remove filter">${Icons.close}</button></span>`).join('');
    wrap.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      const type = b.dataset.remove;
      if (type === 'minRating') state.minRating = 0;
      else state[type] = state[type].filter(v => v !== b.dataset.val);
      state.page = 1; syncCheckboxes(); render();
    }));
  }

  function syncCheckboxes() {
    document.querySelectorAll('[data-filter-group]').forEach(box => {
      const group = box.dataset.filterGroup, val = box.dataset.value;
      box.checked = state[group]?.includes(val);
    });
  }

  function render() {
    const filtered = applyFilters();
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    state.page = Math.min(state.page, totalPages);
    const pageItems = filtered.slice((state.page - 1) * perPage, state.page * perPage);
    if (resultCount) resultCount.textContent = `${filtered.length} course${filtered.length === 1 ? '' : 's'} found`;
    grid.className = state.view === 'list' ? 'grid grid-2' : 'grid grid-courses';
    if (!pageItems.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path stroke-linecap="round" d="M21 21l-4.3-4.3M8 11h6"/></svg>
        <h3>No courses match your search</h3><p>Try removing a filter or searching a different keyword.</p>
        <button class="btn btn-primary" id="clearAllBtn">Clear All Filters</button></div>`;
      document.getElementById('clearAllBtn')?.addEventListener('click', clearAll);
    } else {
      grid.innerHTML = pageItems.map(c => courseCardHtml(c, { listView: state.view === 'list' })).join('');
      attachCourseCardEvents(grid);
    }
    renderChips();
    renderPagination(totalPages);
    history_update();
  }

  function renderPagination(totalPages) {
    const wrap = document.getElementById('catalogPagination');
    if (!wrap) return;
    if (totalPages <= 1) { wrap.innerHTML = ''; return; }
    let html = `<button ${state.page===1?'disabled':''} data-page="${state.page-1}" aria-label="Previous page">${Icons.prev}</button>`;
    for (let i = 1; i <= totalPages; i++) html += `<button class="${i===state.page?'active':''}" data-page="${i}">${i}</button>`;
    html += `<button ${state.page===totalPages?'disabled':''} data-page="${state.page+1}" aria-label="Next page">${Icons.next}</button>`;
    wrap.innerHTML = html;
    wrap.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => { state.page = +b.dataset.page; render(); window.scrollTo({top:0, behavior:'smooth'}); }));
  }

  function clearAll() {
    state.category = []; state.difficulty = []; state.instructor = []; state.priceType = []; state.minRating = 0; state.q = '';
    if (searchInput) searchInput.value = '';
    state.page = 1; syncCheckboxes(); render();
  }
  function history_update() {
    const url = new URL(location.href); url.search = ''; history.replaceState(null, '', url.pathname);
  }

  // Build filter panel(s) — desktop sidebar + mobile bottom sheet share the same markup via template
  function buildFilterMarkup() {
    const categories = ['Web Development','Mobile Development','Programming','UI and UX Design','Data Science','Cybersecurity','Cloud Computing','Digital Marketing'];
    const difficulties = ['Beginner','Intermediate','Advanced'];
    return `
      <div class="filter-group"><h4>Category</h4>${categories.map(c => `
        <label class="filter-option"><input type="checkbox" data-filter-group="category" data-value="${c}"> ${c}</label>`).join('')}</div>
      <div class="filter-group"><h4>Difficulty</h4>${difficulties.map(d => `
        <label class="filter-option"><input type="checkbox" data-filter-group="difficulty" data-value="${d}"> ${d}</label>`).join('')}</div>
      <div class="filter-group"><h4>Instructor</h4>${instructors.map(i => `
        <label class="filter-option"><input type="checkbox" data-filter-group="instructor" data-value="${i.id}"> ${escapeHtml(i.name)}</label>`).join('')}</div>
      <div class="filter-group"><h4>Price</h4>
        <label class="filter-option"><input type="checkbox" data-filter-group="priceType" data-value="free"> Free</label>
        <label class="filter-option"><input type="checkbox" data-filter-group="priceType" data-value="paid"> Paid</label></div>
      <div class="filter-group"><h4>Minimum Rating</h4>
        ${[4.5,4,3.5].map(r => `<label class="filter-option"><input type="radio" name="minRating" data-min-rating="${r}"> ${r}+ ${Icons.star}</label>`).join('')}
      </div>
      <button class="btn btn-secondary btn-block" id="clearFiltersBtn">Clear All Filters</button>`;
  }

  function bindFilterPanel(root) {
    root.querySelectorAll('[data-filter-group]').forEach(box => box.addEventListener('change', () => {
      const group = box.dataset.filterGroup, val = box.dataset.value;
      state[group] = box.checked ? [...state[group], val] : state[group].filter(v => v !== val);
      state.page = 1; render();
    }));
    root.querySelectorAll('[data-min-rating]').forEach(r => r.addEventListener('change', () => { state.minRating = +r.dataset.minRating; state.page = 1; render(); }));
    root.querySelector('#clearFiltersBtn')?.addEventListener('click', clearAll);
  }

  const desktopPanel = document.getElementById('filterPanel');
  if (desktopPanel) { desktopPanel.innerHTML = buildFilterMarkup(); bindFilterPanel(desktopPanel); }

  const mobileBtn = document.getElementById('mobileFilterBtn');
  if (mobileBtn) mobileBtn.addEventListener('click', () => {
    const sheetHtml = `<div class="bottom-sheet-handle"></div><div class="flex justify-between items-center mb-4"><h3>Filter Courses</h3><button data-close-sheet aria-label="Close">${Icons.close}</button></div><div id="sheetFilterBody"></div>`;
    let sheet = document.querySelector('.bottom-sheet');
    let overlay = document.querySelector('.drawer-overlay.for-sheet');
    if (!sheet) {
      overlay = document.createElement('div'); overlay.className = 'drawer-overlay for-sheet';
      sheet = document.createElement('div'); sheet.className = 'bottom-sheet';
      document.body.append(overlay, sheet);
    }
    sheet.innerHTML = sheetHtml;
    sheet.querySelector('#sheetFilterBody').innerHTML = buildFilterMarkup();
    bindFilterPanel(sheet);
    syncCheckboxes();
    const close = () => { sheet.classList.remove('show'); overlay.classList.remove('show'); document.body.classList.remove('modal-open'); };
    overlay.onclick = close;
    sheet.querySelector('[data-close-sheet]').addEventListener('click', close);
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => { overlay.classList.add('show'); sheet.classList.add('show'); });
  });

  // Toolbar controls
  if (searchInput) searchInput.addEventListener('input', debounce(() => { state.q = searchInput.value.trim(); state.page = 1; saveSearchHistory(state.q); render(); }, 350));
  document.getElementById('sortSelect')?.addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    state.view = b.dataset.view;
    document.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('active', x === b));
    render();
  }));

  syncCheckboxes();
  grid.innerHTML = skeletonCards(9);
  setTimeout(render, 300);
}

/* ============================================================
   COURSE DETAILS PAGE
   ============================================================ */
function initCourseDetailsPage() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const course = getData('stdyio_courses', []).find(c => c.id === id);
  const mount = document.getElementById('courseDetailsMount');
  if (!course) {
    mount.innerHTML = `<div class="empty-state">${Icons.warning}<h3>Course not found</h3><p>The course you are looking for may have been removed or the link is invalid.</p>
      <a href="courses.html" class="btn btn-primary">Back to Courses</a></div>`;
    return;
  }
  addRecentlyViewed(course.id);
  const instructor = getInstructor(course.instructorId);
  const user = getCurrentUser();
  const enrollment = user ? getData('stdyio_enrollments', []).find(e => e.userId === user.id && e.courseId === course.id) : null;
  const bookmarked = getBookmarks().includes(course.id);
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  document.title = `${course.title} — stdy.io`;
  document.getElementById('breadcrumbCourseTitle').textContent = course.title;

  mount.innerHTML = `
    <div class="grid" style="grid-template-columns:minmax(0,2fr) minmax(280px,.7fr); gap:32px; align-items:start;" id="cdLayout">
      <div>
        <span class="chip chip-primary">${escapeHtml(course.category)}</span>
        <h1 class="mt-4">${escapeHtml(course.title)}</h1>
        <p class="mt-4">${escapeHtml(course.description)}</p>
        <div class="course-meta mt-4" style="font-size:0.88rem;">
          <span class="course-rating">${Icons.star}${course.rating.toFixed(1)} (${course.reviewCount} reviews)</span>
          <span>${Icons.user}${course.studentCount.toLocaleString()} students</span>
          <span>${Icons.clock}${course.duration}h total</span>
          <span>${Icons.book}${course.difficulty}</span>
          <span>${Icons.globe}${course.language}</span>
        </div>
        <div class="course-thumb mt-6" style="border-radius:var(--r-lg); aspect-ratio:16/8;">${getCourseThumbnailSVG(course.category)}</div>

        <div class="panel mt-6">
          <h3>What You Will Learn</h3>
          <div class="grid grid-2 mt-4">${course.learningOutcomes.map(o => `<div class="flex gap-2" style="align-items:flex-start;"><span style="color:var(--success); flex-shrink:0;">${Icons.check}</span><span>${escapeHtml(o)}</span></div>`).join('')}</div>
        </div>

        <div class="panel mt-6">
          <h3>Course Curriculum</h3>
          <p class="mt-2" style="font-size:0.85rem;">${course.modules.length} modules • ${totalLessons} lessons • ${course.duration} hours total</p>
          <div class="mt-4" id="curriculumAccordion">${course.modules.map((m, mi) => renderModuleAccordion(m, mi, !!enrollment)).join('')}</div>
        </div>

        <div class="panel mt-6">
          <h3>Requirements</h3>
          <ul class="mt-3" style="list-style:disc; padding-left:20px;">${course.requirements.map(r => `<li style="margin-bottom:6px;">${escapeHtml(r)}</li>`).join('')}</ul>
          <h3 class="mt-6">Who This Course Is For</h3>
          <ul class="mt-3" style="list-style:disc; padding-left:20px;">${course.targetAudience.map(r => `<li style="margin-bottom:6px;">${escapeHtml(r)}</li>`).join('')}</ul>
        </div>

        <div class="panel mt-6">
          <h3>Instructor</h3>
          <div class="flex gap-4 mt-4 items-center">
            <div class="avatar-badge" style="width:64px;height:64px;font-size:1.3rem;">${getInitials(instructor.name)}</div>
            <div><h4>${escapeHtml(instructor.name)}</h4><p style="font-size:0.85rem;">${escapeHtml(instructor.title || '')}</p></div>
          </div>
          <p class="mt-4">${escapeHtml(instructor.bio || '')}</p>
        </div>

        <div class="panel mt-6" id="relatedCoursesPanel">
          <h3>Related Courses</h3>
          <div class="grid grid-courses mt-4" id="relatedCoursesGrid"></div>
        </div>
      </div>

      <div>
        <div class="panel" style="position:sticky; top:calc(var(--header-h) + 16px);">
          <div class="flex justify-between items-center">
            <span style="font-size:1.6rem; font-weight:800;">${course.priceType === 'free' ? 'Free' : formatCurrency(course.price)}</span>
            <button class="bookmark-btn" id="cdBookmarkBtn" style="position:static;" aria-label="Bookmark course">${bookmarked ? Icons.bookmark.replace('fill="none"','fill="currentColor"') : Icons.bookmark}</button>
          </div>
          <div class="mt-4 flex-col gap-3" id="cdActionArea"></div>
          <div class="divider"></div>
          <div class="flex justify-between" style="font-size:0.85rem;"><span class="muted">Lessons</span><b>${totalLessons}</b></div>
          <div class="flex justify-between mt-2" style="font-size:0.85rem;"><span class="muted">Duration</span><b>${course.duration} hours</b></div>
          <div class="flex justify-between mt-2" style="font-size:0.85rem;"><span class="muted">Level</span><b>${course.difficulty}</b></div>
          <div class="flex justify-between mt-2" style="font-size:0.85rem;"><span class="muted">Language</span><b>${course.language}</b></div>
          <button class="btn btn-secondary btn-block mt-4" id="cdShareBtn">Share Course</button>
        </div>
      </div>
    </div>`;

  renderActionArea(course, enrollment, user);
  bindCurriculumAccordion(course, !!enrollment);

  document.getElementById('cdBookmarkBtn').addEventListener('click', () => {
    const nowActive = toggleBookmark(course.id);
    document.getElementById('cdBookmarkBtn').innerHTML = nowActive ? Icons.bookmark.replace('fill="none"','fill="currentColor"') : Icons.bookmark;
    showToast(nowActive ? 'Course saved to your bookmarks.' : 'Removed from bookmarks.', 'success');
  });
  document.getElementById('cdShareBtn').addEventListener('click', async () => {
    const url = location.href;
    if (navigator.share) { try { await navigator.share({ title: course.title, url }); return; } catch (e) {} }
    try { await navigator.clipboard.writeText(url); showToast('Course link copied to clipboard.', 'success'); }
    catch (e) { showToast('Could not copy link. Copy it from the address bar.', 'error'); }
  });

  const related = getData('stdyio_courses', []).filter(c => c.category === course.category && c.id !== course.id).slice(0, 3);
  document.getElementById('relatedCoursesGrid').innerHTML = related.map(c => courseCardHtml(c)).join('');
  attachCourseCardEvents(document.getElementById('relatedCoursesGrid'));
  if (!related.length) document.getElementById('relatedCoursesPanel').classList.add('hidden');
}

function renderActionArea(course, enrollment, user) {
  const area = document.getElementById('cdActionArea');
  if (!area) return;
  if (enrollment) {
    const progress = getData('stdyio_progress', []).find(p => p.userId === user?.id && p.courseId === course.id);
    const hasStarted = progress && progress.completedLessons.length > 0;
    area.innerHTML = `
      <div class="enrollment-confirmed">${Icons.check}<div><b>You're enrolled</b><span>${hasStarted ? 'Pick up where you left off.' : 'Your first lesson is ready.'}</span></div></div>
      <a href="learning.html?courseId=${course.id}" class="btn btn-primary btn-block">${Icons.play}${hasStarted ? 'Continue Learning' : 'Start Course'}</a>
      <a href="dashboard.html" class="btn btn-ghost btn-block btn-sm">View My Learning</a>`;
    return;
  }
  if (course.priceType === 'free') {
    area.innerHTML = `<button class="btn btn-primary btn-block" id="enrollFreeBtn">${Icons.book}Enroll for Free</button>`;
    document.getElementById('enrollFreeBtn').addEventListener('click', () => {
      withLearnerAccess(course, () => openFreeEnrollmentDialog(course));
    });
  } else {
    const activeUser = getCurrentUser();
    const inCart = getData('stdyio_cart', []).some(i => i.userId === (activeUser?.id || '') && i.courseId === course.id);
    area.innerHTML = `
      <button class="btn btn-secondary btn-block" id="cdAddCartBtn">${Icons.cart}${inCart ? 'Added to Cart' : 'Add to Cart'}</button>
      <button class="btn btn-primary btn-block" id="cdBuyNowBtn">${Icons.payment}Buy Now</button>`;
    document.getElementById('cdAddCartBtn').addEventListener('click', () => {
      withLearnerAccess(course, () => {
        addToCart(course.id);
        renderActionArea(course, null, getCurrentUser());
      });
    });
    document.getElementById('cdBuyNowBtn').addEventListener('click', () => {
      withLearnerAccess(course, () => {
        addToCart(course.id);
        location.href = 'checkout.html';
      });
    });
  }
}

function withLearnerAccess(course, onReady) {
  const current = getCurrentUser();
  if (current?.role === 'student') {
    onReady(current);
    return;
  }

  const next = encodeURIComponent(`course-details.html?id=${course.id}`);
  const signedOutCopy = current
    ? 'Switch to the learner demo to try enrollment without changing any real account.'
    : 'Sign in to keep your courses and progress, or use the one-click learner demo.';

  openModal(`
    <div class="modal-head"><div><span class="eyebrow">Learner access</span><h3>Ready to join this course?</h3></div><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
    <div class="enrollment-summary">
      <div class="enrollment-summary-thumb">${getCourseThumbnailSVG(course.category)}</div>
      <div><b>${escapeHtml(course.title)}</b><span>${course.priceType === 'free' ? 'Free course' : formatCurrency(course.price)} · ${course.duration} hours · ${course.difficulty}</span></div>
    </div>
    <p class="mt-4">${signedOutCopy}</p>
    <div class="flex-col gap-3 mt-5">
      <button class="btn btn-primary btn-block" id="continueDemoLearner">${Icons.play}Continue as Demo Learner</button>
      ${current ? '' : `<a class="btn btn-secondary btn-block" href="login.html?next=${next}">Log In</a><a class="btn btn-ghost btn-block" href="register.html?next=${next}">Create an Account</a>`}
    </div>`, {
      onOpen: (overlay, close) => {
        overlay.querySelector('#continueDemoLearner').addEventListener('click', () => {
          const demoLearner = findUserById('usr_student01');
          if (!demoLearner) {
            showToast('The learner demo could not be started. Refresh and try again.', 'error');
            return;
          }
          setCurrentUser(demoLearner.id, false);
          addNotification(demoLearner.id, 'Learner demo started', `You can now explore ${course.title} as Aisyah.`, 'login');
          close();
          if (typeof StdyApp !== 'undefined' && StdyApp.refreshShell) StdyApp.refreshShell();
          onReady(demoLearner);
        });
      },
    });
}

function openFreeEnrollmentDialog(course) {
  openModal(`
    <div class="modal-head"><div><span class="eyebrow">Free enrollment</span><h3>Confirm your course</h3></div><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
    <div class="enrollment-summary">
      <div class="enrollment-summary-thumb">${getCourseThumbnailSVG(course.category)}</div>
      <div><b>${escapeHtml(course.title)}</b><span>${course.modules.length} modules · ${course.duration} hours · Certificate included</span></div>
    </div>
    <ul class="enrollment-checklist mt-4"><li>${Icons.check}Immediate access to every lesson</li><li>${Icons.check}Progress saved in this browser</li><li>${Icons.check}No payment details required</li></ul>
    <div class="modal-actions"><button class="btn btn-ghost" data-close-modal>Not Now</button><button class="btn btn-primary" id="confirmFreeEnrollment">Confirm Enrollment</button></div>`, {
      onOpen: (overlay, close) => {
        const confirmButton = overlay.querySelector('#confirmFreeEnrollment');
        confirmButton.addEventListener('click', withSubmitLock(confirmButton, async () => {
          await new Promise(resolve => setTimeout(resolve, 450));
          if (!enrollInCourse(course.id)) {
            showToast('Enrollment could not be saved. Please try again.', 'error');
            return;
          }
          close();
          initCourseDetailsPage();
          showToast(`You're enrolled in ${course.title}.`, 'success');
        }));
      },
    });
}

function renderModuleAccordion(module, index, unlocked) {
  return `<div class="accordion-item ${index === 0 ? 'open' : ''}">
    <button class="accordion-trigger" data-accordion="${module.id}" aria-expanded="${index === 0}">
      <span>${escapeHtml(module.title)}</span>${Icons.chevDown}
    </button>
    <div class="accordion-panel">
      ${module.lessons.map(l => `
        <div class="lesson-row ${!unlocked && !l.preview ? 'locked' : ''}" data-lesson-preview="${!unlocked && l.preview ? l.id : ''}" data-module="${module.id}">
          ${!unlocked && !l.preview ? Icons.lock : lessonTypeIcon(l.type)}
          <span class="lesson-title">${escapeHtml(l.title)}</span>
          <span class="lesson-meta">${l.preview && !unlocked ? '<span class="chip chip-success">Preview</span>' : ''}${l.duration} min</span>
        </div>`).join('')}
    </div>
  </div>`;
}
function lessonTypeIcon(type) {
  return { video: Icons.play, reading: Icons.book, code: Icons.code, download: Icons.download, quiz: Icons.check, assignment: Icons.fileText }[type] || Icons.book;
}

function bindCurriculumAccordion(course, unlocked) {
  document.querySelectorAll('[data-accordion]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.toggle('open');
      trigger.setAttribute('aria-expanded', isOpen);
    });
  });
  document.querySelectorAll('[data-lesson-preview]').forEach(row => {
    const lessonId = row.dataset.lessonPreview;
    if (!lessonId) return;
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      const module = course.modules.find(m => m.id === row.dataset.module);
      const lesson = module.lessons.find(l => l.id === lessonId);
      openModal(`<div class="modal-head"><h3>Preview: ${escapeHtml(lesson.title)}</h3><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
        <div class="lesson-preview-frame">
          <iframe src="${DEMO_LESSON_PREVIEW_URL}" title="Demo preview for ${escapeHtml(lesson.title)}" loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        <p class="mt-4">This sample video demonstrates the preview experience. Replace the URL in <code>DEMO_LESSON_PREVIEW_URL</code> when the final lesson video is ready.</p>
        <div class="modal-actions"><button class="btn btn-primary" data-close-modal>Close Preview</button></div>`, {
          onOpen: (overlay) => overlay.querySelector('.modal').classList.add('modal-wide'),
        });
    });
  });
}
