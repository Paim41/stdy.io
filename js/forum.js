/* ==========================================================================
   stdy.io — forum.js
   Community discussion forum: threads, replies, upvotes, instructor answers,
   and administrator moderation (delete / lock / pin / reports).
   ========================================================================== */

const FORUM_CATEGORIES = ['Questions', 'Study Tips', 'Announcements'];

function initForumPage() {
  const params = new URLSearchParams(location.search);
  const threadId = params.get('thread');
  if (threadId) renderThreadDetail(threadId);
  else renderThreadList();
}

function renderThreadList() {
  const listView = document.getElementById('forumListView');
  const detailView = document.getElementById('forumDetailView');
  detailView.classList.add('hidden'); listView.classList.remove('hidden');

  const user = getCurrentUser();
  const courses = getData('stdyio_courses', []);
  let state = { tab: 'all', q: '', course: '', sort: 'recent' };

  function getThreads() {
    let threads = getData('stdyio_threads', []);
    const replies = getData('stdyio_replies', []);
    if (state.tab === 'popular') threads = [...threads].sort((a, b) => repliesFor(b.id, replies).length - repliesFor(a.id, replies).length);
    else if (state.tab === 'unanswered') threads = threads.filter(t => repliesFor(t.id, replies).length === 0);
    else if (FORUM_CATEGORIES.includes(tabToCategory(state.tab))) threads = threads.filter(t => t.category === tabToCategory(state.tab));
    if (state.course) threads = threads.filter(t => t.courseId === state.course);
    if (state.q) threads = threads.filter(t => t.title.toLowerCase().includes(state.q.toLowerCase()));
    threads = [...threads].sort((a, b) => (b.pinned - a.pinned) || (new Date(b.updatedAt) - new Date(a.updatedAt)));
    return threads;
  }
  function tabToCategory(tab) { return { questions: 'Questions', tips: 'Study Tips', announcements: 'Announcements' }[tab] || null; }

  function render() {
    const threads = getThreads();
    const replies = getData('stdyio_replies', []);
    const mount = document.getElementById('threadListMount');
    document.getElementById('threadCount').textContent = `${threads.length} discussion${threads.length===1?'':'s'}`;
    mount.innerHTML = threads.length ? threads.map(t => {
      const author = findUserById(t.authorId);
      const course = courses.find(c => c.id === t.courseId);
      const threadReplies = repliesFor(t.id, replies);
      const upvotes = threadReplies.reduce((s, r) => s + r.upvotes, 0);
      return `<a href="forum.html?thread=${t.id}" class="thread-card" style="display:block;">
        <div class="thread-head">
          <div class="avatar-badge" style="width:32px;height:32px;font-size:0.7rem;">${getInitials(author?.name || '?')}</div>
          <div><b>${escapeHtml(author?.name || 'Unknown')}</b> <span class="chip chip-neutral" style="margin-left:6px;">${author?.role || ''}</span></div>
          ${t.pinned ? `<span class="chip chip-primary" style="margin-left:auto;">${Icons.pin} Pinned</span>` : ''}
          ${t.locked ? `<span class="chip chip-danger">${Icons.lock} Locked</span>` : ''}
        </div>
        <h3>${escapeHtml(t.title)}</h3>
        <div class="thread-meta mt-2">
          <span class="chip chip-primary">${t.category}</span>${course ? `<span>${escapeHtml(course.title)}</span>` : ''}<span>${timeAgo(t.updatedAt)}</span>
        </div>
        <div class="thread-stats"><span>${Icons.reply} ${threadReplies.length} replies</span><span>${Icons.upvote} ${upvotes} upvotes</span></div>
      </a>`;
    }).join('') : `<div class="empty-state">${Icons.discussion}<h3>No discussions found</h3><p>Try a different filter or start a new discussion.</p></div>`;
  }

  document.querySelectorAll('.tab-btn[data-forum-tab]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn[data-forum-tab]').forEach(b => b.classList.toggle('active', b === btn));
    state.tab = btn.dataset.forumTab; render();
  }));
  const searchInput = document.getElementById('forumSearchInput');
  if (searchInput) searchInput.addEventListener('input', debounce(() => { state.q = searchInput.value.trim(); render(); }, 300));
  const courseSelect = document.getElementById('forumCourseFilter');
  if (courseSelect) {
    courseSelect.innerHTML = `<option value="">All Courses</option>` + courses.map(c => `<option value="${c.id}">${escapeHtml(c.title)}</option>`).join('');
    courseSelect.addEventListener('change', () => { state.course = courseSelect.value; render(); });
  }
  document.getElementById('newThreadBtn')?.addEventListener('click', () => openThreadModal());

  render();
}

function repliesFor(threadId, replies) { return replies.filter(r => r.threadId === threadId); }

function openThreadModal(existing = null) {
  const user = getCurrentUser();
  if (!user) { location.href = 'login.html?next=forum.html'; return; }
  const courses = getData('stdyio_courses', []);
  const { overlay, close } = openModal(`
    <div class="modal-head"><h3>${existing ? 'Edit Discussion' : 'New Discussion'}</h3><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
    <form id="threadForm">
      <div class="form-group"><label for="thTitle">Title</label><input class="input" id="thTitle" required value="${existing ? escapeHtml(existing.title) : ''}"><span class="form-error"></span></div>
      <div class="form-row">
        <div class="form-group"><label for="thCourse">Course (optional)</label><select class="input" id="thCourse">
          <option value="">General</option>${courses.map(c => `<option value="${c.id}" ${existing?.courseId===c.id?'selected':''}>${escapeHtml(c.title)}</option>`).join('')}</select></div>
        <div class="form-group"><label for="thCategory">Category</label><select class="input" id="thCategory">
          ${FORUM_CATEGORIES.map(c => `<option value="${c}" ${existing?.category===c?'selected':''}>${c}</option>`).join('')}</select></div>
      </div>
      <div class="form-group"><label for="thContent">Content</label><textarea class="input" id="thContent" rows="4" required>${existing ? escapeHtml(existing.content||'') : ''}</textarea><span class="form-error"></span></div>
      <div class="modal-actions"><button type="button" class="btn btn-secondary" data-close-modal>Cancel</button>
        <button type="submit" class="btn btn-primary">${existing ? 'Save Changes' : 'Post Discussion'}</button></div>
    </form>`, {
    onOpen: (overlay) => {
      overlay.querySelector('#threadForm').addEventListener('submit', (e) => {
        e.preventDefault();
        clearFieldError('thTitle'); clearFieldError('thContent');
        const title = overlay.querySelector('#thTitle').value.trim();
        const content = overlay.querySelector('#thContent').value.trim();
        let valid = true;
        if (Validate.required(title, 'Title')) { setFieldError('thTitle', 'Title is required.'); valid = false; }
        if (Validate.required(content, 'Content')) { setFieldError('thContent', 'Content is required.'); valid = false; }
        if (!valid) return;
        const threads = getData('stdyio_threads', []);
        if (existing) {
          const t = threads.find(t => t.id === existing.id);
          t.title = title; t.content = content; t.courseId = overlay.querySelector('#thCourse').value || null;
          t.category = overlay.querySelector('#thCategory').value; t.updatedAt = new Date().toISOString();
        } else {
          threads.unshift({ id: generateId('th'), title, content, courseId: overlay.querySelector('#thCourse').value || null,
            category: overlay.querySelector('#thCategory').value, authorId: user.id, createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(), status: 'open', pinned: false, locked: false });
        }
        saveData('stdyio_threads', threads);
        showToast(existing ? 'Discussion updated.' : 'Discussion posted.', 'success');
        close();
        location.href = existing ? `forum.html?thread=${existing.id}` : `forum.html?thread=${threads[0].id}`;
      });
    }
  });
}

function renderThreadDetail(threadId) {
  const listView = document.getElementById('forumListView');
  const detailView = document.getElementById('forumDetailView');
  listView.classList.add('hidden'); detailView.classList.remove('hidden');

  const user = getCurrentUser();
  const threads = getData('stdyio_threads', []);
  const thread = threads.find(t => t.id === threadId);
  const mount = document.getElementById('threadDetailMount');
  if (!thread) { mount.innerHTML = `<div class="empty-state">${Icons.warning}<h3>Discussion not found</h3><a href="forum.html" class="btn btn-primary">Back to Forum</a></div>`; return; }

  const author = findUserById(thread.authorId);
  const course = getData('stdyio_courses', []).find(c => c.id === thread.courseId);
  const canModerate = user && user.role === 'admin';
  const isCourseInstructor = user && user.role === 'instructor' && course && course.instructorId === user.id;
  const isOwner = user && user.id === thread.authorId;

  function renderReplies() {
    const replies = getData('stdyio_replies', []).filter(r => r.threadId === threadId)
      .sort((a, b) => b.isInstructorAnswer - a.isInstructorAnswer || b.upvotes - a.upvotes);
    const votes = getData('stdyio_votes', []);
    document.getElementById('repliesMount').innerHTML = replies.map(r => {
      const rAuthor = findUserById(r.authorId);
      const voted = user && votes.some(v => v.userId === user.id && v.replyId === r.id);
      const canEditReply = user && user.id === r.authorId;
      return `<div class="reply-item">
        <button class="upvote-btn ${voted ? 'active' : ''}" data-upvote="${r.id}" aria-label="Upvote reply">${Icons.upvote}<span>${r.upvotes}</span></button>
        <div style="flex:1;">
          <div class="flex items-center gap-2"><b>${escapeHtml(rAuthor?.name || 'Unknown')}</b>
            <span class="chip chip-neutral">${rAuthor?.role || ''}</span>
            ${r.isInstructorAnswer ? `<span class="chip chip-success">${Icons.check} Instructor Answer</span>` : ''}
            <span class="muted" style="font-size:0.76rem;">${timeAgo(r.createdAt)}</span></div>
          <p class="mt-2" id="replyText-${r.id}">${escapeHtml(r.content)}</p>
          <div class="flex gap-3 mt-2" style="font-size:0.78rem;">
            ${canEditReply ? `<button data-edit-reply="${r.id}" style="color:var(--primary); font-weight:700;">Edit</button><button data-del-reply="${r.id}" style="color:var(--danger); font-weight:700;">Delete</button>` : ''}
            ${isCourseInstructor && !r.isInstructorAnswer ? `<button data-mark-answer="${r.id}" style="color:var(--success); font-weight:700;">Mark as Answer</button>` : ''}
            ${!canEditReply ? `<button data-report="${r.id}" data-report-type="reply" style="color:var(--text-secondary); font-weight:700;">${Icons.flag} Report</button>` : ''}
            ${canModerate ? `<button data-admin-del-reply="${r.id}" style="color:var(--danger); font-weight:700;">Remove (Admin)</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('') || `<p class="muted mt-4">No replies yet. Be the first to help!</p>`;

    document.querySelectorAll('[data-upvote]').forEach(b => b.addEventListener('click', () => toggleUpvote(b.dataset.upvote, renderReplies)));
    document.querySelectorAll('[data-mark-answer]').forEach(b => b.addEventListener('click', () => markInstructorAnswer(b.dataset.markAnswer, renderReplies)));
    document.querySelectorAll('[data-del-reply]').forEach(b => b.addEventListener('click', async () => {
      if (await showConfirmationDialog({ title: 'Delete reply?', message: 'This cannot be undone.', danger: true })) { deleteReply(b.dataset.delReply); renderReplies(); }
    }));
    document.querySelectorAll('[data-admin-del-reply]').forEach(b => b.addEventListener('click', async () => {
      if (await showConfirmationDialog({ title: 'Remove reply?', message: 'This will permanently remove the reply as an administrator action.', danger: true })) { deleteReply(b.dataset.adminDelReply); renderReplies(); }
    }));
    document.querySelectorAll('[data-edit-reply]').forEach(b => b.addEventListener('click', () => editReplyInline(b.dataset.editReply, renderReplies)));
    document.querySelectorAll('[data-report]').forEach(b => b.addEventListener('click', () => openReportDialog(b.dataset.report, b.dataset.reportType)));
  }

  mount.innerHTML = `
    <a href="forum.html" class="breadcrumb">${Icons.prev} Back to Forum</a>
    <div class="thread-card mt-3">
      <div class="thread-head">
        <div class="avatar-badge" style="width:40px;height:40px;">${getInitials(author?.name || '?')}</div>
        <div><b>${escapeHtml(author?.name || 'Unknown')}</b><div class="muted" style="font-size:0.78rem;">${timeAgo(thread.createdAt)}</div></div>
        <div class="flex gap-2" style="margin-left:auto;">
          ${thread.pinned ? `<span class="chip chip-primary">${Icons.pin} Pinned</span>` : ''}
          ${thread.locked ? `<span class="chip chip-danger">${Icons.lock} Locked</span>` : ''}
        </div>
      </div>
      <h2 class="mt-3">${escapeHtml(thread.title)}</h2>
      <div class="thread-meta mt-2"><span class="chip chip-primary">${thread.category}</span>${course ? `<span>${escapeHtml(course.title)}</span>` : ''}</div>
      <p class="mt-4">${escapeHtml(thread.content || '')}</p>
      <div class="flex gap-3 mt-4" style="font-size:0.82rem; flex-wrap:wrap;">
        ${isOwner ? `<button id="editThreadBtn" style="color:var(--primary); font-weight:700;">${Icons.edit} Edit</button><button id="deleteThreadBtn" style="color:var(--danger); font-weight:700;">${Icons.trash} Delete</button>` : ''}
        ${!isOwner && user ? `<button data-report="${thread.id}" data-report-type="thread" style="color:var(--text-secondary); font-weight:700;">${Icons.flag} Report</button>` : ''}
        ${isCourseInstructor ? `<button id="pinThreadBtn" style="color:var(--primary); font-weight:700;">${Icons.pin} ${thread.pinned ? 'Unpin' : 'Pin'}</button>
          <button id="lockThreadBtn" style="color:var(--warning); font-weight:700;">${thread.locked ? Icons.unlock : Icons.lock} ${thread.locked ? 'Unlock' : 'Lock'}</button>` : ''}
        ${canModerate ? `<button id="adminPinBtn" style="color:var(--primary); font-weight:700;">${Icons.pin} ${thread.pinned ? 'Unpin' : 'Pin'} (Admin)</button>
          <button id="adminLockBtn" style="color:var(--warning); font-weight:700;">${thread.locked ? 'Unlock' : 'Lock'} (Admin)</button>
          <button id="adminDeleteBtn" style="color:var(--danger); font-weight:700;">${Icons.trash} Delete (Admin)</button>` : ''}
      </div>
    </div>
    <div class="panel mt-4"><h3>Replies</h3><div id="repliesMount" class="mt-4"></div>
      ${thread.locked ? `<div class="demo-banner mt-4">${Icons.lock}<span>This discussion is locked. New replies are disabled.</span></div>` :
        user ? `<form id="replyForm" class="mt-4"><textarea class="input" id="replyContent" rows="3" placeholder="Write a reply…" required></textarea>
          <button type="submit" class="btn btn-primary mt-3">${Icons.reply} Post Reply</button></form>`
        : `<p class="mt-4"><a href="login.html?next=forum.html%3Fthread%3D${threadId}" class="btn btn-primary btn-sm">Log in to reply</a></p>`}
    </div>`;

  document.getElementById('replyForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = document.getElementById('replyContent').value.trim();
    if (!content) return;
    const replies = getData('stdyio_replies', []);
    replies.push({ id: generateId('rep'), threadId, authorId: user.id, content, createdAt: new Date().toISOString(), upvotes: 0, isInstructorAnswer: false });
    saveData('stdyio_replies', replies);
    thread.updatedAt = new Date().toISOString();
    saveData('stdyio_threads', threads);
    if (thread.authorId !== user.id) addNotification(thread.authorId, 'New reply', `${user.name} replied to "${thread.title}".`, 'reply');
    document.getElementById('replyContent').value = '';
    renderReplies();
    showToast('Reply posted.', 'success');
  });

  document.getElementById('editThreadBtn')?.addEventListener('click', () => openThreadModal(thread));
  document.getElementById('deleteThreadBtn')?.addEventListener('click', async () => {
    if (await showConfirmationDialog({ title: 'Delete discussion?', message: 'This will remove the discussion and all its replies.', danger: true })) {
      saveData('stdyio_threads', threads.filter(t => t.id !== threadId));
      saveData('stdyio_replies', getData('stdyio_replies', []).filter(r => r.threadId !== threadId));
      showToast('Discussion deleted.', 'success');
      location.href = 'forum.html';
    }
  });
  ['pinThreadBtn','adminPinBtn'].forEach(id => document.getElementById(id)?.addEventListener('click', () => { thread.pinned = !thread.pinned; saveData('stdyio_threads', threads); renderThreadDetail(threadId); }));
  ['lockThreadBtn','adminLockBtn'].forEach(id => document.getElementById(id)?.addEventListener('click', () => { thread.locked = !thread.locked; saveData('stdyio_threads', threads); renderThreadDetail(threadId); }));
  document.getElementById('adminDeleteBtn')?.addEventListener('click', async () => {
    if (await showConfirmationDialog({ title: 'Delete this discussion?', message: 'Administrator moderation action — this cannot be undone.', danger: true })) {
      saveData('stdyio_threads', threads.filter(t => t.id !== threadId));
      saveData('stdyio_replies', getData('stdyio_replies', []).filter(r => r.threadId !== threadId));
      showToast('Discussion removed by administrator.', 'success');
      location.href = 'forum.html';
    }
  });
  document.querySelectorAll('[data-report]').forEach(b => b.addEventListener('click', () => openReportDialog(b.dataset.report, b.dataset.reportType)));

  renderReplies();
}

function toggleUpvote(replyId, cb) {
  const user = getCurrentUser();
  if (!user) { location.href = 'login.html?next=forum.html'; return; }
  const votes = getData('stdyio_votes', []);
  const replies = getData('stdyio_replies', []);
  const reply = replies.find(r => r.id === replyId);
  const existingIdx = votes.findIndex(v => v.userId === user.id && v.replyId === replyId);
  if (existingIdx > -1) { votes.splice(existingIdx, 1); reply.upvotes = Math.max(0, reply.upvotes - 1); }
  else { votes.push({ id: generateId('vote'), userId: user.id, replyId }); reply.upvotes += 1; }
  saveData('stdyio_votes', votes);
  saveData('stdyio_replies', replies);
  cb();
}

function markInstructorAnswer(replyId, cb) {
  const replies = getData('stdyio_replies', []);
  const reply = replies.find(r => r.id === replyId);
  replies.forEach(r => { if (r.threadId === reply.threadId) r.isInstructorAnswer = false; });
  reply.isInstructorAnswer = true;
  saveData('stdyio_replies', replies);
  showToast('Marked as the instructor answer.', 'success');
  cb();
}

function deleteReply(replyId) {
  saveData('stdyio_replies', getData('stdyio_replies', []).filter(r => r.id !== replyId));
  showToast('Reply deleted.', 'success');
}

function editReplyInline(replyId, cb) {
  const replies = getData('stdyio_replies', []);
  const reply = replies.find(r => r.id === replyId);
  const el = document.getElementById(`replyText-${replyId}`);
  el.innerHTML = `<textarea class="input" id="editReplyBox-${replyId}" rows="3">${escapeHtml(reply.content)}</textarea>
    <button class="btn btn-primary btn-sm mt-2" id="saveEditReply-${replyId}">Save</button>`;
  document.getElementById(`saveEditReply-${replyId}`).addEventListener('click', () => {
    reply.content = document.getElementById(`editReplyBox-${replyId}`).value.trim();
    saveData('stdyio_replies', replies);
    cb();
  });
}

const REPORT_REASONS = ['Spam', 'Harassment', 'Unrelated content', 'Incorrect information', 'Other'];
function openReportDialog(targetId, targetType) {
  const user = getCurrentUser();
  if (!user) { location.href = 'login.html?next=forum.html'; return; }
  const { close } = openModal(`
    <div class="modal-head"><h3>Report ${targetType}</h3><button class="modal-close" data-close-modal aria-label="Close">${Icons.close}</button></div>
    <form id="reportForm">
      <div class="form-group"><label>Reason</label>
        ${REPORT_REASONS.map((r, i) => `<label class="filter-option"><input type="radio" name="reportReason" value="${r}" ${i===0?'required':''}> ${r}</label>`).join('')}</div>
      <div class="form-group"><label for="reportDetails">Additional details (optional)</label><textarea class="input" id="reportDetails" rows="3"></textarea></div>
      <div class="modal-actions"><button type="button" class="btn btn-secondary" data-close-modal>Cancel</button><button type="submit" class="btn btn-danger">Submit Report</button></div>
    </form>`, {
    onOpen: (overlay) => overlay.querySelector('#reportForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const reason = overlay.querySelector('input[name="reportReason"]:checked')?.value;
      if (!reason) { showToast('Select a reason for the report.', 'error'); return; }
      const reports = getData('stdyio_reports', []);
      reports.push({ id: generateId('rpt'), targetId, targetType, reason, details: overlay.querySelector('#reportDetails').value.trim(),
        reportedBy: user.id, createdAt: new Date().toISOString(), reviewed: false });
      saveData('stdyio_reports', reports);
      showToast('Thank you — this content has been reported to our moderators.', 'success');
      close();
    })
  });
}
