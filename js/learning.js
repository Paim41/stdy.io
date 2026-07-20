/* ==========================================================================
   stdy.io — learning.js
   The lesson player page: curriculum sidebar, lesson content by type,
   progress tracking, notes, bookmarks, the quiz system, and course
   completion (certificate + transcript update).
   ========================================================================== */

let LP = null; // learning-page state

function initLearningPage() {
  const user = requireAuthentication();
  if (!user) return;
  const params = new URLSearchParams(location.search);
  const courseId = params.get('courseId');
  const course = getData('stdyio_courses', []).find(c => c.id === courseId);
  const mount = document.getElementById('learningMount');

  if (!course) { mount.innerHTML = `<div class="empty-state">${Icons.warning}<h3>Course not found</h3><p>Check the link and try again.</p><a href="dashboard.html" class="btn btn-primary">Back to Dashboard</a></div>`; return; }

  let progressList = getData('stdyio_progress', []);
  let progress = progressList.find(p => p.userId === user.id && p.courseId === course.id);
  if (!progress) { // not enrolled — send to course details
    location.href = `course-details.html?id=${course.id}`;
    return;
  }

  const flatLessons = [];
  course.modules.forEach(m => m.lessons.forEach(l => flatLessons.push({ ...l, moduleId: m.id, moduleTitle: m.title })));
  const requestedLessonId = params.get('lesson');
  let currentLessonId = requestedLessonId || progress.lastAccessedLessonId || flatLessons[0]?.id;

  LP = { user, course, progress, flatLessons, currentLessonId };

  document.title = `${course.title} — stdy.io`;
  renderLearningShell();
  goToLesson(currentLessonId);
}

function saveProgress() {
  const list = getData('stdyio_progress', []);
  const idx = list.findIndex(p => p.id === LP.progress.id);
  if (idx > -1) list[idx] = LP.progress; else list.push(LP.progress);
  saveData('stdyio_progress', list);
}

function logActivity(minutes = 5) {
  LP.progress.learningTimeMinutes = (LP.progress.learningTimeMinutes || 0) + minutes;
  LP.progress.activityLog = LP.progress.activityLog || [];
  const today = new Date().toISOString().slice(0, 10);
  const entry = LP.progress.activityLog.find(a => a.date === today);
  if (entry) entry.minutes += minutes; else LP.progress.activityLog.push({ date: today, minutes });
  LP.progress.lastAccessedAt = new Date().toISOString();
}

function renderLearningShell() {
  const { course } = LP;
  const mount = document.getElementById('learningMount');
  mount.innerHTML = `
    <div class="learning-layout" style="display:grid; grid-template-columns:320px 1fr; gap:24px; align-items:start;">
      <aside class="panel learning-sidebar" style="position:sticky; top:calc(var(--header-h) + 16px); max-height:calc(100vh - var(--header-h) - 32px); overflow-y:auto;">
        <button class="btn btn-ghost btn-sm w-full" id="curriculumMobileClose" style="display:none;">${Icons.close} Close</button>
        <h3 class="truncate">${escapeHtml(course.title)}</h3>
        <div class="progress-row mt-3"><div class="progress-bar"><span id="sidebarProgressBar" style="width:0%"></span></div><span class="progress-pct" id="sidebarProgressPct">0%</span></div>
        <div class="mt-4" id="curriculumList"></div>
      </aside>
      <main>
        <div class="flex justify-between items-center mb-3">
          <button class="btn btn-secondary btn-sm" id="openCurriculumBtn" style="display:none;">${Icons.list} Curriculum</button>
          <div class="flex gap-2" style="margin-left:auto;">
            <button class="icon-btn" id="bookmarkLessonBtn" aria-label="Bookmark lesson">${Icons.bookmark}</button>
          </div>
        </div>
        <div class="panel" id="lessonContentPanel"></div>
        <div class="flex justify-between mt-4">
          <button class="btn btn-secondary" id="prevLessonBtn">${Icons.prev} Previous</button>
          <button class="btn btn-primary" id="markCompleteBtn">${Icons.check} Mark Complete</button>
          <button class="btn btn-secondary" id="nextLessonBtn">Next ${Icons.next}</button>
        </div>
        <div class="panel mt-4">
          <h3>My Notes</h3>
          <textarea class="input mt-3" id="lessonNotes" rows="4" placeholder="Write a personal note for this lesson…"></textarea>
          <button class="btn btn-secondary btn-sm mt-3" id="saveNoteBtn">Save Note</button>
        </div>
      </main>
    </div>`;

  renderCurriculumList();
  document.getElementById('prevLessonBtn').addEventListener('click', () => stepLesson(-1));
  document.getElementById('nextLessonBtn').addEventListener('click', () => stepLesson(1));
  document.getElementById('markCompleteBtn').addEventListener('click', markCurrentLessonComplete);
  document.getElementById('saveNoteBtn').addEventListener('click', saveCurrentNote);
  document.getElementById('bookmarkLessonBtn').addEventListener('click', toggleLessonBookmark);

  // mobile curriculum drawer behaviour
  if (window.innerWidth <= 720) {
    document.getElementById('openCurriculumBtn').style.display = 'inline-flex';
    document.getElementById('curriculumMobileClose').style.display = 'block';
    document.querySelector('.learning-sidebar').classList.add('hidden');
    document.getElementById('openCurriculumBtn').addEventListener('click', () => document.querySelector('.learning-sidebar').classList.remove('hidden'));
    document.getElementById('curriculumMobileClose').addEventListener('click', () => document.querySelector('.learning-sidebar').classList.add('hidden'));
  }
}

function renderCurriculumList() {
  const { course, progress } = LP;
  const wrap = document.getElementById('curriculumList');
  wrap.innerHTML = course.modules.map(m => `
    <div class="accordion-item open">
      <div class="accordion-trigger" style="cursor:default;"><span>${escapeHtml(m.title)}</span></div>
      <div class="accordion-panel" style="max-height:none;">
        ${m.lessons.map(l => {
          const done = progress.completedLessons.includes(l.id);
          const active = l.id === LP.currentLessonId;
          return `<div class="lesson-row ${done ? 'completed' : ''} ${active ? 'active' : ''}" data-goto-lesson="${l.id}" style="cursor:pointer;">
            ${done ? Icons.check : lessonTypeIcon(l.type)}<span class="lesson-title">${escapeHtml(l.title)}</span><span class="lesson-meta">${l.duration}m</span>
          </div>`;
        }).join('')}
      </div>
    </div>`).join('');
  wrap.querySelectorAll('[data-goto-lesson]').forEach(row => row.addEventListener('click', () => goToLesson(row.dataset.gotoLesson)));
  updateSidebarProgress();
}

function updateSidebarProgress() {
  const pct = courseProgressPct(LP.progress, LP.course);
  document.getElementById('sidebarProgressBar').style.width = pct + '%';
  document.getElementById('sidebarProgressPct').textContent = pct + '%';
}

function currentLesson() { return LP.flatLessons.find(l => l.id === LP.currentLessonId); }

function goToLesson(lessonId) {
  LP.currentLessonId = lessonId;
  LP.progress.lastAccessedLessonId = lessonId;
  logActivity(3);
  saveProgress();
  renderLessonContent();
  renderCurriculumList();
  if (window.innerWidth <= 720) document.querySelector('.learning-sidebar')?.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function stepLesson(delta) {
  const idx = LP.flatLessons.findIndex(l => l.id === LP.currentLessonId);
  const next = LP.flatLessons[idx + delta];
  if (next) goToLesson(next.id);
  else showToast(delta > 0 ? "You're on the last lesson." : "You're on the first lesson.", 'info');
}

function renderLessonContent() {
  const lesson = currentLesson();
  const panel = document.getElementById('lessonContentPanel');
  const done = LP.progress.completedLessons.includes(lesson.id);
  document.getElementById('markCompleteBtn').innerHTML = done ? `${Icons.check} Completed` : `${Icons.check} Mark Complete`;
  document.getElementById('markCompleteBtn').disabled = done && lesson.type !== 'quiz';
  const bookmarked = (LP.progress.bookmarkedLessons || []).includes(lesson.id);
  document.getElementById('bookmarkLessonBtn').classList.toggle('active', bookmarked);
  document.getElementById('bookmarkLessonBtn').innerHTML = bookmarked ? Icons.bookmark.replace('fill="none"','fill="currentColor"') : Icons.bookmark;
  document.getElementById('lessonNotes').value = (LP.progress.notes || {})[lesson.id] || '';

  let bodyHtml = '';
  if (lesson.type === 'video') {
    bodyHtml = `<div style="aspect-ratio:16/9; background:var(--bg); border-radius:var(--r-md); display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-secondary); gap:8px;">
      ${Icons.play}<span>Video lesson placeholder — click Mark Complete when you're done watching.</span></div>`;
  } else if (lesson.type === 'reading') {
    bodyHtml = `<div class="panel" style="background:var(--bg);"><p>${escapeHtml(lesson.title)} covers the key concepts for this part of the course. Read through the material at your own pace, then continue to the next lesson.</p></div>`;
  } else if (lesson.type === 'code') {
    bodyHtml = `<pre style="background:var(--bg); border-radius:var(--r-md); padding:16px; overflow-x:auto; font-size:0.85rem;"><code>// ${escapeHtml(lesson.title)}
function example() {
  // Follow along with the instructor and try this yourself.
  console.log("Practice makes progress!");
}</code></pre>`;
  } else if (lesson.type === 'download') {
    bodyHtml = `<div class="flex items-center gap-3">${Icons.download}<span>Downloadable material for "${escapeHtml(lesson.title)}"</span>
      <button class="btn btn-secondary btn-sm" id="downloadMaterialBtn">Download</button></div>`;
  } else if (lesson.type === 'assignment') {
    bodyHtml = `<p>${escapeHtml(lesson.title)}: apply what you have learned in this module by completing the project described in class. Mark this lesson complete once you have finished your submission.</p>`;
  } else if (lesson.type === 'quiz') {
    bodyHtml = `<div id="quizContainer"></div>`;
  }

  panel.innerHTML = `<span class="chip chip-primary">${lesson.moduleTitle}</span><h2 class="mt-3">${escapeHtml(lesson.title)}</h2>
    <p class="muted mt-2">${lesson.duration} minutes • ${lesson.type}</p><div class="mt-4">${bodyHtml}</div>`;

  if (lesson.type === 'quiz') renderQuiz(lesson);
  const dlBtn = document.getElementById('downloadMaterialBtn');
  if (dlBtn) dlBtn.addEventListener('click', () => showToast('Demonstration file downloaded.', 'success'));
}

function markCurrentLessonComplete() {
  const lesson = currentLesson();
  if (!LP.progress.completedLessons.includes(lesson.id)) {
    LP.progress.completedLessons.push(lesson.id);
    LP.progress.status = 'in-progress';
    logActivity(lesson.duration || 5);
    showToast('Lesson marked as complete.', 'success');
  }
  saveProgress();
  updateSidebarProgress();
  renderCurriculumList();
  renderLessonContent();
  checkCourseCompletion();
}

function saveCurrentNote() {
  const lesson = currentLesson();
  LP.progress.notes = LP.progress.notes || {};
  LP.progress.notes[lesson.id] = document.getElementById('lessonNotes').value;
  saveProgress();
  showToast('Note saved.', 'success');
}

function toggleLessonBookmark() {
  const lesson = currentLesson();
  LP.progress.bookmarkedLessons = LP.progress.bookmarkedLessons || [];
  const has = LP.progress.bookmarkedLessons.includes(lesson.id);
  LP.progress.bookmarkedLessons = has ? LP.progress.bookmarkedLessons.filter(id => id !== lesson.id) : [...LP.progress.bookmarkedLessons, lesson.id];
  saveProgress();
  renderLessonContent();
  showToast(has ? 'Bookmark removed.' : 'Lesson bookmarked.', 'success');
}

/* ---------------- Quiz system ---------------- */
function renderQuiz(lesson) {
  const { course, progress } = LP;
  const quiz = course.quiz;
  const container = document.getElementById('quizContainer');
  let qIndex = 0;
  const answers = new Array(quiz.questions.length).fill(null);

  function renderQuestion() {
    const q = quiz.questions[qIndex];
    container.innerHTML = `
      <div class="progress-row mb-4"><div class="progress-bar"><span style="width:${((qIndex+1)/quiz.questions.length)*100}%"></span></div>
        <span class="progress-pct">${qIndex+1}/${quiz.questions.length}</span></div>
      <h3>${escapeHtml(q.q)}</h3>
      <div class="mt-4" id="quizOptions">${q.options.map((opt, i) => `
        <label class="quiz-option ${answers[qIndex] === i ? 'selected' : ''}"><input type="radio" name="quizOpt" value="${i}" ${answers[qIndex]===i?'checked':''}> ${escapeHtml(opt)}</label>`).join('')}</div>
      <div class="flex justify-between mt-4">
        <button class="btn btn-secondary" id="quizPrevBtn" ${qIndex===0?'disabled':''}>${Icons.prev} Previous</button>
        ${qIndex < quiz.questions.length - 1
          ? `<button class="btn btn-primary" id="quizNextBtn">Next ${Icons.next}</button>`
          : `<button class="btn btn-primary" id="quizSubmitBtn">Submit Quiz</button>`}
      </div>`;
    container.querySelectorAll('input[name="quizOpt"]').forEach(r => r.addEventListener('change', () => { answers[qIndex] = +r.value; renderQuestion(); }));
    document.getElementById('quizPrevBtn').addEventListener('click', () => { qIndex--; renderQuestion(); });
    document.getElementById('quizNextBtn')?.addEventListener('click', () => { qIndex++; renderQuestion(); });
    document.getElementById('quizSubmitBtn')?.addEventListener('click', () => {
      if (answers.includes(null)) { showToast('Answer every question before submitting.', 'error'); return; }
      submitQuiz(quiz, answers, lesson);
    });
  }
  renderQuestion();
}

function submitQuiz(quiz, answers, lesson) {
  const correctCount = answers.filter((a, i) => a === quiz.questions[i].answer).length;
  const scorePct = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = scorePct >= quiz.passingScore;

  LP.progress.quizAttempts = LP.progress.quizAttempts || {};
  LP.progress.quizAttempts[lesson.id] = (LP.progress.quizAttempts[lesson.id] || 0) + 1;
  LP.progress.bestScore = LP.progress.bestScore || {};
  LP.progress.bestScore[lesson.id] = Math.max(LP.progress.bestScore[lesson.id] || 0, scorePct);
  if (passed && !LP.progress.completedLessons.includes(lesson.id)) {
    LP.progress.completedLessons.push(lesson.id);
    addNotification(LP.user.id, 'Quiz passed', `You scored ${scorePct}% on the ${LP.course.title} quiz.`, 'quiz');
  }
  logActivity(10);
  saveProgress();

  const container = document.getElementById('quizContainer');
  container.innerHTML = `
    <div class="text-center">
      <div class="benefit-icon" style="margin:0 auto 16px; background:${passed ? 'var(--success)' : 'var(--danger)'};">${passed ? Icons.check : Icons.warning}</div>
      <h3>${passed ? 'You passed!' : 'Not quite there yet'}</h3>
      <p class="mt-2">You scored <b>${scorePct}%</b>. The passing score is ${quiz.passingScore}%.</p>
    </div>
    <div class="mt-5">${quiz.questions.map((q, i) => `
      <div class="quiz-option ${answers[i] === q.answer ? 'correct' : 'incorrect'}" style="pointer-events:none;">
        <span>${Icons.check}</span><div><b>${escapeHtml(q.q)}</b><p style="font-size:0.82rem; margin-top:4px;">Correct answer: ${escapeHtml(q.options[q.answer])}. ${escapeHtml(q.explanation)}</p></div>
      </div>`).join('')}</div>
    <div class="flex gap-3 mt-5"><button class="btn btn-secondary" id="retakeQuizBtn">Retake Quiz</button></div>`;
  document.getElementById('retakeQuizBtn').addEventListener('click', () => renderQuiz(lesson));

  updateSidebarProgress();
  renderCurriculumList();
  checkCourseCompletion();
}

/* ---------------- Course completion ---------------- */
function checkCourseCompletion() {
  const { course, progress, user } = LP;
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  if (progress.status === 'completed' || progress.completedLessons.length < totalLessons) return;

  progress.status = 'completed';
  progress.completedAt = new Date().toISOString();
  saveProgress();

  const certificateId = 'CERT-' + Date.now().toString(36).toUpperCase();
  const certificates = getData('stdyio_certificates', []);
  certificates.push({
    id: generateId('cert'), certificateId, userId: user.id, courseId: course.id, courseTitle: course.title,
    instructorName: getInstructor(course.instructorId)?.name || 'stdy.io', issuedAt: new Date().toISOString(),
  });
  saveData('stdyio_certificates', certificates);
  addNotification(user.id, 'Course completed!', `You completed "${course.title}" and earned a certificate.`, 'completion');

  openModal(`
    <div class="text-center animate-pop">
      <div class="benefit-icon" style="margin:0 auto 16px;">${Icons.certificate}</div>
      <h2>Course Completed!</h2>
      <p class="mt-3">Congratulations on finishing <b>${escapeHtml(course.title)}</b>. Your certificate has been added to your certificates page.</p>
      <div class="modal-actions" style="justify-content:center;">
        <button class="btn btn-secondary" data-close-modal>Keep Reviewing</button>
        <a href="certificates.html" class="btn btn-primary">View Certificate</a>
      </div>
    </div>`);
}
