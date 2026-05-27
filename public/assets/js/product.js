/* ═══════════════════════════════════════════════
   KELVIN STORE — product.js
   Product detail page
═══════════════════════════════════════════════ */

let currentProduct = null;
let selectedSize   = '';
let selectedColor  = '';
let currentQty     = 1;

// ── Get product ID from URL ──
function getProductIdFromURL() {
  return new URLSearchParams(location.search).get('id');
}

// ── Render gallery ──
function renderGallery(images) {
  const mainWrap = document.getElementById('gallery-main');
  const thumbsWrap = document.getElementById('gallery-thumbs');
  if (!mainWrap) return;

  const imgs = images && images.length > 0 ? images : ['https://placehold.co/600x700/F5F5F5/0A0A0A?text=KELVIN'];

  mainWrap.innerHTML = `<img id="gallery-main-img" src="${imgs[0]}" alt="${currentProduct?.name || 'Product'}" loading="eager">`;

  if (thumbsWrap) {
    thumbsWrap.innerHTML = imgs.map((src, i) => `
      <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}">
        <img src="${src}" alt="View ${i+1}" loading="lazy">
      </div>`).join('');
    initGalleryClick();
  }
}

function initGalleryClick() {
  const thumbs  = document.querySelectorAll('.gallery-thumb');
  const mainImg = document.getElementById('gallery-main-img');
  const imgs    = currentProduct?.images || [];

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      if (mainImg) mainImg.src = imgs[parseInt(thumb.dataset.idx)] || '';
    });
  });
}

// ── Render stars ──
function renderStars(rating) {
  const r = Math.round(rating * 2) / 2;
  return Array.from({length: 5}, (_, i) => i < Math.floor(r) ? '★' : (i < r ? '½' : '☆')).join('');
}

// ── Render product detail ──
function renderProductDetail(p) {
  currentProduct = p;

  // Breadcrumb
  const bcCurrent = document.getElementById('breadcrumb-current');
  if (bcCurrent) bcCurrent.textContent = p.name;

  // Gallery
  renderGallery(p.images);

  // Badge
  const badgeEl = document.getElementById('product-detail-badge');
  if (badgeEl) {
    badgeEl.innerHTML = p.badge
      ? `<span class="badge badge-${p.badge.toLowerCase()}" style="background:${p.badgeColor||'#0A0A0A'}">${p.badge}</span>`
      : '';
  }

  // Name
  const nameEl = document.getElementById('product-detail-name');
  if (nameEl) nameEl.textContent = p.name;

  // Rating & meta
  const metaEl = document.getElementById('product-detail-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <div class="product-detail-rating">
        <span class="stars">${renderStars(p.rating || 5)}</span>
        <span style="font-weight:700">${p.rating || 5}</span>
        <span style="color:var(--gray-500)">(${p.reviews || 0} ulasan)</span>
      </div>
      <span class="product-detail-sold" style="color:var(--gray-500)">${(p.sold || 0).toLocaleString('id-ID')} terjual</span>`;
  }

  // Price
  const priceEl = document.getElementById('product-detail-price');
  if (priceEl) priceEl.textContent = formatPrice(p.price);

  const origEl = document.getElementById('product-detail-original');
  if (origEl) {
    if (p.originalPrice && p.originalPrice > p.price) {
      origEl.innerHTML = `
        <span class="product-detail-orig-price">${formatPrice(p.originalPrice)}</span>
        <span class="product-detail-discount-badge">-${p.discount}%</span>`;
    } else {
      origEl.innerHTML = '';
    }
  }

  // Description
  const descEl = document.getElementById('product-short-desc');
  if (descEl) descEl.textContent = p.description || '';

  // Sizes
  initSizeSelector(p.sizes || []);

  // Colors
  initColorSelector(p.colors || []);

  // Stock
  const stockEl = document.getElementById('product-stock');
  if (stockEl) {
    const s = p.stock || 0;
    stockEl.innerHTML = s <= 5
      ? `<span class="stock-notice stock-low">⚠ Sisa ${s} item</span>`
      : `<span class="stock-notice stock-ok">✓ Stok ${s} item</span>`;
  }

  // SKU
  const skuEl = document.getElementById('product-sku');
  if (skuEl) skuEl.textContent = p.sku || '-';

  // Weight
  const weightEl = document.getElementById('product-weight');
  if (weightEl) weightEl.textContent = p.weight || '-';

  // Tabs — description
  const tabDescEl = document.getElementById('tab-desc-content');
  if (tabDescEl) tabDescEl.innerHTML = `<p style="line-height:1.8">${p.description || '-'}</p>`;

  // Tabs — specs
  const tabSpecEl = document.getElementById('tab-spec-content');
  if (tabSpecEl && p.specs) {
    tabSpecEl.innerHTML = `
      <table class="specs-table">
        <tbody>
          ${Object.entries(p.specs).map(([k,v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}
          <tr><th>SKU</th><td>${p.sku || '-'}</td></tr>
          <tr><th>Berat</th><td>${p.weight || '-'}</td></tr>
        </tbody>
      </table>`;
  }

  // Tabs — reviews placeholder
  const tabRevEl = document.getElementById('tab-review-content');
  if (tabRevEl) {
    tabRevEl.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--gray-500)">
        <div style="font-size:2.5rem;margin-bottom:12px">★</div>
        <div style="font-family:var(--font-display);font-size:var(--text-3xl);font-weight:900">${p.rating || 5}/5</div>
        <div style="margin-top:8px">Berdasarkan ${p.reviews || 0} ulasan</div>
        <p style="margin-top:24px;font-style:italic;opacity:0.6">Fitur ulasan segera hadir. Untuk sementara hubungi kami via WhatsApp.</p>
        <a href="https://wa.me/6285741137312" class="btn-whatsapp" style="margin-top:20px;display:inline-flex" target="_blank">
          TANYA KELVIN STORE
        </a>
      </div>`;
  }

  // Page title
  document.title = p.name + ' — KELVIN STORE';

  // Init qty
  initQtySelector(p.stock || 99);
}

// ── Size selector ──
function initSizeSelector(sizes) {
  const wrap = document.getElementById('size-pills');
  if (!wrap) return;

  if (!sizes || sizes.length === 0) {
    wrap.closest('.size-wrap') && (wrap.closest('.size-wrap').style.display = 'none');
    selectedSize = '-';
    return;
  }

  wrap.innerHTML = sizes.map(s => `
    <button class="size-pill" data-size="${s}">${s}</button>`).join('');

  wrap.querySelectorAll('.size-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      wrap.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      selectedSize = pill.dataset.size;
    });
  });
}

// ── Color selector ──
function initColorSelector(colors) {
  const wrap = document.getElementById('color-dots');
  if (!wrap) return;

  if (!colors || colors.length === 0) {
    wrap.closest('.color-wrap') && (wrap.closest('.color-wrap').style.display = 'none');
    selectedColor = '-';
    return;
  }

  wrap.innerHTML = colors.map(c => `
    <button class="color-dot" data-color="${c}">${c}</button>`).join('');

  wrap.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      wrap.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      selectedColor = dot.dataset.color;
    });
  });
}

// ── Qty selector ──
function initQtySelector(maxStock) {
  currentQty = 1;
  const qtyNum = document.getElementById('qty-num');
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus  = document.getElementById('qty-plus');

  if (qtyNum) qtyNum.textContent = currentQty;

  if (qtyMinus) {
    qtyMinus.addEventListener('click', () => {
      if (currentQty > 1) {
        currentQty--;
        if (qtyNum) qtyNum.textContent = currentQty;
      }
    });
  }

  if (qtyPlus) {
    qtyPlus.addEventListener('click', () => {
      if (currentQty < maxStock) {
        currentQty++;
        if (qtyNum) qtyNum.textContent = currentQty;
      }
    });
  }
}

// ── Add to cart ──
function initAddToCart() {
  const addBtn = document.getElementById('add-to-cart-btn');
  if (!addBtn || !currentProduct) return;

  addBtn.addEventListener('click', () => {
    if (currentProduct.sizes && currentProduct.sizes.length > 1 && !selectedSize) {
      showToast('Pilih ukuran terlebih dahulu!', 'error');
      document.getElementById('size-pills')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (currentProduct.colors && currentProduct.colors.length > 1 && !selectedColor) {
      showToast('Pilih warna terlebih dahulu!', 'error');
      return;
    }
    Cart.add({
      id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      image: currentProduct.images?.[0] || '',
      sku: currentProduct.sku,
      size: selectedSize || (currentProduct.sizes?.[0] || '-'),
      color: selectedColor || (currentProduct.colors?.[0] || '-'),
      qty: currentQty
    });
    openCart();
  });
}

// ── WhatsApp direct order ──
function initWhatsAppDirect() {
  const waBtn = document.getElementById('wa-direct-btn');
  if (!waBtn || !currentProduct) return;

  waBtn.addEventListener('click', () => {
    const size  = selectedSize  || currentProduct.sizes?.[0]  || '-';
    const color = selectedColor || currentProduct.colors?.[0] || '-';
    const items = [{
      name: currentProduct.name,
      size,
      color,
      qty: currentQty,
      price: currentProduct.price
    }];
    const total = (currentProduct.price * currentQty).toLocaleString('id-ID');
    const msg = STORE_CONFIG.formatOrderMessage(items, total);
    window.open(`https://wa.me/6285741137312?text=${msg}`, '_blank');
  });
}

// ── Load related products ──
async function loadRelated(category, excludeId) {
  const relatedWrap = document.getElementById('related-grid');
  if (!relatedWrap) return;

  const products = await fetchJSON('../database/products.json');
  const related  = products.filter(p => p.category === category && p.id !== excludeId).slice(0, 4);

  if (related.length === 0) {
    relatedWrap.closest('.related-section') && (relatedWrap.closest('.related-section').style.display = 'none');
    return;
  }

  relatedWrap.innerHTML = related.map(p => `
    <div class="product-card reveal reveal-item">
      <div class="product-image-wrap">
        <a href="product.html?id=${p.id}">
          <img class="product-img" src="${p.images?.[0] || 'https://placehold.co/400x530/F5F5F5/0A0A0A?text=KELVIN'}" alt="${p.name}" loading="lazy">
        </a>
        ${p.badge ? `<span class="product-badge badge-${p.badge.toLowerCase()}" style="background:${p.badgeColor||'#0A0A0A'}">${p.badge}</span>` : ''}
      </div>
      <div class="product-info">
        <a href="product.html?id=${p.id}" class="product-name">${p.name}</a>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${p.originalPrice && p.originalPrice > p.price ? `<span class="product-original-price">${formatPrice(p.originalPrice)}</span>` : ''}
        </div>
      </div>
    </div>`).join('');

  if (typeof initScrollReveal === 'function') initScrollReveal();
}

// ── Load product ──
async function loadProduct(id) {
  const products = await fetchJSON('../database/products.json');
  const product  = products.find(p => p.id === id);

  if (!product) {
    const main = document.getElementById('product-main');
    if (main) {
      main.innerHTML = `
        <div style="text-align:center;padding:80px 24px">
          <div style="font-size:3rem;margin-bottom:16px">◈</div>
          <h2 style="font-family:var(--font-display);font-size:var(--text-3xl)">PRODUK TIDAK DITEMUKAN</h2>
          <p style="color:var(--gray-500);margin:16px 0">Produk yang kamu cari tidak ada atau sudah tidak tersedia.</p>
          <a href="products.html" class="btn-primary">LIHAT SEMUA PRODUK</a>
        </div>`;
    }
    return;
  }

  renderProductDetail(product);
  initAddToCart();
  initWhatsAppDirect();
  loadRelated(product.category, product.id);
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const id = getProductIdFromURL();
  if (id) {
    loadProduct(id);
  } else {
    // No id → redirect to products
    location.href = 'products.html';
  }
});
