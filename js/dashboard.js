/* ==========================================================================
   stdy.io — dashboard.js
   Student dashboard: summary cards, continue learning, progress charts,
   achievements, recommendations, and the detailed progress tracker tab.
   ========================================================================== */

function courseProgressPct(progress, course) {
  if (!progress || !course) return 0;
  const total = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  if (!total) return 0;
  return Math.round((progress.completedLessons.length / total) * 100);
}

function getLearningStreak(userId) {
  const progresses = getData('stdyio_progress', []).filter(p => p.userId === userId);
  const days = new Set();
  progresses.forEach(p => (p.activityLog || []).forEach(a => days.add(a.date)));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; cursor.setDate(cursor.getDate() - 1); } else break;
  }
  return streak;
}

function initDashboardPage() {
  const user = requireAuthentication();
  if (!user) return;
  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];

  document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn[data-tab]').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('[data-tab-panel]').forEach(p => p.classList.toggle('hidden', p.dataset.tabPanel !== btn.dataset.tab));
    if (btn.dataset.tab === 'tracker') renderProgressTracker(user);
  }));

  renderOverview(user);
}

function renderOverview(user) {
  const courses = getData('stdyio_courses', []);
  const enrollments = getData('stdyio_enrollments', []).filter(e => e.userId === user.id);
  const progresses = getData('stdyio_progress', []).filter(p => p.userId === user.id);
  const certificates = getData('stdyio_certificates', []).filter(c => c.userId === user.id);

  const inProgress = progresses.filter(p => p.status === 'in-progress' || (p.status !== 'completed' && p.completedLessons.length > 0));
  const completed = progresses.filter(p => p.status === 'completed');
  const totalMinutes = progresses.reduce((s, p) => s + (p.learningTimeMinutes || 0), 0);

  document.getElementById('summaryCards').innerHTML = [
    ['Enrolled Courses', enrollments.length, Icons.book],
    ['In Progress', inProgress.length, Icons.progress],
    ['Completed', completed.length, Icons.check],
    ['Certificates', certificates.length, Icons.certificate],
    ['Learning Time', `${Math.round(totalMinutes / 60)}h`, Icons.clock],
    ['Learning Streak', `${getLearningStreak(user.id)}d`, Icons.star],
  ].map(([label, value, icon]) => `<div class="stat-card"><div class="label">${icon}${label}</div><div class="value">${value}</div></div>`).join('');

  // Continue learning
  const continueMount = document.getElementById('continueLearningList');
  const activeEnrollments = enrollments.map(e => {
    const course = courses.find(c => c.id === e.courseId);
    const progress = progresses.find(p => p.courseId === e.courseId);
    return { course, progress };
  }).filter(x => x.course && x.progress && x.progress.status !== 'completed');

  continueMount.innerHTML = activeEnrollments.length ? activeEnrollments.map(({ course, progress }) => {
    const pct = courseProgressPct(progress, course);
    const lastLesson = findLessonById(course, progress.lastAccessedLessonId);
    return `<div class="enrolled-item">
      <div class="enrolled-thumb">${getCourseThumbnailSVG(course.category)}</div>
      <div class="enrolled-info">
        <h4 class="truncate">${escapeHtml(course.title)}</h4>
        <div class="sub">${escapeHtml(getInstructor(course.instructorId)?.name || '')} • ${lastLesson ? 'Last: ' + escapeHtml(lastLesson.title) : 'Not started yet'}</div>
        <div class="progress-row"><div class="progress-bar"><span style="width:${pct}%"></span></div><span class="progress-pct">${pct}%</span></div>
      </div>
      <a href="learning.html?courseId=${course.id}" class="btn btn-primary btn-sm">Continue</a>
    </div>`;
  }).join('') : `<div class="empty-state" style="padding:32px 8px;">${Icons.book}<h3 style="font-size:1rem;">No courses in progress</h3><p style="font-size:0.85rem;">Enroll in a course to start learning.</p><a href="courses.html" class="btn btn-primary btn-sm">Browse Courses</a></div>`;

  // Progress overview chart (simple SVG bar chart of last 7 days activity + completion donut)
  renderProgressChart(progresses, courses);

  // Upcoming tasks: incomplete lessons across active courses
  const tasksMount = document.getElementById('upcomingTasks');
  const tasks = [];
  activeEnrollments.forEach(({ course, progress }) => {
    course.modules.forEach(m => m.lessons.forEach(l => {
      if (!progress.completedLessons.includes(l.id) && tasks.length < 6) {
        tasks.push({ course, lesson: l });
      }
    }));
  });
  tasksMount.innerHTML = tasks.length ? tasks.map(t => `<div class="lesson-row">
      ${lessonTypeIcon(t.lesson.type)}<span class="lesson-title">${escapeHtml(t.lesson.title)}</span>
      <span class="lesson-meta muted">${escapeHtml(truncateText(t.course.title, 24))}</span>
      <a href="learning.html?courseId=${t.course.id}" class="btn btn-ghost btn-sm">${t.lesson.type === 'quiz' ? 'Take Quiz' : 'Start'}</a>
    </div>`).join('') : `<p class="muted" style="padding:12px 0;">You're all caught up on your enrolled courses.</p>`;

  // Achievements
  const achMount = document.getElementById('achievementsList');
  const achievements = [];
  completed.forEach(p => { const c = courses.find(c => c.id === p.courseId); if (c) achievements.push({ icon: Icons.certificate, text: `Completed "${c.title}"`, date: p.completedAt }); });
  certificates.forEach(cert => achievements.push({ icon: Icons.award, text: `Earned certificate for "${cert.courseTitle}"`, date: cert.issuedAt }));
  achievements.sort((a, b) => new Date(b.date) - new Date(a.date));
  achMount.innerHTML = achievements.length ? achievements.slice(0, 5).map(a => `
    <div class="flex items-center gap-3" style="padding:10px 0; border-bottom:1px solid var(--border);">
      <div class="benefit-icon" style="width:36px;height:36px;margin:0;">${a.icon}</div>
      <div style="flex:1;"><p style="font-size:0.85rem;">${escapeHtml(a.text)}</p><span class="muted" style="font-size:0.75rem;">${timeAgo(a.date)}</span></div>
    </div>`).join('') : `<p class="muted" style="padding:12px 0;">Complete a course to unlock your first achievement badge.</p>`;

  // Recommended
  const recMount = document.getElementById('recommendedCourses');
  const enrolledIds = new Set(enrollments.map(e => e.courseId));
  const recs = courses.filter(c => !enrolledIds.has(c.id) && (c.category === user.learningInterest || c.difficulty === (user.preferredDifficulty || 'Beginner'))).slice(0, 3);
  const fallback = recs.length ? recs : courses.filter(c => !enrolledIds.has(c.id)).slice(0, 3);
  recMount.innerHTML = fallback.map(c => courseCardHtml(c)).join('');
  attachCourseCardEvents(recMount);

  // Notifications preview
  const notifMount = document.getElementById('notifPreview');
  const notifs = getData('stdyio_notifications', []).filter(n => n.userId === user.id).slice(0, 4);
  notifMount.innerHTML = notifs.length ? notifs.map(n => `<div style="padding:8px 0; border-bottom:1px solid var(--border);">
    <p style="font-size:0.85rem; font-weight:${n.read ? '500' : '700'};">${escapeHtml(n.title)}</p>
    <span class="muted" style="font-size:0.74rem;">${timeAgo(n.createdAt)}</span></div>`).join('')
    : `<p class="muted" style="padding:8px 0;">No notifications yet.</p>`;
}

function findLessonById(course, lessonId) {
  if (!lessonId) return null;
  for (const m of course.modules) { const l = m.lessons.find(l => l.id === lessonId); if (l) return l; }
  return null;
}

function renderProgressChart(progresses, courses) {
  const mount = document.getElementById('progressChartMount');
  if (!mount) return;
  const completedLessonsTotal = progresses.reduce((s, p) => s + p.completedLessons.length, 0);
  const quizCount = progresses.reduce((s, p) => s + Object.keys(p.bestScore || {}).length, 0);
  const totalLessonsAll = progresses.reduce((s, p) => { const c = courses.find(c => c.id === p.courseId); return s + (c ? c.modules.reduce((a, m) => a + m.lessons.length, 0) : 0); }, 0);
  const overallPct = totalLessonsAll ? Math.round((completedLessonsTotal / totalLessonsAll) * 100) : 0;
  const r = 54, circ = 2 * Math.PI * r;
  mount.innerHTML = `
    <div class="flex items-center gap-4" style="flex-wrap:wrap;">
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="${overallPct}% overall progress">
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--border)" stroke-width="14"/>
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="url(#pcg)" stroke-width="14" stroke-linecap="round"
          stroke-dasharray="${circ}" stroke-dashoffset="${circ - (overallPct/100)*circ}" transform="rotate(-90 70 70)"/>
        <defs><linearGradient id="pcg" x1="0" y1="0" x2="140" y2="140"><stop stop-color="#087A59"/><stop offset="1" stop-color="#12A875"/></linearGradient></defs>
        <text x="70" y="76" text-anchor="middle" font-size="26" font-weight="800" fill="var(--text)">${overallPct}%</text>
      </svg>
      <div class="flex-col gap-2" style="flex:1; min-width:180px;">
        <div class="flex justify-between" style="font-size:0.85rem;"><span class="muted">Lessons completed</span><b>${completedLessonsTotal}</b></div>
        <div class="flex justify-between" style="font-size:0.85rem;"><span class="muted">Quizzes passed</span><b>${quizCount}</b></div>
        <div class="flex justify-between" style="font-size:0.85rem;"><span class="muted">Overall completion</span><b>${overallPct}%</b></div>
      </div>
    </div>`;
}

/* ---------------- Certificates page ---------------- */
function initCertificatesPage() {
  const user = requireAuthentication();
  if (!user) return;
  const certificates = getData('stdyio_certificates', []).filter(c => c.userId === user.id);
  const mount = document.getElementById('certificatesMount');
  if (!certificates.length) {
    mount.innerHTML = `<div class="empty-state">${Icons.certificate}<h3>No certificates yet</h3><p>Complete a course to earn your first certificate.</p><a href="courses.html" class="btn btn-primary">Browse Courses</a></div>`;
    return;
  }
  mount.innerHTML = `<div class="grid grid-2">${certificates.map(cert => `
    <div class="certificate-box">
      <div class="brand" style="justify-content:center; margin-bottom:8px;">${Icons.logo}<span>stdy.io</span></div>
      <p class="muted" style="font-size:0.78rem; letter-spacing:0.06em; text-transform:uppercase;">Certificate of Completion</p>
      <h2>${escapeHtml(cert.courseTitle)}</h2>
      <p>Awarded to <b>${escapeHtml(user.name)}</b></p>
      <p class="muted mt-2" style="font-size:0.85rem;">Instructor: ${escapeHtml(cert.instructorName)} • Completed ${formatDate(cert.issuedAt)}</p>
      <p class="cert-id">Certificate ID: ${cert.certificateId}<br>Verification: valid demonstration certificate issued by stdy.io</p>
      <div class="flex gap-2 mt-4" style="justify-content:center;">
        <button class="btn btn-secondary btn-sm" data-print-cert="${cert.id}">${Icons.print} Print</button>
        <button class="btn btn-secondary btn-sm" data-download-cert="${cert.id}">${Icons.download} Download</button>
      </div>
    </div>`).join('')}</div>`;
  mount.querySelectorAll('[data-print-cert]').forEach(b => b.addEventListener('click', () => window.print()));
  mount.querySelectorAll('[data-download-cert]').forEach(b => b.addEventListener('click', () => {
    const cert = certificates.find(c => c.id === b.dataset.downloadCert);
    downloadCertificateFile(cert, user);
  }));
}

function downloadCertificateFile(cert, user) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate — ${cert.courseTitle}</title></head>
  <body style="font-family:Arial,sans-serif; padding:48px; text-align:center; border:6px solid #087A59;">
    <h1>stdy.io</h1><p style="text-transform:uppercase; letter-spacing:2px; color:#686875;">Certificate of Completion</p>
    <h2>${cert.courseTitle}</h2><p>Awarded to <b>${user.name}</b></p>
    <p>Instructor: ${cert.instructorName} — Completed ${formatDate(cert.issuedAt)}</p>
    <p style="font-size:12px; color:#686875;">Certificate ID: ${cert.certificateId}</p>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `stdy.io-Certificate-${cert.certificateId}.html`; a.click();
}

/* ---------------- Transcript page ---------------- */
function initTranscriptPage() {
  const user = requireAuthentication();
  if (!user) return;
  const courses = getData('stdyio_courses', []);
  const enrollments = getData('stdyio_enrollments', []).filter(e => e.userId === user.id);
  const progresses = getData('stdyio_progress', []);
  const certificates = getData('stdyio_certificates', []).filter(c => c.userId === user.id);

  const rows = enrollments.map(e => {
    const course = courses.find(c => c.id === e.courseId);
    const progress = progresses.find(p => p.userId === user.id && p.courseId === e.courseId);
    const cert = certificates.find(c => c.courseId === e.courseId);
    const scores = progress ? Object.values(progress.bestScore || {}) : [];
    return { course, enrollment: e, progress, cert, bestScore: scores.length ? Math.max(...scores) : null };
  }).filter(r => r.course);

  document.getElementById('transcriptStudentName').textContent = user.name;
  document.getElementById('transcriptStudentId').textContent = user.id;
  document.getElementById('transcriptCompletedCount').textContent = rows.filter(r => r.progress?.status === 'completed').length;

  const mount = document.getElementById('transcriptTableMount');
  mount.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr>
      <th>Course</th><th>Enrolled</th><th>Completed</th><th>Quiz Score</th><th>Status</th><th>Certificate ID</th></tr></thead><tbody>
    ${rows.map(r => `<tr>
      <td>${escapeHtml(r.course.title)}</td><td>${formatDate(r.enrollment.enrolledAt)}</td>
      <td>${r.progress?.completedAt ? formatDate(r.progress.completedAt) : '—'}</td>
      <td>${r.bestScore !== null ? r.bestScore + '%' : '—'}</td>
      <td style="text-transform:capitalize;">${(r.progress?.status || 'not-started').replace('-',' ')}</td>
      <td>${r.cert ? r.cert.certificateId : '—'}</td></tr>`).join('') || '<tr><td colspan="6">No enrollment history yet.</td></tr>'}
  </tbody></table></div>`;

  document.getElementById('printTranscriptBtn')?.addEventListener('click', () => window.print());
  document.getElementById('downloadTranscriptCsvBtn')?.addEventListener('click', () => {
    let csv = 'Course,Enrolled,Completed,Quiz Score,Status,Certificate ID\n';
    rows.forEach(r => { csv += `"${r.course.title}","${formatDate(r.enrollment.enrolledAt)}","${r.progress?.completedAt ? formatDate(r.progress.completedAt) : ''}","${r.bestScore ?? ''}","${r.progress?.status || 'not-started'}","${r.cert ? r.cert.certificateId : ''}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `stdy.io-Transcript-${user.id}.csv`; a.click();
  });
}

/* ---------------- Progress Tracker tab ---------------- */
function renderProgressTracker(user, statusFilter = 'all') {
  const mount = document.getElementById('trackerMount');
  const courses = getData('stdyio_courses', []);
  const enrollments = getData('stdyio_enrollments', []).filter(e => e.userId === user.id);
  const progresses = getData('stdyio_progress', []);

  const rows = enrollments.map(e => {
    const course = courses.find(c => c.id === e.courseId);
    const progress = progresses.find(p => p.userId === user.id && p.courseId === e.courseId);
    return { course, progress, enrollment: e };
  }).filter(r => r.course && r.progress);

  const filtered = statusFilter === 'all' ? rows : rows.filter(r => r.progress.status === statusFilter);

  if (!filtered.length) {
    mount.innerHTML = `<div class="empty-state">${Icons.progress}<h3>No courses to show</h3><p>Enroll in a course to start tracking your progress.</p><a href="courses.html" class="btn btn-primary">Browse Courses</a></div>`;
    return;
  }

  mount.innerHTML = filtered.map(({ course, progress, enrollment }) => {
    const pct = courseProgressPct(progress, course);
    const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
    const quizScores = Object.values(progress.bestScore || {});
    const bestScore = quizScores.length ? Math.max(...quizScores) : null;
    const statusChip = { 'not-started': 'chip-neutral', 'in-progress': 'chip-warning', completed: 'chip-success' }[progress.status] || 'chip-neutral';
    return `<div class="panel mb-4">
      <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:8px;">
        <div><h3>${escapeHtml(course.title)}</h3><p style="font-size:0.82rem;">${escapeHtml(getInstructor(course.instructorId)?.name || '')} • Enrolled ${formatDate(enrollment.enrolledAt)}</p></div>
        <span class="chip ${statusChip}">${progress.status.replace('-', ' ')}</span>
      </div>
      <div class="grid grid-4 mt-4" style="gap:16px;">
        <div><span class="muted" style="font-size:0.76rem;">Lessons</span><p style="font-weight:700;">${progress.completedLessons.length}/${totalLessons}</p></div>
        <div><span class="muted" style="font-size:0.76rem;">Quizzes</span><p style="font-weight:700;">${Object.keys(progress.bestScore || {}).length}</p></div>
        <div><span class="muted" style="font-size:0.76rem;">Best Score</span><p style="font-weight:700;">${bestScore !== null ? bestScore + '%' : '—'}</p></div>
        <div><span class="muted" style="font-size:0.76rem;">Last Accessed</span><p style="font-weight:700;">${progress.lastAccessedAt ? timeAgo(progress.lastAccessedAt) : '—'}</p></div>
      </div>
      <div class="progress-row mt-4"><div class="progress-bar"><span style="width:${pct}%"></span></div><span class="progress-pct">${pct}%</span></div>
      <a href="learning.html?courseId=${course.id}" class="btn btn-secondary btn-sm mt-4">${progress.status === 'completed' ? 'Review Course' : 'Continue Learning'}</a>
    </div>`;
  }).join('');
}
