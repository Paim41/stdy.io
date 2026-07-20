/* ==========================================================================
   stdy.io — enrollment.js
   Free-course enrollment, cart management, and the shopping cart page.
   ========================================================================== */

function enrollInCourse(courseId, paymentId = null) {
  const user = getCurrentUser();
  if (!user) return false;
  const courses = getData('stdyio_courses', []);
  const course = courses.find(c => c.id === courseId);
  if (!course) return false;

  const enrollments = getData('stdyio_enrollments', []);
  const existingEnrollment = enrollments.some(e => e.userId === user.id && e.courseId === courseId);

  if (!existingEnrollment) {
    enrollments.push({
      id: generateId('enr'), userId: user.id, courseId, enrolledAt: new Date().toISOString(),
      source: paymentId ? 'paid' : 'free', paymentId,
    });
    if (!saveData('stdyio_enrollments', enrollments)) return false;
  }

  const progress = getData('stdyio_progress', []);
  if (!progress.some(p => p.userId === user.id && p.courseId === courseId)) {
    progress.push({
      id: generateId('prg'), userId: user.id, courseId, completedLessons: [], quizAttempts: {}, bestScore: {},
      notes: {}, lastAccessedLessonId: null, status: 'not-started', enrolledAt: new Date().toISOString(),
      completedAt: null, learningTimeMinutes: 0,
    });
    if (!saveData('stdyio_progress', progress)) return false;
  }

  if (!existingEnrollment) {
    course.studentCount += 1;
    saveData('stdyio_courses', courses);
    addNotification(user.id, 'Enrollment confirmed', `You are now enrolled in "${course.title}".`, 'enrollment');
  }
  return true;
}

function getCartItems(userId) {
  return getData('stdyio_cart', []).filter(i => i.userId === userId);
}

function addToCart(courseId) {
  const user = getCurrentUser();
  if (!user) return false;
  if (getData('stdyio_enrollments', []).some(e => e.userId === user.id && e.courseId === courseId)) {
    showToast('You are already enrolled in this course.', 'info');
    return false;
  }
  let cart = getData('stdyio_cart', []);
  if (cart.some(i => i.userId === user.id && i.courseId === courseId)) {
    showToast('This course is already in your cart.', 'info');
    return false;
  }
  cart.push({ userId: user.id, courseId, addedAt: new Date().toISOString() });
  if (!saveData('stdyio_cart', cart)) return false;
  showToast('Course added to cart.', 'success');
  return true;
}

function removeFromCart(courseId) {
  const user = getCurrentUser();
  if (!user) return;
  saveData('stdyio_cart', getData('stdyio_cart', []).filter(i => !(i.userId === user.id && i.courseId === courseId)));
}

function initCartPage() {
  const user = requireAuthentication();
  if (!user) return;
  render();

  function render() {
    const items = getCartItems(user.id);
    const courses = getData('stdyio_courses', []);
    const mount = document.getElementById('cartMount');
    if (!items.length) {
      mount.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.5 3h2l2.6 12.4a2 2 0 002 1.6h8.4a2 2 0 002-1.6L21 8H6"/></svg>
        <h3>Your cart is empty</h3><p>Browse the catalog and add a paid course to get started.</p>
        <a href="courses.html" class="btn btn-primary">Continue Browsing</a></div>`;
      return;
    }
    const rows = items.map(i => courses.find(c => c.id === i.courseId)).filter(Boolean);
    const subtotal = rows.reduce((s, c) => s + c.price, 0);
    const discount = subtotal > 100 ? subtotal * 0.1 : 0;
    const total = subtotal - discount;
    saveData('stdyio_cart_summary_cache', { subtotal, discount, total });

    mount.innerHTML = `
      <div class="grid" style="grid-template-columns:1.7fr 1fr; gap:32px; align-items:start;">
        <div class="panel">
          <div class="flex justify-between items-center mb-4"><h3>Cart Items (${rows.length})</h3>
            <a href="courses.html" class="btn btn-ghost btn-sm">Continue Browsing</a></div>
          ${rows.map(c => `<div class="cart-item">
            <div class="cart-thumb">${getCourseThumbnailSVG(c.category)}</div>
            <div style="flex:1; min-width:0;"><h4 class="truncate">${escapeHtml(c.title)}</h4>
              <span class="muted" style="font-size:0.82rem;">${escapeHtml(c.category)} • ${c.difficulty}</span></div>
            <strong>${formatCurrency(c.price)}</strong>
            <button class="icon-btn" data-remove-cart="${c.id}" aria-label="Remove ${escapeHtml(c.title)} from cart">${Icons.trash}</button>
          </div>`).join('')}
        </div>
        <div class="cart-summary">
          <h3>Order Summary</h3>
          <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
          <div class="summary-row"><span>Discount</span><span>${discount ? '−' + formatCurrency(discount) : formatCurrency(0)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
          <a href="checkout.html" class="btn btn-primary btn-block mt-4">Proceed to Checkout</a>
        </div>
      </div>`;
    mount.querySelectorAll('[data-remove-cart]').forEach(btn => btn.addEventListener('click', () => {
      removeFromCart(btn.dataset.removeCart);
      showToast('Course removed from cart.', 'success');
      render();
    }));
  }
}
