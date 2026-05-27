/* ═══════════════════════════════════════════════
   KELVIN STORE — products.js
   Products listing page
═══════════════════════════════════════════════ */

let allProducts  = [];
let allCategories = [];
let activeFilters = {
  category: 'all',
  minPrice: 0,
  maxPrice: 1000000,
  sort: 'newest',
  search: '',
  filter: ''
};

// ── Debounce utility ──
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ── Read URL params ──
function readURLParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('category')) activeFilters.category = params.get('category');
  if (params.get('filter'))   activeFilters.filter   = params.get('filter');
  if (params.get('search'))   activeFilters.search   = params.get('search');
}

// ── Apply filters ──
function applyFilters(products, filters) {
  let result = [...products];

  // Category
  if (filters.category && filters.category !== 'all') {
    result = result.filter(p => p.category === filters.category);
  }

  // Quick filter
  if (filters.filter === 'sale') result = result.filter(p => p.onSale);
  if (filters.filter === 'new')  result = result.filter(p => p.isNew);

  // Price
  result = result.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);

  // Search
  if (filters.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }

  // Sort
  switch (filters.sort) {
    case 'price_asc':  result.sort((a,b) => a.price - b.price); break;
    case 'price_desc': result.sort((a,b) => b.price - a.price); break;
    case 'popular':    result.sort((a,b) => (b.sold||0) - (a.sold||0)); break;
    case 'newest':
    default:           result.sort((a,b) => (b.isNew?1:0) - (a.isNew?1:0)); break;
  }

  return result;
}

// ── Star render ──
function renderStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

// ── Render product card ──
function renderProductCard(p) {
  const badge = p.badge
    ? `<span class="product-badge badge-${p.badge.toLowerCase()}" style="background:${p.badgeColor||'#0A0A0A'}">${p.badge}</span>`
    : '';
  const origPrice = p.originalPrice && p.originalPrice > p.price
    ? `<span class="product-original-price">${formatPrice(p.originalPrice)}</span><span class="product-discount">-${p.discount}%</span>`
    : '';

  return `
    <div class="product-card reveal reveal-item" data-id="${p.id}">
      <div class="product-image-wrap">
        <a href="product.html?id=${p.id}">
          <img class="product-img" src="${p.images?.[0] || 'https://placehold.co/400x530/F5F5F5/0A0A0A?text=KELVIN'}" alt="${p.name}" loading="lazy">
        </a>
        ${badge}
      </div>
      <div class="product-info">
        <div class="product-category">${p.category || ''}</div>
        <a href="product.html?id=${p.id}" class="product-name">${p.name}</a>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating||5)}</span>
          <span style="color:var(--gray-500)">(${p.reviews||0})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${origPrice}
        </div>
        <button class="btn-add-cart" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.images?.[0]||''}" data-sku="${p.sku||''}">
          + KERANJANG
        </button>
      </div>
    </div>`;
}

// ── Render grid ──
function renderGrid(products) {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">◈</div>
        <div class="empty-state-title">Tidak Ada Produk</div>
        <p style="color:var(--gray-500);margin-bottom:24px">Coba ubah filter atau pencarian kamu.</p>
        <button class="btn-primary" onclick="resetAllFilters()">RESET FILTER</button>
      </div>`;
  } else {
    grid.innerHTML = products.map(renderProductCard).join('');
    bindAddToCart();
    if (typeof initScrollReveal === 'function') initScrollReveal();
  }

  if (countEl) countEl.textContent = `${products.length} produk`;
}

// ── Render active filter tags ──
function renderFilterTags() {
  const wrap = document.getElementById('active-filters');
  if (!wrap) return;
  const tags = [];

  if (activeFilters.category !== 'all') {
    const cat = allCategories.find(c => c.id === activeFilters.category);
    tags.push({ label: cat ? cat.name : activeFilters.category, key: 'category', value: 'all' });
  }
  if (activeFilters.filter) {
    tags.push({ label: activeFilters.filter.toUpperCase(), key: 'filter', value: '' });
  }
  if (activeFilters.search) {
    tags.push({ label: `"${activeFilters.search}"`, key: 'search', value: '' });
  }

  wrap.innerHTML = tags.map(t => `
    <span class="filter-tag" onclick="removeFilter('${t.key}','${t.value}')">
      ${t.label} <span class="filter-tag-remove">×</span>
    </span>`).join('');
}

function removeFilter(key, value) {
  if (key === 'category') activeFilters.category = 'all';
  else if (key === 'filter') activeFilters.filter = '';
  else if (key === 'search') {
    activeFilters.search = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
  }
  syncFilterUI();
  doFilter();
}

function resetAllFilters() {
  activeFilters = { category: 'all', minPrice: 0, maxPrice: 1000000, sort: 'newest', search: '', filter: '' };
  syncFilterUI();
  doFilter();
}

function syncFilterUI() {
  // Category options
  document.querySelectorAll('.filter-option[data-category]').forEach(el => {
    el.classList.toggle('active', el.dataset.category === activeFilters.category);
  });
  // Search
  const si = document.getElementById('search-input');
  if (si) si.value = activeFilters.search;
  // Sort
  const sortEl = document.getElementById('sort-select');
  if (sortEl) sortEl.value = activeFilters.sort;
  // Price
  const maxRange = document.getElementById('price-max');
  if (maxRange) maxRange.value = activeFilters.maxPrice;
  renderPriceDisplay();
}

function doFilter() {
  const filtered = applyFilters(allProducts, activeFilters);
  renderGrid(filtered);
  renderFilterTags();
}

function renderPriceDisplay() {
  const minEl = document.getElementById('price-min-display');
  const maxEl = document.getElementById('price-max-display');
  if (minEl) minEl.textContent = formatPrice(activeFilters.minPrice);
  if (maxEl) maxEl.textContent = formatPrice(activeFilters.maxPrice);
}

// ── Bind filter events ──
function bindFilterEvents() {
  // Category
  document.querySelectorAll('.filter-option[data-category]').forEach(el => {
    el.addEventListener('click', () => {
      activeFilters.category = el.dataset.category;
      document.querySelectorAll('.filter-option[data-category]').forEach(o => o.classList.remove('active'));
      el.classList.add('active');
      doFilter();
    });
  });

  // Price range
  const priceMax = document.getElementById('price-max');
  if (priceMax) {
    priceMax.addEventListener('input', () => {
      activeFilters.maxPrice = parseInt(priceMax.value);
      renderPriceDisplay();
      doFilter();
    });
  }

  // Sort
  const sortEl = document.getElementById('sort-select');
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      activeFilters.sort = sortEl.value;
      doFilter();
    });
  }

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = activeFilters.search;
    searchInput.addEventListener('input', debounce(() => {
      activeFilters.search = searchInput.value;
      doFilter();
    }, 300));
  }

  // Reset
  const resetBtn = document.getElementById('filter-reset');
  if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);

  // Mobile filter toggle
  const filterToggle = document.getElementById('mobile-filter-btn');
  const sidebar      = document.getElementById('filter-sidebar');
  const filterOverlay = document.getElementById('filter-overlay');

  if (filterToggle && sidebar) {
    filterToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      filterOverlay && filterOverlay.classList.toggle('open');
    });
  }

  if (filterOverlay && sidebar) {
    filterOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      filterOverlay.classList.remove('open');
    });
  }
}

// ── Bind add to cart (event delegation) ──
function bindAddToCart() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.btn-add-cart');
    if (!btn) return;
    Cart.add({
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price),
      image: btn.dataset.image,
      sku: btn.dataset.sku,
      size: '-',
      color: '-',
      qty: 1
    });
    openCart();
  });
}

// ── Render category filter options ──
function renderCategoryFilters(categories) {
  const wrap = document.getElementById('category-filters');
  if (!wrap) return;
  wrap.innerHTML = categories.map(cat => `
    <div class="filter-option${activeFilters.category === cat.id ? ' active' : ''}" data-category="${cat.id}">
      <span>${cat.icon || '◈'}</span>
      <span>${cat.name}</span>
      <span style="margin-left:auto;color:var(--gray-500);font-size:var(--text-xs)">${cat.count}</span>
    </div>`).join('');

  // Re-bind events
  document.querySelectorAll('.filter-option[data-category]').forEach(el => {
    el.addEventListener('click', () => {
      activeFilters.category = el.dataset.category;
      document.querySelectorAll('.filter-option[data-category]').forEach(o => o.classList.remove('active'));
      el.classList.add('active');
      doFilter();
    });
  });
}

// ── Init page ──
async function initProductsPage() {
  const dataPath = '../database/';

  // Load skeleton
  const grid = document.getElementById('products-grid');
  if (grid) {
    grid.innerHTML = Array(6).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line-sm"></div>
      </div>`).join('');
  }

  // Read URL params first
  readURLParams();

  // Fetch data
  [allProducts, allCategories] = await Promise.all([
    fetchJSON(dataPath + 'products.json'),
    fetchJSON(dataPath + 'categories.json')
  ]);

  // Update category counts
  allCategories = allCategories.map(cat => {
    if (cat.id === 'all') return { ...cat, count: allProducts.length };
    return { ...cat, count: allProducts.filter(p => p.category === cat.id).length };
  });

  // Set price range max from data
  const maxProductPrice = Math.max(...allProducts.map(p => p.price));
  const priceMax = document.getElementById('price-max');
  if (priceMax) {
    priceMax.max = maxProductPrice + 50000;
    if (activeFilters.maxPrice >= 1000000) {
      activeFilters.maxPrice = maxProductPrice + 50000;
      priceMax.value = priceMax.max;
    }
  }

  renderCategoryFilters(allCategories);
  renderPriceDisplay();
  syncFilterUI();
  bindFilterEvents();
  doFilter();
}

document.addEventListener('DOMContentLoaded', initProductsPage);
