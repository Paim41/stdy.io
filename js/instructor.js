/* ==========================================================================
   stdy.io — instructor.js
   Instructor dashboard: course management (create/edit modules, lessons,
   quizzes), student progress, announcements, and discussion answers.
   ========================================================================== */

function initInstructorDashboardPage() {
  const user = requireRole('instructor');
  if (!user) return;
  document.getElementById('instructorName').textContent = user.name.split(' ')[0];
  renderInstructorOverview(user);
  document.getElementById('newCourseBtn')?.addEventListener('click', () => openCourseEditor(user));
}

function myCourses(user) { return getData('stdyio_courses', []).filter(c => c.instructorId === user.id); }

function renderInstructorOverview(user) {
  const courses = myCourses(user);
  const enrollments = getData('stdyio_enrollments', []);
  const progresses = getData('stdyio_progress', []);
  const myEnrollments = enrollments.filter(e => courses.some(c => c.id === e.courseId));
  const relatedProgress = progresses.filter(p => courses.some(c => c.id === p.courseId));
  const avgProgress = relatedProgress.length ? Math.round(relatedProgress.reduce((s, p) => {
    const c = courses.find(c => c.id === p.courseId);
    const total = c.modules.reduce((a, m) => a + m.lessons.length, 0);
    return s + (total ? (p.completedLessons.length / total) * 100 : 0);
  }, 0) / relatedProgress.length) : 0;
  const completionRate = relatedProgress.length ? Math.round((relatedProgress.filter(p => p.status === 'completed').length / relatedProgress.length) * 100) : 0;

  document.getElementById('instructorStats').innerHTML = [
    ['My Courses', courses.length, Icons.book],
    ['Total Students', myEnrollments.length, Icons.users],
    ['Avg Progress', avgProgress + '%', Icons.progress],
    ['Completion Rate', completionRate + '%', Icons.certificate],
  ].map(([l,v,i]) => `<div class="stat-card"><div class="label">${i}${l}</div><div class="value">${v}</div></div>`).join('');

  const listMount = document.getElementById('instructorCourseList');
  listMount.innerHTML = courses.length ? courses.map(c => {
    const enrolled = enrollments.filter(e => e.courseId === c.id).length;
    return `<div class="enrolled-item">
      <div class="enrolled-thumb">${getCourseThumbnail(c)}</div>
      <div class="enrolled-info"><h4 class="truncate">${escapeHtml(c.title)}</h4>
        <div class="sub">${enrolled} students • ${c.published === false ? 'Unpublished' : 'Published'} • ${c.priceType === 'free' ? 'Free' : formatCurrency(c.price)}</div></div>
      <button class="btn btn-secondary btn-sm" data-edit-course="${c.id}">${Icons.edit} Edit</button>
      <button class="btn btn-ghost btn-sm" data-view-students="${c.id}">${Icons.users} Students</button>
    </div>`;
  }).join('') : `<p class="muted">You have not created any courses yet.</p>`;
  listMount.querySelectorAll('[data-edit-course]').forEach(b => b.addEventListener('click', () => openCourseEditor(user, courses.find(c => c.id === b.dataset.editCourse))));
  listMount.querySelectorAll('[data-view-students]').forEach(b => b.addEventListener('click', () => renderStudentProgressPanel(b.dataset.viewStudents)));

  // Recent activity
  const activityMount = document.getElementById('instructorActivity');
  const recentProgress = [...relatedProgress].sort((a, b) => new Date(b.lastAccessedAt || 0) - new Date(a.lastAccessedAt || 0)).slice(0, 6);
  activityMount.innerHTML = recentProgress.length ? recentProgress.map(p => {
    const student = findUserById(p.userId); const course = courses.find(c => c.id === p.courseId);
    return `<div class="flex items-center gap-3" style="padding:10px 0; border-bottom:1px solid var(--border);">
      <div class="avatar-badge" style="width:34px;height:34px;">${getAvatarImage(student)}</div>
      <div style="flex:1;"><p style="font-size:0.85rem;"><b>${escapeHtml(student?.name||'Student')}</b> is progressing through ${escapeHtml(course?.title||'')}</p>
      <span class="muted" style="font-size:0.75rem;">${p.lastAccessedAt ? timeAgo(p.lastAccessedAt) : 'Not started'}</span></div></div>`;
  }).join('') : `<p class="muted">No recent student activity yet.</p>`;

  // Discussions on instructor's courses
  const discussMount = document.getElementById('instructorDiscussions');
  const threads = getData('stdyio_threads', []).filter(t => courses.some(c => c.id === t.courseId));
  discussMount.innerHTML = threads.length ? threads.slice(0, 6).map(t => `
    <a href="forum.html?thread=${t.id}" class="thread-card" style="display:block; padding:14px;">
      <b>${escapeHtml(t.title)}</b><div class="muted" style="font-size:0.78rem; margin-top:4px;">${escapeHtml(courses.find(c=>c.id===t.courseId)?.title||'')} • ${timeAgo(t.updatedAt)}</div>
    </a>`).join('') : `<p class="muted">No discussions on your courses yet.</p>`;

  // Announcement composer
  const annForm = document.getElementById('announcementForm');
  if (annForm) {
    const select = document.getElementById('announceCourseSelect');
    select.innerHTML = courses.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
    annForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const courseId = select.value;
      const message = document.getElementById('announceMessage').value.trim();
      if (!message) { showToast('Write an announcement message first.', 'error'); return; }
      const threads = getData('stdyio_threads', []);
      const course = courses.find(c => c.id === courseId);
      const thread = { id: generateId('th'), title: `Announcement: ${course.title}`, content: message, courseId,
        category: 'Announcements', authorId: user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        status: 'open', pinned: true, locked: false };
      threads.unshift(thread);
      saveData('stdyio_threads', threads);
      getData('stdyio_enrollments', []).filter(e => e.courseId === courseId).forEach(e => addNotification(e.userId, 'New announcement', `${course.title}: ${truncateText(message, 60)}`, 'announcement'));
      document.getElementById('announceMessage').value = '';
      showToast('Announcement posted to course discussions.', 'success');
      renderInstructorOverview(user);
    });
  }
}

function renderStudentProgressPanel(courseId) {
  const course = getData('stdyio_courses', []).find(c => c.id === courseId);
  const enrollments = getData('stdyio_enrollments', []).filter(e => e.courseId === courseId);
  const progresses = getData('stdyio_progress', []);
  const rows = enrollments.map(e => {
    const student = findUserById(e.userId);
    const progress = progresses.find(p => p.userId === e.userId && p.courseId === courseId);
    const total = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const pct = progress ? Math.round((progress.completedLessons.length / total) * 100) : 0;
    const scores = progress ? Object.values(progress.bestScore || {}) : [];
    return { student, pct, best: scores.length ? Math.max(...scores) : null, status: progress?.status || 'not-started' };
  });
  openModal(`<div class="modal-head"><h3>${escapeHtml(course.title)} — Students</h3><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
    <div class="table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Progress</th><th>Best Quiz Score</th><th>Status</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${escapeHtml(r.student?.name||'Unknown')}</td><td>${r.pct}%</td><td>${r.best!==null?r.best+'%':'—'}</td><td style="text-transform:capitalize;">${r.status.replace('-',' ')}</td></tr>`).join('') || '<tr><td colspan="4">No students enrolled yet.</td></tr>'}
    </tbody></table></div>`);
}

/* ---------------- Course editor (create / edit) ---------------- */
function openCourseEditor(user, course = null) {
  const isNew = !course;
  const draft = course ? JSON.parse(JSON.stringify(course)) : {
    id: generateId('crs'), slug: '', title: '', category: 'Web Development', description: '', longDescription: '',
    instructorId: user.id, difficulty: 'Beginner', duration: 4, rating: 5, reviewCount: 0, studentCount: 0,
    language: 'English', priceType: 'free', price: 0, featured: false, published: true, createdAt: new Date().toISOString(),
    learningOutcomes: [], requirements: [], targetAudience: [],
    modules: [{ id: generateId('m'), title: 'Module 1', lessons: [] }],
    quiz: { passingScore: 70, questions: [] },
  };

  const { overlay, close } = openModal(`
    <div class="modal-head"><h3>${isNew ? 'Add New Course' : 'Edit Course'}</h3><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
    <div style="max-height:64vh; overflow-y:auto; padding-right:4px;">
      <form id="courseForm">
        <div class="form-row">
          <div class="form-group"><label for="ceTitle">Course Title</label><input class="input" id="ceTitle" value="${escapeHtml(draft.title)}" required><span class="form-error"></span></div>
          <div class="form-group"><label for="ceCategory">Category</label><select class="input" id="ceCategory">
            ${['Web Development','Mobile Development','Programming','UI and UX Design','Data Science','Cybersecurity','Cloud Computing','Digital Marketing'].map(c => `<option ${draft.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
        </div>
        <div class="form-group"><label for="ceDesc">Short Description</label><textarea class="input" id="ceDesc" rows="2" required>${escapeHtml(draft.description)}</textarea><span class="form-error"></span></div>
        <div class="form-row">
          <div class="form-group"><label for="ceDifficulty">Difficulty</label><select class="input" id="ceDifficulty">${['Beginner','Intermediate','Advanced'].map(d=>`<option ${draft.difficulty===d?'selected':''}>${d}</option>`).join('')}</select></div>
          <div class="form-group"><label for="ceDuration">Duration (hours)</label><input class="input" id="ceDuration" type="number" min="1" value="${draft.duration}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label for="cePriceType">Price Type</label><select class="input" id="cePriceType"><option value="free" ${draft.priceType==='free'?'selected':''}>Free</option><option value="paid" ${draft.priceType==='paid'?'selected':''}>Paid</option></select></div>
          <div class="form-group"><label for="cePrice">Price (RM)</label><input class="input" id="cePrice" type="number" min="0" step="0.01" value="${draft.price}"></div>
        </div>
        <div class="form-group"><label for="ceOutcomes">Learning Outcomes (one per line)</label><textarea class="input" id="ceOutcomes" rows="3">${draft.learningOutcomes.join('\n')}</textarea></div>
        <div class="form-group"><label for="ceRequirements">Requirements (one per line)</label><textarea class="input" id="ceRequirements" rows="2">${draft.requirements.join('\n')}</textarea></div>
        <div class="form-group"><label for="ceAudience">Target Audience (one per line)</label><textarea class="input" id="ceAudience" rows="2">${draft.targetAudience.join('\n')}</textarea></div>
        <label class="checkbox-row"><input type="checkbox" id="cePublished" ${draft.published !== false ? 'checked' : ''}> Published (visible in catalog)</label>

        <div class="divider"></div>
        <div class="flex justify-between items-center"><h4>Modules & Lessons</h4><button type="button" class="btn btn-secondary btn-sm" id="addModuleBtn">+ Add Module</button></div>
        <div id="moduleBuilder" class="mt-3"></div>
        <div class="modal-actions"><button type="button" class="btn btn-secondary" data-close-modal>Cancel</button><button type="submit" class="btn btn-primary">${isNew ? 'Create Course' : 'Save Changes'}</button></div>
      </form>
    </div>`, {
    onOpen: (overlay) => {
      renderModuleBuilder(overlay, draft);
      overlay.querySelector('#addModuleBtn').addEventListener('click', () => {
        draft.modules.push({ id: generateId('m'), title: `Module ${draft.modules.length + 1}`, lessons: [] });
        renderModuleBuilder(overlay, draft);
      });
      overlay.querySelector('#courseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        clearFieldError('ceTitle'); clearFieldError('ceDesc');
        const title = overlay.querySelector('#ceTitle').value.trim();
        const description = overlay.querySelector('#ceDesc').value.trim();
        let valid = true;
        if (!title) { setFieldError('ceTitle', 'Course title is required.'); valid = false; }
        if (!description) { setFieldError('ceDesc', 'Description is required.'); valid = false; }
        const price = Number(overlay.querySelector('#cePrice').value);
        const priceErr = Validate.price(price);
        if (priceErr) { showToast(priceErr, 'error'); valid = false; }
        if (!valid) return;

        draft.title = title; draft.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        draft.category = overlay.querySelector('#ceCategory').value;
        draft.description = description; draft.longDescription = draft.longDescription || description;
        draft.difficulty = overlay.querySelector('#ceDifficulty').value;
        draft.duration = Number(overlay.querySelector('#ceDuration').value) || 1;
        draft.priceType = overlay.querySelector('#cePriceType').value;
        draft.price = draft.priceType === 'free' ? 0 : price;
        draft.learningOutcomes = overlay.querySelector('#ceOutcomes').value.split('\n').map(s => s.trim()).filter(Boolean);
        draft.requirements = overlay.querySelector('#ceRequirements').value.split('\n').map(s => s.trim()).filter(Boolean);
        draft.targetAudience = overlay.querySelector('#ceAudience').value.split('\n').map(s => s.trim()).filter(Boolean);
        draft.published = overlay.querySelector('#cePublished').checked;

        const courses = getData('stdyio_courses', []);
        if (isNew) courses.push(draft);
        else { const idx = courses.findIndex(c => c.id === draft.id); courses[idx] = draft; }
        saveData('stdyio_courses', courses);
        showToast(isNew ? 'Course created.' : 'Course updated.', 'success');
        close();
        renderInstructorOverview(user);
      });
    }
  });
}

function renderModuleBuilder(overlay, draft) {
  const wrap = overlay.querySelector('#moduleBuilder');
  wrap.innerHTML = draft.modules.map((m, mi) => `
    <div class="panel mb-3" style="background:var(--bg);">
      <div class="flex gap-2 items-center">
        <input class="input" data-module-title="${m.id}" value="${escapeHtml(m.title)}" style="flex:1;">
        <button type="button" class="icon-btn" data-remove-module="${m.id}" aria-label="Remove module">${Icons.trash}</button>
      </div>
      <div class="mt-3" id="lessons-${m.id}">
        ${m.lessons.map(l => `<div class="lesson-row">
          ${lessonTypeIcon(l.type)}<input class="input" data-lesson-title="${m.id}:${l.id}" value="${escapeHtml(l.title)}" style="flex:1; min-height:36px;">
          <select class="input" data-lesson-type="${m.id}:${l.id}" style="max-width:120px; min-height:36px;">${['video','reading','code','download','quiz','assignment'].map(t=>`<option ${l.type===t?'selected':''}>${t}</option>`).join('')}</select>
          <input class="input" type="number" min="1" data-lesson-duration="${m.id}:${l.id}" value="${l.duration}" style="max-width:70px; min-height:36px;">
          <label style="font-size:0.75rem; display:flex; align-items:center; gap:4px;"><input type="checkbox" data-lesson-preview="${m.id}:${l.id}" ${l.preview?'checked':''}> Preview</label>
          <button type="button" class="icon-btn" data-remove-lesson="${m.id}:${l.id}" aria-label="Remove lesson">${Icons.trash}</button>
        </div>`).join('')}
      </div>
      <button type="button" class="btn btn-ghost btn-sm mt-2" data-add-lesson="${m.id}">+ Add Lesson</button>
    </div>`).join('');

  wrap.querySelectorAll('[data-module-title]').forEach(inp => inp.addEventListener('input', () => {
    draft.modules.find(m => m.id === inp.dataset.moduleTitle).title = inp.value;
  }));
  wrap.querySelectorAll('[data-remove-module]').forEach(b => b.addEventListener('click', () => {
    draft.modules = draft.modules.filter(m => m.id !== b.dataset.removeModule);
    renderModuleBuilder(overlay, draft);
  }));
  wrap.querySelectorAll('[data-add-lesson]').forEach(b => b.addEventListener('click', () => {
    const m = draft.modules.find(m => m.id === b.dataset.addLesson);
    m.lessons.push({ id: generateId('l'), title: 'New Lesson', type: 'video', duration: 10, preview: false });
    renderModuleBuilder(overlay, draft);
  }));
  wrap.querySelectorAll('[data-remove-lesson]').forEach(b => b.addEventListener('click', () => {
    const [mid, lid] = b.dataset.removeLesson.split(':');
    const m = draft.modules.find(m => m.id === mid);
    m.lessons = m.lessons.filter(l => l.id !== lid);
    renderModuleBuilder(overlay, draft);
  }));
  wrap.querySelectorAll('[data-lesson-title]').forEach(inp => inp.addEventListener('input', () => {
    const [mid, lid] = inp.dataset.lessonTitle.split(':');
    draft.modules.find(m => m.id === mid).lessons.find(l => l.id === lid).title = inp.value;
  }));
  wrap.querySelectorAll('[data-lesson-type]').forEach(sel => sel.addEventListener('change', () => {
    const [mid, lid] = sel.dataset.lessonType.split(':');
    draft.modules.find(m => m.id === mid).lessons.find(l => l.id === lid).type = sel.value;
  }));
  wrap.querySelectorAll('[data-lesson-duration]').forEach(inp => inp.addEventListener('input', () => {
    const [mid, lid] = inp.dataset.lessonDuration.split(':');
    draft.modules.find(m => m.id === mid).lessons.find(l => l.id === lid).duration = Number(inp.value) || 1;
  }));
  wrap.querySelectorAll('[data-lesson-preview]').forEach(chk => chk.addEventListener('change', () => {
    const [mid, lid] = chk.dataset.lessonPreview.split(':');
    draft.modules.find(m => m.id === mid).lessons.find(l => l.id === lid).preview = chk.checked;
  }));
}
