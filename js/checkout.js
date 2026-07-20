/* ==========================================================================
   stdy.io — checkout.js
   Demonstration checkout: billing form, simulated payment, receipt.
   No real payment gateway is used and card details are never stored.
   ========================================================================== */

function initCheckoutPage() {
  const user = requireAuthentication();
  if (!user) return;
  const items = getCartItems(user.id);
  const courses = getData('stdyio_courses', []);
  const rows = items.map(i => courses.find(c => c.id === i.courseId)).filter(Boolean);

  if (!rows.length) {
    document.getElementById('checkoutMount').innerHTML = `<div class="empty-state">${Icons.cart}
      <h3>Nothing to check out</h3><p>Your cart is empty. Add a paid course before checking out.</p>
      <a href="courses.html" class="btn btn-primary">Browse Courses</a></div>`;
    return;
  }

  const subtotal = rows.reduce((s, c) => s + c.price, 0);
  const discount = subtotal > 100 ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const mount = document.getElementById('checkoutMount');
  mount.innerHTML = `
    <div class="grid" style="grid-template-columns:1.6fr 1fr; gap:32px; align-items:start;">
      <div>
        <div class="demo-banner">${Icons.warning}<span>Demonstration payment only. No real payment will be processed.</span><button type="button" class="btn btn-secondary btn-sm" id="fillDemoCheckout">Fill Demo Details</button></div>
        <form id="checkoutForm" class="panel" novalidate>
          <h3>Billing Details</h3>
          <div class="form-row mt-4">
            <div class="form-group"><label for="ckName">Full Name</label><input class="input" id="ckName" name="ckName" value="${escapeHtml(user.name)}" required>
              <span class="form-error"></span></div>
            <div class="form-group"><label for="ckEmail">Email</label><input class="input" id="ckEmail" name="ckEmail" type="email" value="${escapeHtml(user.email)}" required>
              <span class="form-error"></span></div>
          </div>
          <div class="form-group"><label for="ckAddress">Billing Address</label><input class="input" id="ckAddress" name="ckAddress" required><span class="form-error"></span></div>
          <div class="form-row">
            <div class="form-group"><label for="ckCity">City</label><input class="input" id="ckCity" name="ckCity" required><span class="form-error"></span></div>
            <div class="form-group"><label for="ckState">State</label><input class="input" id="ckState" name="ckState" required><span class="form-error"></span></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label for="ckPostcode">Postcode</label><input class="input" id="ckPostcode" name="ckPostcode" inputmode="numeric" required><span class="form-error"></span></div>
            <div class="form-group"><label for="ckCountry">Country</label><input class="input" id="ckCountry" name="ckCountry" value="Malaysia" required><span class="form-error"></span></div>
          </div>

          <h3 class="mt-6">Payment Method</h3>
          <div class="mt-4">
            <label class="payment-method-row selected"><input type="radio" name="paymentMethod" value="card" checked>${Icons.payment}<span>Credit Card</span></label>
            <label class="payment-method-row"><input type="radio" name="paymentMethod" value="paypal">${Icons.globe}<span>PayPal</span></label>
            <label class="payment-method-row"><input type="radio" name="paymentMethod" value="banking">${Icons.receipt}<span>Online Banking</span></label>
          </div>

          <div id="cardFields" class="mt-4">
            <div class="form-group"><label for="ckCardName">Cardholder Name</label><input class="input" id="ckCardName" name="ckCardName"><span class="form-error"></span></div>
            <div class="form-group"><label for="ckCardNumber">Card Number</label><input class="input" id="ckCardNumber" name="ckCardNumber" inputmode="numeric" maxlength="19" placeholder="4242 4242 4242 4242"><span class="form-error"></span></div>
            <div class="form-row">
              <div class="form-group"><label for="ckExpiry">Expiry Date</label><input class="input" id="ckExpiry" name="ckExpiry" placeholder="MM/YY"><span class="form-error"></span></div>
              <div class="form-group"><label for="ckCvc">Security Code</label><input class="input" id="ckCvc" name="ckCvc" inputmode="numeric" maxlength="4" placeholder="CVC"><span class="form-error"></span></div>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block mt-4" id="payNowBtn">${Icons.payment}Pay ${formatCurrency(total)}</button>
        </form>
      </div>
      <div class="cart-summary">
        <h3>Order Summary</h3>
        ${rows.map(c => `<div class="summary-row"><span class="truncate" style="max-width:70%;">${escapeHtml(c.title)}</span><span>${formatCurrency(c.price)}</span></div>`).join('')}
        <div class="divider"></div>
        <div class="summary-row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
        <div class="summary-row"><span>Discount</span><span>${discount ? '−' + formatCurrency(discount) : formatCurrency(0)}</span></div>
        <div class="summary-row total"><span>Total</span><span>${formatCurrency(total)}</span></div>
      </div>
    </div>`;

  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => radio.addEventListener('change', () => {
    document.querySelectorAll('.payment-method-row').forEach(r => r.classList.remove('selected'));
    radio.closest('.payment-method-row').classList.add('selected');
    document.getElementById('cardFields').classList.toggle('hidden', radio.value !== 'card');
  }));

  const form = document.getElementById('checkoutForm');
  document.getElementById('fillDemoCheckout').addEventListener('click', () => {
    const demoValues = {
      ckAddress: '24 Jalan Ilmu', ckCity: 'Kuala Lumpur', ckState: 'Kuala Lumpur', ckPostcode: '50450', ckCountry: 'Malaysia',
      ckCardName: user.name, ckCardNumber: '4242 4242 4242 4242', ckExpiry: '12/30', ckCvc: '123',
    };
    Object.entries(demoValues).forEach(([name, value]) => { form.elements[name].value = value; clearFieldError(name); });
    showToast('Safe demonstration details added. Review them, then complete the simulated payment.', 'success');
  });

  form.elements.ckCardNumber.addEventListener('input', () => {
    const digits = form.elements.ckCardNumber.value.replace(/\D/g, '').slice(0, 16);
    form.elements.ckCardNumber.value = digits.replace(/(.{4})/g, '$1 ').trim();
  });

  form.addEventListener('submit', withSubmitLock(document.getElementById('payNowBtn'), async (e) => {
    e.preventDefault();
    const fields = ['ckName','ckEmail','ckAddress','ckCity','ckState','ckPostcode','ckCountry'];
    fields.forEach(clearFieldError);
    let valid = true;
    fields.forEach(id => {
      const err = Validate.required(form.elements[id].value, document.querySelector(`label[for="${id}"]`)?.textContent || 'This field');
      if (err) { setFieldError(id, err); valid = false; }
    });
    if (form.elements.ckEmail.value && Validate.email(form.elements.ckEmail.value)) { setFieldError('ckEmail', Validate.email(form.elements.ckEmail.value)); valid = false; }

    const method = form.elements.paymentMethod.value;
    if (method === 'card') {
      ['ckCardName','ckCardNumber','ckExpiry','ckCvc'].forEach(clearFieldError);
      if (!form.elements.ckCardName.value.trim()) { setFieldError('ckCardName', 'Cardholder name is required.'); valid = false; }
      if (form.elements.ckCardNumber.value.replace(/\s/g, '').length < 12) { setFieldError('ckCardNumber', 'Enter a valid demonstration card number.'); valid = false; }
      if (!/^\d{2}\/\d{2}$/.test(form.elements.ckExpiry.value.trim())) { setFieldError('ckExpiry', 'Use MM/YY format.'); valid = false; }
      if (!/^\d{3,4}$/.test(form.elements.ckCvc.value.trim())) { setFieldError('ckCvc', 'Enter a valid security code.'); valid = false; }
    }
    if (!valid) { focusFirstInvalid(form); showToast('Please fix the highlighted fields.', 'error'); return; }

    await new Promise(r => setTimeout(r, 1100)); // simulated processing state

    const paymentId = generateId('pay');
    const receiptNumber = 'STDY-' + Date.now().toString().slice(-8);
    rows.forEach(c => enrollInCourse(c.id, paymentId));

    const payment = {
      id: paymentId, userId: user.id, courses: rows.map(c => ({ id: c.id, title: c.title, price: c.price })),
      method, subtotal, discount, total, status: 'paid', createdAt: new Date().toISOString(),
    };
    const payments = getData('stdyio_payments', []); payments.push(payment); saveData('stdyio_payments', payments);

    const receipt = {
      id: generateId('rcp'), receiptNumber, paymentId, userId: user.id, name: form.elements.ckName.value.trim(),
      email: form.elements.ckEmail.value.trim(), courses: rows.map(c => c.title), method,
      subtotal, discount, total, status: 'Paid', createdAt: new Date().toISOString(),
    };
    const receipts = getData('stdyio_receipts', []); receipts.push(receipt); saveData('stdyio_receipts', receipts);

    saveData('stdyio_cart', getData('stdyio_cart', []).filter(i => i.userId !== user.id));
    addNotification(user.id, 'Payment confirmed', `Receipt ${receiptNumber} — ${formatCurrency(total)} paid. (Simulated email confirmation sent.)`, 'payment');

    renderReceipt(receipt);
  }));
}

function renderReceipt(receipt) {
  const mount = document.getElementById('checkoutMount');
  mount.innerHTML = `
    <div class="receipt-box animate-fade-up" style="max-width:560px; margin:0 auto;">
      <div class="text-center"><span class="chip chip-success">${Icons.check} Payment Successful</span>
        <h2 class="mt-4">Thank you, ${escapeHtml(receipt.name)}!</h2>
        <p>A simulated confirmation has been added to your notification centre — no real email was sent.</p></div>
      <div class="divider"></div>
      <div class="receipt-row"><span class="muted">Receipt Number</span><b>${receipt.receiptNumber}</b></div>
      <div class="receipt-row"><span class="muted">Student</span><b>${escapeHtml(receipt.name)}</b></div>
      <div class="receipt-row"><span class="muted">Email</span><b>${escapeHtml(receipt.email)}</b></div>
      <div class="receipt-row"><span class="muted">Courses</span><b style="text-align:right;">${receipt.courses.map(escapeHtml).join(', ')}</b></div>
      <div class="receipt-row"><span class="muted">Purchase Date</span><b>${formatDate(receipt.createdAt)}</b></div>
      <div class="receipt-row"><span class="muted">Payment Method</span><b style="text-transform:capitalize;">${receipt.method}</b></div>
      <div class="receipt-row"><span class="muted">Subtotal</span><b>${formatCurrency(receipt.subtotal)}</b></div>
      <div class="receipt-row"><span class="muted">Discount</span><b>${formatCurrency(receipt.discount)}</b></div>
      <div class="receipt-row" style="border-bottom:none;"><span class="muted">Total Paid</span><b style="font-size:1.15rem;">${formatCurrency(receipt.total)}</b></div>
      <div class="flex gap-3 mt-6">
        <button class="btn btn-secondary" id="printReceiptBtn">${Icons.print}Print Receipt</button>
        <button class="btn btn-secondary" id="downloadReceiptBtn">${Icons.download}Download</button>
        <a href="dashboard.html" class="btn btn-primary">View Enrolled Courses</a>
      </div>
    </div>`;
  document.getElementById('printReceiptBtn').addEventListener('click', () => window.print());
  document.getElementById('downloadReceiptBtn').addEventListener('click', () => downloadReceiptFile(receipt));
}

function downloadReceiptFile(receipt) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt ${receipt.receiptNumber}</title></head>
  <body style="font-family:Arial,sans-serif; padding:32px;">
    <h1>stdy.io Receipt</h1>
    <p><b>Receipt Number:</b> ${receipt.receiptNumber}</p>
    <p><b>Student:</b> ${receipt.name} (${receipt.email})</p>
    <p><b>Courses:</b> ${receipt.courses.join(', ')}</p>
    <p><b>Purchase Date:</b> ${formatDate(receipt.createdAt)}</p>
    <p><b>Payment Method:</b> ${receipt.method}</p>
    <p><b>Subtotal:</b> ${formatCurrency(receipt.subtotal)}</p>
    <p><b>Discount:</b> ${formatCurrency(receipt.discount)}</p>
    <p><b>Total Paid:</b> ${formatCurrency(receipt.total)}</p>
    <p><i>This is a demonstration receipt. No real payment was processed.</i></p>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `stdy.io-Receipt-${receipt.receiptNumber}.html`;
  a.click();
}
