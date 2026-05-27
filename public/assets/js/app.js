/* ═══════════════════════════════════════════════
   KELVIN STORE — app.js
   Core: fetch, cart, nav, toast
═══════════════════════════════════════════════ */

/* ── Helpers ── */
async function fetchJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('fetchJSON error:', path, e.message);
    return [];
  }
}

function formatPrice(n) {
  if (typeof n !== 'number') return 'Rp 0';
  return 'Rp ' + n.toLocaleString('id-ID');
}

function getDataPath() {
  // All HTML pages live in /public/, database is at ../database/ relative to them
  return '../database/';
}

function getScriptPath() {
  // All HTML pages are in /public/, so products.html is a sibling
  return '';
}

/* ── Settings ── */
async function loadSettings() {
  try {
    const path = getDataPath() + 'settings.json';
    const s = await fetchJSON(path);
    if (s && s.storeName) {
      const title = document.querySelector('title');
      if (title && !title.dataset.custom) title.textContent = s.storeName + ' — ' + (title.dataset.page || 'Store');
      const logos = document.querySelectorAll('.nav-logo, .footer-logo');
      logos.forEach(el => { if (el.dataset.static !== 'true') el.textContent = s.logo || s.storeName; });
    }
  } catch(e) {}
}

/* ── Cart ── */
const Cart = {
  _key: 'kelvinstore_cart',

  get() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch(e) { return []; }
  },

  save(items) {
    localStorage.setItem(this._key, JSON.stringify(items));
  },

  add(item) {
    const items = this.get();
    const existIdx = items.findIndex(i => i.id === item.id && i.size === item.size && i.color === item.color);
    if (existIdx >= 0) {
      items[existIdx].qty = (items[existIdx].qty || 1) + (item.qty || 1);
    } else {
      items.push({ ...item, qty: item.qty || 1 });
    }
    this.save(items);
    updateCartBadge();
    renderCartDrawer();
    showToast('✦ ' + item.name + ' ditambahkan!', 'success');
    bounceBadge();
  },

  remove(id, size, color) {
    const items = this.get().filter(i => !(i.id === id && i.size === size && i.color === color));
    this.save(items);
    updateCartBadge();
    renderCartDrawer();
  },

  updateQty(id, size, color, qty) {
    const items = this.get();
    const idx = items.findIndex(i => i.id === id && i.size === size && i.color === color);
    if (idx >= 0) {
      if (qty < 1) qty = 1;
      items[idx].qty = qty;
      this.save(items);
      updateCartBadge();
      renderCartDrawer();
    }
  },

  clear() {
    this.save([]);
    updateCartBadge();
    renderCartDrawer();
  },

  total() {
    return this.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  count() {
    return this.get().reduce((sum, i) => sum + i.qty, 0);
  }
};

/* ── Cart UI ── */
function openCart() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-overlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = Cart.count();
  badges.forEach(badge => {
    badge.textContent = count;
    badge.classList.toggle('show', count > 0);
  });
}

function bounceBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(badge => {
    badge.classList.remove('cart-badge-bounce');
    void badge.offsetWidth;
    badge.classList.add('cart-badge-bounce');
    setTimeout(() => badge.classList.remove('cart-badge-bounce'), 400);
  });
}

function renderCartDrawer() {
  const container = document.getElementById('cart-items');
  const footer    = document.getElementById('cart-footer');
  const titleEl   = document.getElementById('cart-title-count');
  if (!container) return;

  const items = Cart.get();
  const total = Cart.total();
  const count = Cart.count();

  if (titleEl) titleEl.textContent = `CART (${count} item${count !== 1 ? 's' : ''})`;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <div class="cart-empty-text">Belum ada produk di cart</div>
        <a href="${getScriptPath()}products.html" class="btn-primary" style="margin-top:16px;" onclick="closeCart()">Shop Now</a>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  container.innerHTML = items.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image || 'https://placehold.co/72x90/F5F5F5/0A0A0A?text=IMG'}" alt="${item.name}" loading="lazy">
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-variant">${[item.size, item.color].filter(Boolean).join(' · ')}</div>
        <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
        <div class="cart-qty-row">
          <button class="cart-qty-btn" onclick="Cart.updateQty('${item.id}','${item.size||''}','${item.color||''}',${item.qty - 1})" aria-label="Kurang">−</button>
          <span class="cart-qty-num">${item.qty}</span>
          <button class="cart-qty-btn" onclick="Cart.updateQty('${item.id}','${item.size||''}','${item.color||''}',${item.qty + 1})" aria-label="Tambah">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="Cart.remove('${item.id}','${item.size||''}','${item.color||''}')" aria-label="Hapus">×</button>
    </div>`).join('');

  const subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) subtotalEl.textContent = formatPrice(total);
}

function orderViaWhatsApp() {
  const items = Cart.get();
  if (items.length === 0) { showToast('Cart masih kosong!', 'error'); return; }
  const total = Cart.total().toLocaleString('id-ID');
  const msg = STORE_CONFIG.formatOrderMessage(items, total);
  window.open(`https://wa.me/6285741137312?text=${msg}`, '_blank');
}

/* ── Toast ── */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('out');
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ── Nav ── */
function initNav() {
  // Mark active nav link
  const links = document.querySelectorAll('.nav-links a, .mobile-nav-links a');
  const page = location.pathname.split('/').pop() || 'index.html';
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html') || (page === 'index.html' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Hamburger
  const burger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-nav-close');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => mobileNav.classList.add('open'));
  }
  if (mobileClose && mobileNav) {
    mobileClose.addEventListener('click', () => mobileNav.classList.remove('open'));
  }
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileNav.classList.remove('open'));
    });
  }

  // Cart button
  const cartBtns = document.querySelectorAll('.cart-btn');
  cartBtns.forEach(btn => btn.addEventListener('click', openCart));

  // Cart overlay close
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.addEventListener('click', closeCart);

  // Cart close button
  const cartClose = document.getElementById('cart-close');
  if (cartClose) cartClose.addEventListener('click', closeCart);

  // WA order btn in cart
  const waBtn = document.getElementById('cart-wa-btn');
  if (waBtn) waBtn.addEventListener('click', orderViaWhatsApp);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateCartBadge();
  renderCartDrawer();
  initNav();
});
