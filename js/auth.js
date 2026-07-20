/* ==========================================================================
   stdy.io — auth.js
   Registration, login, logout and the demonstration password-reset flow.
   ========================================================================== */

const Auth = (() => {

  function logout() {
    clearCurrentUser();
    showToast('You have been logged out.', 'success');
    setTimeout(() => location.href = 'index.html', 600);
  }

  function redirectForRole(user) {
    const params = new URLSearchParams(location.search);
    const next = getSafeNextPath(params.get('next'));
    if (next && !['login.html', 'register.html'].includes(next)) { location.href = next; return; }
    if (user.role === 'admin') location.href = 'admin-dashboard.html';
    else if (user.role === 'instructor') location.href = 'instructor-dashboard.html';
    else location.href = 'dashboard.html';
  }

  /* ---------------- Login page ---------------- */
  function initLoginPage() {
    if (getCurrentUser()) { redirectForRole(getCurrentUser()); return; }
    const form = document.getElementById('loginForm');
    if (!form) return;
    setupPasswordToggle('loginPassword');

    document.querySelectorAll('[data-demo-email]').forEach(button => {
      button.addEventListener('click', () => {
        form.elements.loginEmail.value = button.dataset.demoEmail;
        form.elements.loginPassword.value = button.dataset.demoPassword;
        form.elements.rememberMe.checked = false;
        showToast('Demo credentials added. Signing you in…', 'info', 1800);
        form.requestSubmit();
      });
    });

    form.addEventListener('submit', withSubmitLock(form.querySelector('button[type="submit"]'), async (e) => {
      e.preventDefault();
      clearFieldError('loginEmail'); clearFieldError('loginPassword');
      const email = form.elements.loginEmail.value.trim();
      const password = form.elements.loginPassword.value;
      const remember = form.elements.rememberMe.checked;

      let valid = true;
      const emailErr = Validate.required(email, 'Email') || Validate.email(email);
      if (emailErr) { setFieldError('loginEmail', emailErr); valid = false; }
      if (!password) { setFieldError('loginPassword', 'Password is required.'); valid = false; }
      if (!valid) { focusFirstInvalid(form); return; }

      await new Promise(r => setTimeout(r, 500)); // brief loading state
      const user = findUserByEmail(email);
      if (!user || user.password !== password) {
        setFieldError('loginPassword', 'Incorrect email or password.');
        showToast('Login failed. Check your credentials and try again.', 'error');
        focusFirstInvalid(form);
        return;
      }
      if (user.status === 'suspended') {
        showToast('This demo account has been suspended by an administrator.', 'error');
        return;
      }
      setCurrentUser(user.id, remember);
      addNotification(user.id, 'Welcome back!', `You are logged in as ${user.name}.`, 'login');
      showToast(`Welcome back, ${user.name}!`, 'success');
      setTimeout(() => redirectForRole(user), 400);
    }));
  }

  /* ---------------- Register page ---------------- */
  function initRegisterPage() {
    if (getCurrentUser()) { redirectForRole(getCurrentUser()); return; }
    const form = document.getElementById('registerForm');
    if (!form) return;
    setupPasswordToggle('regPassword');
    setupPasswordToggle('regConfirmPassword');

    const pwBar = document.getElementById('pwStrength');
    form.elements.regPassword.addEventListener('input', () => { if (pwBar) renderPasswordStrength(pwBar, form.elements.regPassword.value); });

    form.addEventListener('submit', withSubmitLock(form.querySelector('button[type="submit"]'), async (e) => {
      e.preventDefault();
      ['regName','regEmail','regPassword','regConfirmPassword','regTerms'].forEach(clearFieldError);
      const name = form.elements.regName.value.trim();
      const email = form.elements.regEmail.value.trim();
      const password = form.elements.regPassword.value;
      const confirm = form.elements.regConfirmPassword.value;
      const interest = form.elements.regInterest.value;
      const terms = form.elements.regTerms.checked;

      const checks = [
        ['regName', Validate.required(name, 'Full name') || Validate.minLength(name, 3, 'Full name')],
        ['regEmail', Validate.required(email, 'Email') || Validate.email(email) || Validate.emailNotTaken(email)],
        ['regPassword', Validate.required(password, 'Password') || Validate.password(password)],
        ['regConfirmPassword', Validate.required(confirm, 'Confirm password') || Validate.matches(password, confirm, 'Passwords')],
        ['regTerms', Validate.checked(terms, 'Terms and Conditions')],
      ];
      let valid = true;
      checks.forEach(([id, err]) => { if (err) { setFieldError(id, err); valid = false; } });
      if (!valid) { focusFirstInvalid(form); return; }

      await new Promise(r => setTimeout(r, 500));
      const users = getData('stdyio_users', []);
      const newUser = {
        id: generateId('usr'), name, email, password, role: 'student',
        learningInterest: interest || 'Web Development', preferredDifficulty: 'Beginner',
        bio: '', avatar: null, createdAt: new Date().toISOString(), status: 'active', isDemo: false,
      };
      users.push(newUser);
      saveData('stdyio_users', users);
      addNotification(newUser.id, 'Welcome to stdy.io!', 'Your account has been created successfully.', 'registration');
      showToast('Account created! Redirecting to login…', 'success');
      const next = getSafeNextPath(new URLSearchParams(location.search).get('next'));
      setTimeout(() => location.href = next ? `login.html?next=${encodeURIComponent(next)}` : 'login.html', 900);
    }));
  }

  /* ---------------- Forgot password page ---------------- */
  function initForgotPasswordPage() {
    const step1 = document.getElementById('fpStep1');
    const step2 = document.getElementById('fpStep2');
    const step3 = document.getElementById('fpStep3');
    if (!step1) return;
    let targetUser = null;
    let demoCode = null;

    step1.addEventListener('submit', withSubmitLock(step1.querySelector('button[type="submit"]'), async (e) => {
      e.preventDefault();
      clearFieldError('fpEmail');
      const email = step1.elements.fpEmail.value.trim();
      const err = Validate.required(email, 'Email') || Validate.email(email) || Validate.emailMustExist(email);
      if (err) { setFieldError('fpEmail', err); return; }
      await new Promise(r => setTimeout(r, 500));
      targetUser = findUserByEmail(email);
      demoCode = String(Math.floor(100000 + Math.random() * 900000));
      document.getElementById('demoCodeDisplay').textContent = demoCode;
      step1.classList.add('hidden'); step2.classList.remove('hidden');
      showToast('Demonstration reset code generated below.', 'info');
    }));

    step2.addEventListener('submit', (e) => {
      e.preventDefault();
      clearFieldError('fpCode');
      const entered = step2.elements.fpCode.value.trim();
      if (entered !== demoCode) { setFieldError('fpCode', 'That code does not match. Check the demo code shown above.'); return; }
      step2.classList.add('hidden'); step3.classList.remove('hidden');
    });

    step3.addEventListener('submit', withSubmitLock(step3.querySelector('button[type="submit"]'), async (e) => {
      e.preventDefault();
      clearFieldError('fpNewPassword'); clearFieldError('fpConfirmPassword');
      const pw = step3.elements.fpNewPassword.value;
      const confirm = step3.elements.fpConfirmPassword.value;
      const checks = [
        ['fpNewPassword', Validate.password(pw)],
        ['fpConfirmPassword', Validate.matches(pw, confirm, 'Passwords')],
      ];
      let valid = true;
      checks.forEach(([id, err]) => { if (err) { setFieldError(id, err); valid = false; } });
      if (!valid) return;
      await new Promise(r => setTimeout(r, 500));
      const users = getData('stdyio_users', []);
      const idx = users.findIndex(u => u.id === targetUser.id);
      users[idx].password = pw;
      saveData('stdyio_users', users);
      showToast('Password updated. You can now log in.', 'success');
      setTimeout(() => location.href = 'login.html', 900);
    }));
  }

  function setupPasswordToggle(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const btn = input.parentElement.querySelector('.input-eye');
    if (!btn) return;
    btn.innerHTML = Icons.eye;
    btn.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.innerHTML = showing ? Icons.eye : Icons.eyeOff;
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }

  return { logout, initLoginPage, initRegisterPage, initForgotPasswordPage, setupPasswordToggle, redirectForRole };
})();

window.Auth = Auth;
