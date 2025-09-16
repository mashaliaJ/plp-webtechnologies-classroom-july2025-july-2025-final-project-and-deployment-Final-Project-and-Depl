/* script.js
   Unified front-end behavior for all pages (slider, forms, cart, footer year, etc.)
   Drop into your project root and include before </body>.
*/
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));

  document.addEventListener('DOMContentLoaded', () => {
    // ---------- 1) Dynamic footer year ----------
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ---------- 2) Mobile nav toggle (optional markup) ----------
    // If you want this to work, add an element with id="menuToggle" and a <nav><ul>...</ul></nav>
    const menuToggle = document.getElementById('menuToggle');
    const navUl = document.querySelector('header nav ul');
    if (menuToggle && navUl) {
      menuToggle.addEventListener('click', () => navUl.classList.toggle('show'));
    }

    // ---------- 3) Image slider ----------
    // Supports:
    //  - <div class="slider"><div class="slides"><img>...</div></div>
    //  - <div class="slider"><img class="slide">...</div>
    //  - <img class="slide">...
    let slideImgs = $$('.slider .slides img');
    if (slideImgs.length === 0) slideImgs = $$('.slider img');
    if (slideImgs.length === 0) slideImgs = $$('.slide');

    let slideIndex = 0;
    function showSlide(i) {
      if (!slideImgs.length) return;
      slideImgs.forEach((img, idx) => {
        img.style.display = idx === i ? 'block' : 'none';
      });
    }

    // Expose global functions for inline onclick (if your page uses them)
    window.nextSlide = function () {
      if (!slideImgs.length) return;
      slideIndex = (slideIndex + 1) % slideImgs.length;
      showSlide(slideIndex);
    };
    window.prevSlide = function () {
      if (!slideImgs.length) return;
      slideIndex = (slideIndex - 1 + slideImgs.length) % slideImgs.length;
      showSlide(slideIndex);
    };

    if (slideImgs.length) {
      showSlide(slideIndex);
      // attach prev/next buttons if present
      const prevBtn = document.querySelector('.prev');
      const nextBtn = document.querySelector('.next');
      if (prevBtn) prevBtn.addEventListener('click', window.prevSlide);
      if (nextBtn) nextBtn.addEventListener('click', window.nextSlide);
      // autoplay
      setInterval(window.nextSlide, 3000);
    }

    // ---------- 4) Scroll-to-top button ----------
    const scrollBtn = document.createElement('button');
    scrollBtn.id = 'scrollTopBtn';
    scrollBtn.title = 'Back to top';
    scrollBtn.innerHTML = '&#8679;';
    Object.assign(scrollBtn.style, {
      position: 'fixed',
      right: '18px',
      bottom: '18px',
      padding: '10px 12px',
      display: 'none',
      background: '#111',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      zIndex: 1000
    });
    document.body.appendChild(scrollBtn);

    window.addEventListener('scroll', () => {
      scrollBtn.style.display = window.scrollY > 200 ? 'block' : 'none';
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ---------- 5) Contact form validation ----------
    const contactForm = $('#contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#name') ? $('#name').value.trim() : '';
        const email = $('#email') ? $('#email').value.trim() : '';
        const phone = $('#phone') ? $('#phone').value.trim() : '';
        const message = $('#message') ? $('#message').value.trim() : '';

        if (!name || !email || !phone || !message) {
          alert('⚠ Please fill in all fields.');
          return;
        }

        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email)) {
          alert('⚠ Please enter a valid email address.');
          return;
        }

        // phone: allow + and digits; require at least 7 digits
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 7) {
          alert('⚠ Please enter a valid phone number (at least 7 digits).');
          return;
        }

        // For now: success message (replace with AJAX to server later)
        alert('✅ Message sent successfully! Thank you.');
        contactForm.reset();
      });
    }

    // ---------- 6) Simple product "Add to Cart" handling ----------
    // Works when each .product-item contains at least: <h3>Title</h3>, an <img>, and a price inside a <p> (or data-price attribute).
    const productList = document.querySelector('.product-list');
    // cart stored globally at window.cart to assist debugging
    window.cart = JSON.parse(localStorage.getItem('cart') || '[]');

    function saveCart() {
      localStorage.setItem('cart', JSON.stringify(window.cart));
      updateCartCount();
    }
    function updateCartCount() {
      const el = document.getElementById('cart-count');
      if (el) el.textContent = window.cart.reduce((s, i) => s + (Number(i.qty) || 1), 0);
    }
    updateCartCount();

    // Add-to-cart via clicking "Add to Cart" button within .product-list
    if (productList) {
      productList.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const text = btn.textContent.trim().toLowerCase();
        // treat any button that contains "add to cart" or has class add-to-cart
        if (text.includes('add to cart') || btn.classList.contains('add-to-cart')) {
          const itemDiv = btn.closest('.product-item');
          if (!itemDiv) return;

          const title = itemDiv.querySelector('h3') ? itemDiv.querySelector('h3').textContent.trim() : (itemDiv.dataset.title || 'Product');
          // price detection: <p><strong>$XX</strong></p> or .price element or data-price
          let price = 0;
          const strongPrice = itemDiv.querySelector('p strong');
          if (strongPrice) price = parseFloat((strongPrice.textContent || '').replace(/[^0-9.]/g, '')) || 0;
          else if (itemDiv.querySelector('.price')) price = parseFloat((itemDiv.querySelector('.price').textContent || '').replace(/[^0-9.]/g, '')) || 0;
          else price = parseFloat(itemDiv.dataset.price || '0') || 0;

          const img = itemDiv.querySelector('img') ? itemDiv.querySelector('img').getAttribute('src') : '';
          // product payload
          const productObj = { id: Date.now(), title, price, img, qty: 1 };
          // merge if same title+price exists (simple approach)
          const found = window.cart.find(i => i.title === title && Number(i.price) === Number(price));
          if (found) found.qty = (Number(found.qty) || 1) + 1;
          else window.cart.push(productObj);
          saveCart();
          alert(`"${title}" added to cart`);
        }
      });
    }

    // ---------- 7) Cart page rendering ----------
    const cartTable = document.querySelector('.cart-table');
    if (cartTable) {
      const tbody = cartTable.querySelector('tbody') || cartTable.appendChild(document.createElement('tbody'));
      tbody.innerHTML = '';
      let subtotal = 0;
      window.cart.forEach((it, idx) => {
        const q = Number(it.qty) || 1;
        const priceNum = Number(it.price) || 0;
        const total = q * priceNum;
        subtotal += total;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(it.title)}</td>
          <td>${escapeHtml(it.variation || '-')}</td>
          <td>$${priceNum.toFixed(2)}</td>
          <td><input type="number" min="1" value="${q}" data-index="${idx}" class="cart-qty"></td>
          <td>$${total.toFixed(2)}</td>
          <td><button class="remove-item" data-index="${idx}">Remove</button></td>
        `;
        tbody.appendChild(tr);
      });

      // update summary (if .cart-summary exists)
      const summary = document.querySelector('.cart-summary');
      if (summary) {
        // remove previous if any
        summary.querySelectorAll('.calc-line').forEach(n => n.remove());
        const tax = +(subtotal * 0.05);
        const grand = subtotal + tax;
        const subP = document.createElement('p'); subP.className = 'calc-line subtotal'; subP.innerHTML = `Subtotal: <strong>$${subtotal.toFixed(2)}</strong>`;
        const taxP = document.createElement('p'); taxP.className = 'calc-line tax'; taxP.innerHTML = `Tax (5%): <strong>$${tax.toFixed(2)}</strong>`;
        const grandP = document.createElement('p'); grandP.className = 'calc-line grand'; grandP.innerHTML = `Grand Total: <strong>$${grand.toFixed(2)}</strong>`;
        summary.insertBefore(grandP, summary.firstChild);
        summary.insertBefore(taxP, summary.firstChild);
        summary.insertBefore(subP, summary.firstChild);
      }

      // event handling: remove & quantity change
      tbody.addEventListener('click', (e) => {
        const rem = e.target.closest('.remove-item');
        if (!rem) return;
        const idx = Number(rem.dataset.index);
        if (!Number.isNaN(idx)) {
          window.cart.splice(idx, 1);
          saveCart();
          location.reload();
        }
      });

      tbody.addEventListener('change', (e) => {
        const inp = e.target.closest('.cart-qty');
        if (!inp) return;
        const idx = Number(inp.dataset.index);
        const newQty = Math.max(1, Number(inp.value) || 1);
        if (!Number.isNaN(idx)) {
          window.cart[idx].qty = newQty;
          saveCart();
          location.reload();
        }
      });
    }

    // ---------- 8) Checkout button ----------
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (!window.cart || window.cart.length === 0) {
          alert('Your cart is empty.');
          return;
        }
        // placeholder: integrate with backend to create order
        alert('Checkout started (demo). In production this will POST to your server.');
        // optional: clear cart after demo
        // window.cart = []; saveCart(); location.href = 'index.html';
      });
    }

    // ---------- helpers ----------
    updateCartCount();

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/[&<>"'`=\/]/g, function (s) {
        return ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
        })[s];
      });
    }
  }); // DOMContentLoaded
})(); // IIFE
