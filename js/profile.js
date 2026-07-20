/* ==========================================================================
   stdy.io — profile.js
   Profile editing, password change, and account statistics.
   ========================================================================== */

function initProfilePage() {
  const user = requireAuthentication();
  if (!user) return;

  document.getElementById('profileAvatarBig').textContent = getInitials(user.name);
  const form = document.getElementById('profileForm');
  form.elements.pName.value = user.name;
  form.elements.pEmail.value = user.email;
  form.elements.pBio.value = user.bio || '';
  if (form.elements.pInterest) form.elements.pInterest.value = user.learningInterest || 'Web Development';
  if (form.elements.pDifficulty) form.elements.pDifficulty.value = user.preferredDifficulty || 'Beginner';

  form.addEventListener('submit', withSubmitLock(form.querySelector('button[type="submit"]'), async (e) => {
    e.preventDefault();
    ['pName','pEmail'].forEach(clearFieldError);
    const name = form.elements.pName.value.trim();
    const email = form.elements.pEmail.value.trim();
    let valid = true;
    const nameErr = Validate.required(name, 'Full name') || Validate.minLength(name, 3, 'Full name');
    if (nameErr) { setFieldError('pName', nameErr); valid = false; }
    const emailErr = Validate.required(email, 'Email') || Validate.email(email);
    if (emailErr) { setFieldError('pEmail', emailErr); valid = false; }
    if (email.toLowerCase() !== user.email.toLowerCase() && findUserByEmail(email)) { setFieldError('pEmail', 'This email is already used by another account.'); valid = false; }
    if (!valid) { focusFirstInvalid(form); return; }

    await new Promise(r => setTimeout(r, 400));
    const users = getData('stdyio_users', []);
    const idx = users.findIndex(u => u.id === user.id);
    users[idx] = { ...users[idx], name, email, bio: form.elements.pBio.value.trim(),
      learningInterest: form.elements.pInterest?.value, preferredDifficulty: form.elements.pDifficulty?.value };
    saveData('stdyio_users', users);
    document.getElementById('profileAvatarBig').textContent = getInitials(name);
    showToast('Profile updated successfully.', 'success');
    setTimeout(() => location.reload(), 700);
  }));

  const pwForm = document.getElementById('passwordForm');
  pwForm?.addEventListener('submit', withSubmitLock(pwForm.querySelector('button[type="submit"]'), async (e) => {
    e.preventDefault();
    ['pCurrentPassword','pNewPassword','pConfirmPassword'].forEach(clearFieldError);
    const current = pwForm.elements.pCurrentPassword.value;
    const next = pwForm.elements.pNewPassword.value;
    const confirm = pwForm.elements.pConfirmPassword.value;
    let valid = true;
    if (current !== user.password) { setFieldError('pCurrentPassword', 'Current password is incorrect.'); valid = false; }
    const pwErr = Validate.password(next);
    if (pwErr) { setFieldError('pNewPassword', pwErr); valid = false; }
    if (next !== confirm) { setFieldError('pConfirmPassword', 'Passwords do not match.'); valid = false; }
    if (!valid) { focusFirstInvalid(pwForm); return; }

    await new Promise(r => setTimeout(r, 400));
    const users = getData('stdyio_users', []);
    const idx = users.findIndex(u => u.id === user.id);
    users[idx].password = next;
    saveData('stdyio_users', users);
    pwForm.reset();
    showToast('Password changed successfully.', 'success');
  }));

  // Stats
  const enrollments = getData('stdyio_enrollments', []).filter(e => e.userId === user.id);
  const certificates = getData('stdyio_certificates', []).filter(c => c.userId === user.id);
  const payments = getData('stdyio_payments', []).filter(p => p.userId === user.id);
  document.getElementById('profileStats').innerHTML = `
    <div class="stat-card"><div class="label">${Icons.book}Enrolled</div><div class="value">${enrollments.length}</div></div>
    <div class="stat-card"><div class="label">${Icons.certificate}Certificates</div><div class="value">${certificates.length}</div></div>
    <div class="stat-card"><div class="label">${Icons.clock}Member Since</div><div class="value" style="font-size:1.1rem;">${formatDate(user.createdAt)}</div></div>`;

  const payMount = document.getElementById('paymentHistory');
  payMount.innerHTML = payments.length ? `<table class="data-table"><thead><tr><th>Date</th><th>Courses</th><th>Method</th><th>Total</th></tr></thead><tbody>
    ${payments.map(p => `<tr><td>${formatDate(p.createdAt)}</td><td>${p.courses.map(c=>escapeHtml(c.title)).join(', ')}</td><td style="text-transform:capitalize;">${p.method}</td><td>${formatCurrency(p.total)}</td></tr>`).join('')}
  </tbody></table>` : `<p class="muted">No payment history yet.</p>`;

  document.getElementById('profileLogoutBtn')?.addEventListener('click', () => window.Auth.logout());
}
