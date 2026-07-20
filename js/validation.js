/* ==========================================================================
   stdy.io — validation.js
   Reusable validation helpers. Every validator returns '' (valid) or an
   error message string. Form modules use setFieldError()/clearFieldError().
   ========================================================================== */

const Validate = {
  required(value, label = 'This field') {
    return String(value ?? '').trim() ? '' : `${label} is required.`;
  },
  minLength(value, min, label = 'This field') {
    return String(value ?? '').trim().length >= min ? '' : `${label} must be at least ${min} characters.`;
  },
  email(value) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(value ?? '').trim()) ? '' : 'Enter a valid email address.';
  },
  emailNotTaken(value) {
    return findUserByEmail(value) ? 'An account with this email already exists.' : '';
  },
  emailMustExist(value) {
    return findUserByEmail(value) ? '' : 'No account was found with this email.';
  },
  password(value) {
    const v = String(value ?? '');
    if (v.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-z]/.test(v) || !/[A-Z]/.test(v)) return 'Password must contain uppercase and lowercase letters.';
    if (!/[0-9]/.test(v)) return 'Password must contain at least one number.';
    return '';
  },
  matches(value, other, label = 'Fields') {
    return value === other ? '' : `${label} do not match.`;
  },
  checked(value, label = 'This') {
    return value ? '' : `${label} must be accepted to continue.`;
  },
  numberRange(value, min, max, label = 'Value') {
    const n = Number(value);
    if (isNaN(n)) return `${label} must be a number.`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return '';
  },
  price(value) {
    const n = Number(value);
    if (isNaN(n) || n < 0) return 'Enter a valid price of 0 or more.';
    return '';
  },
};

function passwordStrengthScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) score++;
  return score; // 0-4
}

function renderPasswordStrength(container, pw) {
  const score = passwordStrengthScore(pw);
  const colors = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'];
  container.querySelectorAll('span').forEach((bar, i) => {
    bar.style.background = i < score ? colors[score] : 'var(--border)';
  });
}

function setFieldError(fieldId, message) {
  const group = document.getElementById(fieldId)?.closest('.form-group');
  if (!group) return;
  const err = group.querySelector('.form-error');
  if (err) { err.textContent = message; err.classList.add('show'); }
  group.classList.add('invalid');
}

function clearFieldError(fieldId) {
  const group = document.getElementById(fieldId)?.closest('.form-group');
  if (!group) return;
  const err = group.querySelector('.form-error');
  if (err) { err.textContent = ''; err.classList.remove('show'); }
  group.classList.remove('invalid');
}

function focusFirstInvalid(formEl) {
  const firstInvalid = formEl.querySelector('.form-group.invalid .input, .form-group.invalid select, .form-group.invalid textarea');
  if (firstInvalid) firstInvalid.focus();
}

/** Guard against double-submission on a form/button while an async action runs. */
function withSubmitLock(button, asyncFn) {
  return async (...args) => {
    if (button.dataset.locked === '1') return;
    button.dataset.locked = '1';
    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner"></span> Please wait…`;
    try {
      await asyncFn(...args);
    } finally {
      button.disabled = false;
      button.innerHTML = originalHtml;
      button.dataset.locked = '0';
    }
  };
}
