/* ==========================================================================
   stdy.io — admin.js
   Administrator dashboard: platform stats, user & course management,
   payments, discussion moderation, testimonials, and demo data reset.
   ========================================================================== */

function initAdminDashboardPage() {
  const user = requireRole('admin');
  if (!user) return;
  document.getElementById('adminName').textContent = user.name.split(' ')[0];

  document.querySelectorAll('.tab-btn[data-admin-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn[data-admin-tab]').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('[data-admin-panel]').forEach(p => p.classList.toggle('hidden', p.dataset.adminPanel !== btn.dataset.adminTab));
    renderAdminTab(btn.dataset.adminTab);
  }));

  renderAdminOverview();
  renderAdminTab('overview');
}

function renderAdminTab(tab) {
  if (tab === 'users') renderAdminUsers();
  else if (tab === 'courses') renderAdminCourses();
  else if (tab === 'payments') renderAdminPayments();
  else if (tab === 'discussions') renderAdminDiscussions();
  else if (tab === 'testimonials') renderAdminTestimonials();
}

function renderAdminOverview() {
  const users = getData('stdyio_users', []);
  const courses = getData('stdyio_courses', []);
  const enrollments = getData('stdyio_enrollments', []);
  const payments = getData('stdyio_payments', []);
  const progresses = getData('stdyio_progress', []);
  const threads = getData('stdyio_threads', []);
  const revenue = payments.reduce((s, p) => s + p.total, 0);

  document.getElementById('adminStats').innerHTML = [
    ['Total Users', users.length, Icons.users],
    ['Students', users.filter(u=>u.role==='student').length, Icons.user],
    ['Instructors', users.filter(u=>u.role==='instructor').length, Icons.book],
    ['Total Courses', courses.length, Icons.courses],
    ['Total Enrollments', enrollments.length, Icons.progress],
    ['Completed Courses', progresses.filter(p=>p.status==='completed').length, Icons.certificate],
    ['Demo Revenue', formatCurrency(revenue), Icons.payment],
    ['Discussion Threads', threads.length, Icons.discussion],
  ].map(([l,v,i]) => `<div class="stat-card"><div class="label">${i}${l}</div><div class="value" style="font-size:1.3rem;">${v}</div></div>`).join('');

  document.getElementById('resetDemoDataBtn')?.addEventListener('click', async () => {
    const ok = await showConfirmationDialog({ title: 'Reset demo data?', message: 'This clears all courses, users, enrollments, forum posts and payments, then recreates the original demo dataset. This cannot be undone.', confirmText: 'Reset Everything', danger: true });
    if (!ok) return;
    ['stdyio_users','stdyio_courses','stdyio_enrollments','stdyio_progress','stdyio_cart','stdyio_payments',
      'stdyio_receipts','stdyio_threads','stdyio_replies','stdyio_votes','stdyio_notifications','stdyio_certificates',
      'stdyio_testimonials','stdyio_reports','stdyio_seed_version'].forEach(removeData);
    clearCurrentUser();
    showToast('Demo data reset. Redirecting to homepage…', 'success');
    setTimeout(() => location.href = 'index.html', 900);
  });
}

function renderAdminUsers() {
  const mount = document.getElementById('adminUsersMount');
  let roleFilter = 'all', q = '';
  function render() {
    let users = getData('stdyio_users', []);
    if (roleFilter !== 'all') users = users.filter(u => u.role === roleFilter);
    if (q) users = users.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));
    mount.innerHTML = `
      <div class="catalog-toolbar">
        <div class="hero-search" style="max-width:320px;">${Icons.search}<input id="adminUserSearch" placeholder="Search name or email" value="${escapeHtml(q)}"></div>
        <select class="input" id="adminRoleFilter" style="max-width:180px;">
          <option value="all">All Roles</option><option value="student">Students</option><option value="instructor">Instructors</option><option value="admin">Administrators</option></select>
      </div>
      <div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
        ${users.map(u => `<tr>
          <td>${escapeHtml(u.name)} ${u.isDemo ? '<span class="chip chip-primary">Demo</span>' : ''}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><select class="input" data-change-role="${u.id}" style="min-height:32px; padding:4px 8px;" ${u.isDemo ? 'disabled' : ''}>
            ${['student','instructor','admin'].map(r => `<option ${u.role===r?'selected':''}>${r}</option>`).join('')}</select></td>
          <td><span class="chip ${u.status==='active'?'chip-success':'chip-danger'}">${u.status}</span></td>
          <td>${formatDate(u.createdAt)}</td>
          <td class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-toggle-suspend="${u.id}" ${u.isDemo ? 'disabled title="Demo accounts are protected"' : ''}>${u.status==='active'?'Suspend':'Reactivate'}</button>
            <button class="btn btn-danger btn-sm" data-delete-user="${u.id}" ${u.isDemo ? 'disabled title="Demo accounts are protected"' : ''}>${Icons.trash}</button>
          </td></tr>`).join('')}
      </tbody></table></div>`;
    mount.querySelector('#adminUserSearch').addEventListener('input', debounce((e) => { q = e.target.value; render(); }, 250));
    mount.querySelector('#adminRoleFilter').addEventListener('change', (e) => { roleFilter = e.target.value; render(); });
    mount.querySelectorAll('[data-change-role]').forEach(sel => sel.addEventListener('change', () => {
      const users = getData('stdyio_users', []); const target = users.find(u => u.id === sel.dataset.changeRole);
      target.role = sel.value; saveData('stdyio_users', users); showToast(`${target.name}'s role updated to ${sel.value}.`, 'success');
    }));
    mount.querySelectorAll('[data-toggle-suspend]').forEach(b => b.addEventListener('click', async () => {
      const users = getData('stdyio_users', []); const target = users.find(u => u.id === b.dataset.toggleSuspend);
      const suspending = target.status === 'active';
      const ok = await showConfirmationDialog({ title: suspending ? 'Suspend account?' : 'Reactivate account?', message: `${target.name} will ${suspending?'no longer be able to log in':'regain access'}.`, danger: suspending });
      if (!ok) return;
      target.status = suspending ? 'suspended' : 'active'; saveData('stdyio_users', users); render();
    }));
    mount.querySelectorAll('[data-delete-user]').forEach(b => b.addEventListener('click', async () => {
      const users = getData('stdyio_users', []); const target = users.find(u => u.id === b.dataset.deleteUser);
      const ok = await showConfirmationDialog({ title: 'Delete user?', message: `Permanently delete ${target.name}'s account? This cannot be undone.`, confirmText: 'Delete', danger: true });
      if (!ok) return;
      saveData('stdyio_users', users.filter(u => u.id !== target.id)); showToast('User deleted.', 'success'); render();
    }));
  }
  render();
}

function renderAdminCourses() {
  const mount = document.getElementById('adminCoursesMount');
  function render() {
    const courses = getData('stdyio_courses', []);
    const enrollments = getData('stdyio_enrollments', []);
    mount.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Title</th><th>Category</th><th>Instructor</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      ${courses.map(c => `<tr>
        <td>${escapeHtml(c.title)}</td><td>${escapeHtml(c.category)}</td><td>${escapeHtml(findUserById(c.instructorId)?.name||'—')}</td>
        <td>${enrollments.filter(e=>e.courseId===c.id).length}</td>
        <td><span class="chip ${c.published!==false?'chip-success':'chip-neutral'}">${c.published!==false?'Published':'Unpublished'}</span></td>
        <td class="flex gap-2">
          <button class="btn btn-secondary btn-sm" data-toggle-publish="${c.id}">${c.published!==false?'Unpublish':'Approve/Publish'}</button>
          <button class="btn btn-danger btn-sm" data-delete-course="${c.id}">${Icons.trash}</button>
        </td></tr>`).join('')}
    </tbody></table></div>`;
    mount.querySelectorAll('[data-toggle-publish]').forEach(b => b.addEventListener('click', () => {
      const courses = getData('stdyio_courses', []); const c = courses.find(c => c.id === b.dataset.togglePublish);
      c.published = c.published === false ? true : false; saveData('stdyio_courses', courses); render();
      showToast(c.published ? 'Course published.' : 'Course unpublished.', 'success');
    }));
    mount.querySelectorAll('[data-delete-course]').forEach(b => b.addEventListener('click', async () => {
      const ok = await showConfirmationDialog({ title: 'Delete course?', message: 'This removes the course and cannot be undone.', confirmText: 'Delete', danger: true });
      if (!ok) return;
      saveData('stdyio_courses', getData('stdyio_courses', []).filter(c => c.id !== b.dataset.deleteCourse));
      showToast('Course deleted.', 'success'); render();
    }));
  }
  render();
}

function renderAdminPayments() {
  const mount = document.getElementById('adminPaymentsMount');
  const payments = getData('stdyio_payments', []).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  mount.innerHTML = payments.length ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Student</th><th>Courses</th><th>Method</th><th>Total</th><th>Status</th></tr></thead><tbody>
    ${payments.map(p => `<tr><td>${formatDate(p.createdAt)}</td><td>${escapeHtml(findUserById(p.userId)?.name||'—')}</td>
      <td>${p.courses.map(c=>escapeHtml(c.title)).join(', ')}</td><td style="text-transform:capitalize;">${p.method}</td>
      <td>${formatCurrency(p.total)}</td><td><span class="chip chip-success">${p.status}</span></td></tr>`).join('')}
  </tbody></table></div>` : `<p class="muted">No demonstration payments recorded yet.</p>`;
}

function renderAdminDiscussions() {
  const mount = document.getElementById('adminDiscussionsMount');
  const reports = getData('stdyio_reports', []).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  const threads = getData('stdyio_threads', []);
  const replies = getData('stdyio_replies', []);
  mount.innerHTML = `<h3>Reported Content</h3><div class="mt-3">
    ${reports.length ? reports.map(r => {
      const target = r.targetType === 'thread' ? threads.find(t => t.id === r.targetId) : replies.find(x => x.id === r.targetId);
      return `<div class="panel mb-3">
        <div class="flex justify-between items-center"><span class="chip chip-danger">${r.reason}</span><span class="muted" style="font-size:0.78rem;">${timeAgo(r.createdAt)}</span></div>
        <p class="mt-2"><b>${r.targetType === 'thread' ? 'Thread' : 'Reply'}:</b> ${escapeHtml(target ? (target.title || target.content) : 'Content removed')}</p>
        ${r.details ? `<p class="muted mt-1">${escapeHtml(r.details)}</p>` : ''}
        <div class="flex gap-2 mt-3">
          <button class="btn btn-secondary btn-sm" data-mark-reviewed="${r.id}" ${r.reviewed?'disabled':''}>${r.reviewed?'Reviewed':'Mark Reviewed'}</button>
          ${target ? `<a href="forum.html?thread=${r.targetType==='thread'?target.id:target.threadId}" class="btn btn-ghost btn-sm">View</a>` : ''}
        </div></div>`;
    }).join('') : '<p class="muted">No reports submitted yet.</p>'}
  </div>`;
  mount.querySelectorAll('[data-mark-reviewed]').forEach(b => b.addEventListener('click', () => {
    const reports = getData('stdyio_reports', []); reports.find(r => r.id === b.dataset.markReviewed).reviewed = true;
    saveData('stdyio_reports', reports); renderAdminDiscussions();
  }));
}

function renderAdminTestimonials() {
  const mount = document.getElementById('adminTestimonialsMount');
  function render() {
    const items = getData('stdyio_testimonials', []);
    mount.innerHTML = `<button class="btn btn-primary btn-sm mb-4" id="addTestimonialBtn">+ Add Testimonial</button>
      <div class="grid grid-2">${items.map(t => `<div class="panel">
        <div class="flex justify-between"><b>${escapeHtml(t.name)}</b><button data-del-test="${t.id}" style="color:var(--danger);">${Icons.trash}</button></div>
        <p class="muted" style="font-size:0.82rem;">${escapeHtml(t.course)} • ${t.rating}★</p><p class="mt-2">${escapeHtml(t.text)}</p></div>`).join('')}</div>`;
    mount.querySelector('#addTestimonialBtn').addEventListener('click', () => {
      openModal(`<div class="modal-head"><h3>Add Testimonial</h3><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
        <form id="testForm">
          <div class="form-group"><label for="ttName">Student Name</label><input class="input" id="ttName" required></div>
          <div class="form-group"><label for="ttCourse">Course</label><input class="input" id="ttCourse" required></div>
          <div class="form-group"><label for="ttRating">Rating (1-5)</label><input class="input" id="ttRating" type="number" min="1" max="5" value="5"></div>
          <div class="form-group"><label for="ttText">Testimonial</label><textarea class="input" id="ttText" rows="3" required></textarea></div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" data-close-modal>Cancel</button><button type="submit" class="btn btn-primary">Add</button></div>
        </form>`, { onOpen: (overlay) => overlay.querySelector('#testForm').addEventListener('submit', (e) => {
          e.preventDefault();
          const items = getData('stdyio_testimonials', []);
          items.push({ id: generateId('test'), name: overlay.querySelector('#ttName').value.trim(), course: overlay.querySelector('#ttCourse').value.trim(),
            rating: Number(overlay.querySelector('#ttRating').value)||5, text: overlay.querySelector('#ttText').value.trim() });
          saveData('stdyio_testimonials', items); showToast('Testimonial added.', 'success'); render();
          document.querySelector('.modal-overlay.show')?.classList.remove('show');
        }) });
    });
    mount.querySelectorAll('[data-del-test]').forEach(b => b.addEventListener('click', () => {
      saveData('stdyio_testimonials', getData('stdyio_testimonials', []).filter(t => t.id !== b.dataset.delTest));
      render();
    }));
  }
  render();
}
