/* ═══════════════════════════════════════════════
   KELVIN STORE — dashboard.js
   Admin Dashboard
═══════════════════════════════════════════════ */

// ── DB wrapper (localStorage) ──
const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch(e) { return null; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch(e) { return false; }
  },
  remove(key) { localStorage.removeItem(key); }
};

const KEYS = {
  products:   'kelvinstore_dashboard_products',
  banners:    'kelvinstore_dashboard_banners',
  categories: 'kelvinstore_dashboard_categories',
  settings:   'kelvinstore_dashboard_settings',
  seeded:     'kelvinstore_dashboard_seeded'
};

let currentTab    = 'overview';
let editingProduct = null;
let editingBanner  = null;
let editingCategory = null;

// ── Seed data from JSON files ──
async function seedData() {
  if (DB.get(KEYS.seeded)) return;
  try {
    const [products, banners, categories, settings] = await Promise.all([
      fetchJSON('../../database/products.json'),
      fetchJSON('../../database/banners.json'),
      fetchJSON('../../database/categories.json'),
      fetchJSON('../../database/settings.json')
    ]);
    if (products && products.length) DB.set(KEYS.products, products);
    if (banners && banners.length)   DB.set(KEYS.banners, banners);
    if (categories && categories.length) DB.set(KEYS.categories, categories);
    if (settings && settings.storeName) DB.set(KEYS.settings, settings);
    DB.set(KEYS.seeded, true);
  } catch(e) { console.warn('Seed failed:', e); }
}

// ── Format price ──
function fmtPrice(n) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

// ── Tab switching ──
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.sidebar-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
  document.querySelectorAll('.dashboard-page').forEach(el => {
    el.classList.toggle('active', el.id === 'page-' + tab);
  });
  history.replaceState(null, '', '#' + tab);

  switch(tab) {
    case 'overview':   renderOverview();    break;
    case 'products':   renderProductsTab(); break;
    case 'banners':    renderBannersTab();  break;
    case 'categories': renderCategoriesTab(); break;
    case 'settings':   renderSettingsTab(); break;
  }
}

// ── Overview ──
function renderOverview() {
  const products   = DB.get(KEYS.products) || [];
  const categories = DB.get(KEYS.categories) || [];
  const lowStock   = products.filter(p => (p.stock || 0) < 5).length;
  const totalSold  = products.reduce((s, p) => s + (p.sold || 0), 0);

  setEl('stat-total-products', products.length);
  setEl('stat-total-categories', categories.filter(c => c.id !== 'all').length);
  setEl('stat-low-stock', lowStock);
  setEl('stat-total-sold', totalSold.toLocaleString('id-ID'));

  // Recent products table
  const tbody = document.getElementById('recent-products-tbody');
  if (!tbody) return;
  const recent = [...products].slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--gray-500)">Belum ada produk</td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map(p => `
    <tr>
      <td><img class="td-img" src="${p.images?.[0] || 'https://placehold.co/48x60/F5F5F5/0A0A0A?text=IMG'}" alt="${p.name}"></td>
      <td><div class="td-name">${p.name}</div></td>
      <td style="text-transform:capitalize">${p.category || '-'}</td>
      <td class="td-price">${fmtPrice(p.price)}</td>
      <td class="td-stock ${(p.stock||0) < 5 ? 'low' : 'ok'}">${p.stock || 0}</td>
    </tr>`).join('');
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Products Tab ──
function renderProductsTab(searchQuery = '') {
  let products = DB.get(KEYS.products) || [];
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q));
  }

  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--gray-500)">
      <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;text-transform:uppercase">Belum Ada Produk</div>
      <p style="margin-top:8px">Klik "+ ADD PRODUCT" untuk menambahkan produk.</p>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img class="td-img" src="${p.images?.[0] || 'https://placehold.co/48x60/F5F5F5/0A0A0A?text=IMG'}" alt="${p.name}"></td>
      <td><div class="td-name">${p.name}</div><div style="font-size:var(--text-xs);color:var(--gray-500)">${p.sku||''}</div></td>
      <td style="text-transform:capitalize">${p.category || '-'}</td>
      <td class="td-price">${fmtPrice(p.price)}</td>
      <td class="td-stock ${(p.stock||0) < 5 ? 'low' : 'ok'}">${p.stock || 0}</td>
      <td>${p.badge ? `<span class="badge badge-${p.badge.toLowerCase()}" style="background:${p.badgeColor||'#0A0A0A'}">${p.badge}</span>` : '—'}</td>
      <td>
        <div class="td-actions">
          <button class="btn-table btn-table-edit" onclick="openProductModal('${p.id}')">Edit</button>
          <button class="btn-table btn-table-delete" onclick="confirmDeleteProduct('${p.id}','${p.name.replace(/'/g,"\\'")}')">Hapus</button>
        </div>
      </td>
    </tr>`).join('');
}

// ── Banners Tab ──
function renderBannersTab() {
  const banners = DB.get(KEYS.banners) || [];
  const grid = document.getElementById('banners-grid');
  if (!grid) return;

  if (banners.length === 0) {
    grid.innerHTML = `<div class="dash-empty"><div class="dash-empty-title">Belum Ada Banner</div></div>`;
    return;
  }

  grid.innerHTML = banners.map(b => `
    <div class="banner-card">
      <div class="banner-preview" style="background:${b.bgColor||'#FAFAFA'};color:${b.textColor||'#0A0A0A'}">
        ${b.title || 'BANNER'}
      </div>
      <div class="banner-info">
        <div class="banner-info-title">${b.title || ''}</div>
        <div class="banner-info-sub">${b.subtitle || ''} — ${b.cta || ''}</div>
        <div class="banner-actions">
          <label class="toggle">
            <input type="checkbox" ${b.active ? 'checked' : ''} onchange="toggleBanner('${b.id}', this.checked)">
            <div class="toggle-track"><div class="toggle-thumb"></div></div>
            <span class="toggle-label">${b.active ? 'Aktif' : 'Nonaktif'}</span>
          </label>
          <div style="display:flex;gap:8px">
            <button class="btn-table btn-table-edit" onclick="openBannerModal('${b.id}')">Edit</button>
            <button class="btn-table btn-table-delete" onclick="confirmDeleteBanner('${b.id}','${(b.title||'').replace(/'/g,"\\'")}')">Hapus</button>
          </div>
        </div>
      </div>
    </div>`).join('');
}

// ── Categories Tab ──
function renderCategoriesTab() {
  const categories = DB.get(KEYS.categories) || [];
  const products   = DB.get(KEYS.products) || [];
  const list = document.getElementById('categories-list');
  if (!list) return;

  const filtered = categories.filter(c => c.id !== 'all');

  if (filtered.length === 0) {
    list.innerHTML = `<div class="dash-empty"><div class="dash-empty-title">Belum Ada Kategori</div></div>`;
    return;
  }

  list.innerHTML = filtered.map(cat => {
    const count = products.filter(p => p.category === cat.id).length;
    return `
      <div class="category-row">
        <span class="category-row-icon">${cat.icon || '◈'}</span>
        <span class="category-row-name">${cat.name}</span>
        <span class="category-row-count">${count} produk</span>
        <div class="td-actions">
          <button class="btn-table btn-table-edit" onclick="openCategoryModal('${cat.id}')">Edit</button>
          <button class="btn-table btn-table-delete" onclick="confirmDeleteCategory('${cat.id}','${cat.name.replace(/'/g,"\\'")}')">Hapus</button>
        </div>
      </div>`;
  }).join('');
}

// ── Settings Tab ──
function renderSettingsTab() {
  const s = DB.get(KEYS.settings) || {};
  const fields = ['storeName','storeTagline','email','whatsapp','address','shippingNote','orderNote'];
  fields.forEach(key => {
    const el = document.getElementById('setting-' + key);
    if (el) el.value = s[key] || '';
  });
  const tiktok  = document.getElementById('setting-tiktok');
  const youtube = document.getElementById('setting-youtube');
  const accent  = document.getElementById('setting-accentColor');
  const accentVal = document.getElementById('setting-accentValue');
  if (tiktok)  tiktok.value  = s.socialLinks?.tiktok  || '';
  if (youtube) youtube.value = s.socialLinks?.youtube || '';
  if (accent)  { accent.value = s.accentColor || '#FFE500'; }
  if (accentVal) accentVal.textContent = s.accentColor || '#FFE500';
}

function saveSettings() {
  const s = DB.get(KEYS.settings) || {};
  const fields = ['storeName','storeTagline','email','whatsapp','address','shippingNote','orderNote'];
  fields.forEach(key => {
    const el = document.getElementById('setting-' + key);
    if (el) s[key] = el.value;
  });
  const tiktok  = document.getElementById('setting-tiktok');
  const youtube = document.getElementById('setting-youtube');
  const accent  = document.getElementById('setting-accentColor');
  if (!s.socialLinks) s.socialLinks = {};
  if (tiktok)  s.socialLinks.tiktok  = tiktok.value;
  if (youtube) s.socialLinks.youtube = youtube.value;
  if (accent)  s.accentColor = accent.value;
  DB.set(KEYS.settings, s);
  showDashToast('✦ Pengaturan disimpan!', 'success');
}

// ── Modal ──
function openModal(title, bodyHTML, footerHTML) {
  const overlay = document.getElementById('modal-overlay');
  const titleEl = document.getElementById('modal-title');
  const bodyEl  = document.getElementById('modal-body');
  const footerEl = document.getElementById('modal-footer');
  if (!overlay) return;
  if (titleEl)  titleEl.textContent = title;
  if (bodyEl)   bodyEl.innerHTML = bodyHTML;
  if (footerEl) footerEl.innerHTML = footerHTML;
  overlay.classList.add('open');
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
  editingProduct  = null;
  editingBanner   = null;
  editingCategory = null;
}

// ── Product Modal ──
function openProductModal(id) {
  const products   = DB.get(KEYS.products) || [];
  const categories = DB.get(KEYS.categories) || [];
  const p = id ? products.find(x => x.id === id) : null;
  editingProduct = p || null;

  const catOptions = categories.filter(c => c.id !== 'all')
    .map(c => `<option value="${c.id}" ${p?.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('');

  const badgeOptions = ['', 'NEW', 'SALE', 'HOT'].map(b =>
    `<option value="${b}" ${(p?.badge||'') === b ? 'selected' : ''}>${b || '— Tidak Ada —'}</option>`).join('');

  const body = `
    <div class="form-row">
      <div class="form-group">
        <label>Nama Produk *</label>
        <input type="text" id="pf-name" value="${p?.name || ''}" placeholder="Kelvin Classic Tee" required>
      </div>
      <div class="form-group">
        <label>SKU</label>
        <input type="text" id="pf-sku" value="${p?.sku || ''}" placeholder="KLV-TEE-001">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Kategori</label>
        <select id="pf-category" class="sort-select">${catOptions}</select>
      </div>
      <div class="form-group">
        <label>Badge</label>
        <select id="pf-badge" class="sort-select">${badgeOptions}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Harga (Rp) *</label>
        <input type="number" id="pf-price" value="${p?.price || ''}" placeholder="185000" required>
      </div>
      <div class="form-group">
        <label>Harga Asli (Rp)</label>
        <input type="number" id="pf-originalPrice" value="${p?.originalPrice || ''}" placeholder="250000">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Stok</label>
        <input type="number" id="pf-stock" value="${p?.stock || 0}" min="0">
      </div>
      <div class="form-group">
        <label>Berat</label>
        <input type="text" id="pf-weight" value="${p?.weight || ''}" placeholder="300g">
      </div>
    </div>
    <div class="form-group">
      <label>Deskripsi</label>
      <textarea id="pf-description" rows="3" style="resize:vertical">${p?.description || ''}</textarea>
    </div>
    <div class="form-group">
      <label>URL Gambar 1</label>
      <input type="text" id="pf-img1" value="${p?.images?.[0] || ''}" placeholder="https://...">
    </div>
    <div class="form-group">
      <label>URL Gambar 2</label>
      <input type="text" id="pf-img2" value="${p?.images?.[1] || ''}" placeholder="https://...">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Ukuran (pisah koma)</label>
        <input type="text" id="pf-sizes" value="${(p?.sizes||[]).join(', ')}" placeholder="S, M, L, XL, XXL">
      </div>
      <div class="form-group">
        <label>Warna (pisah koma)</label>
        <input type="text" id="pf-colors" value="${(p?.colors||[]).join(', ')}" placeholder="Black, White">
      </div>
    </div>
    <div class="form-row" style="gap:16px;margin-top:4px">
      <label class="form-check"><input type="checkbox" id="pf-featured" ${p?.featured?'checked':''}><label for="pf-featured" style="margin-bottom:0;text-transform:none;letter-spacing:0;font-weight:500;font-size:var(--text-sm)">Featured</label></label>
      <label class="form-check"><input type="checkbox" id="pf-isNew" ${p?.isNew?'checked':''}><label for="pf-isNew" style="margin-bottom:0;text-transform:none;letter-spacing:0;font-weight:500;font-size:var(--text-sm)">New</label></label>
      <label class="form-check"><input type="checkbox" id="pf-onSale" ${p?.onSale?'checked':''}><label for="pf-onSale" style="margin-bottom:0;text-transform:none;letter-spacing:0;font-weight:500;font-size:var(--text-sm)">On Sale</label></label>
    </div>`;

  const footer = `
    <button class="btn-ghost" onclick="closeModal()">BATAL</button>
    <button class="btn-primary" onclick="saveProduct()">SIMPAN PRODUK</button>`;

  openModal(p ? 'EDIT PRODUK' : 'TAMBAH PRODUK', body, footer);
}

function saveProduct() {
  const name  = document.getElementById('pf-name')?.value.trim();
  const price = parseInt(document.getElementById('pf-price')?.value);
  if (!name)  { showDashToast('Nama produk wajib diisi!', 'error'); return; }
  if (!price) { showDashToast('Harga wajib diisi!', 'error'); return; }

  const products = DB.get(KEYS.products) || [];
  const origPrice = parseInt(document.getElementById('pf-originalPrice')?.value) || price;
  const discount  = origPrice > price ? Math.round((1 - price/origPrice) * 100) : 0;
  const badge     = document.getElementById('pf-badge')?.value;
  const badgeColors = { NEW: '#00C853', SALE: '#FF3D00', HOT: '#FF6D00' };
  const img1 = document.getElementById('pf-img1')?.value.trim();
  const img2 = document.getElementById('pf-img2')?.value.trim();
  const category = document.getElementById('pf-category')?.value;
  const sizes  = document.getElementById('pf-sizes')?.value.split(',').map(s=>s.trim()).filter(Boolean);
  const colors = document.getElementById('pf-colors')?.value.split(',').map(s=>s.trim()).filter(Boolean);

  const productData = {
    id:            editingProduct?.id || 'p' + Date.now(),
    name,
    slug:          name.toLowerCase().replace(/\s+/g, '-'),
    price,
    originalPrice: origPrice,
    discount,
    category,
    images:        [img1, img2].filter(Boolean),
    badge:         badge || null,
    badgeColor:    badge ? (badgeColors[badge] || '#0A0A0A') : null,
    description:   document.getElementById('pf-description')?.value.trim() || '',
    specs:         editingProduct?.specs || {},
    sizes,
    colors,
    stock:         parseInt(document.getElementById('pf-stock')?.value) || 0,
    sold:          editingProduct?.sold || 0,
    rating:        editingProduct?.rating || 5.0,
    reviews:       editingProduct?.reviews || 0,
    featured:      document.getElementById('pf-featured')?.checked || false,
    isNew:         document.getElementById('pf-isNew')?.checked || false,
    onSale:        document.getElementById('pf-onSale')?.checked || false,
    weight:        document.getElementById('pf-weight')?.value.trim() || '',
    sku:           document.getElementById('pf-sku')?.value.trim() || ''
  };

  if (editingProduct) {
    const idx = products.findIndex(p => p.id === editingProduct.id);
    if (idx >= 0) products[idx] = productData;
  } else {
    products.unshift(productData);
  }

  DB.set(KEYS.products, products);
  closeModal();
  renderProductsTab();
  showDashToast('✦ Produk berhasil disimpan!', 'success');
}

function confirmDeleteProduct(id, name) {
  openModal('HAPUS PRODUK',
    `<div class="confirm-dialog">
      <p>Yakin ingin menghapus produk ini?</p>
      <strong>${name}</strong>
      <p style="margin-top:8px;color:var(--gray-500);font-size:var(--text-sm)">Tindakan ini tidak bisa dibatalkan.</p>
    </div>`,
    `<button class="btn-ghost" onclick="closeModal()">BATAL</button>
     <button class="btn-secondary" onclick="deleteProduct('${id}')" style="background:#FF3D00;border-color:#FF3D00">HAPUS</button>`
  );
}

function deleteProduct(id) {
  const products = (DB.get(KEYS.products) || []).filter(p => p.id !== id);
  DB.set(KEYS.products, products);
  closeModal();
  renderProductsTab();
  showDashToast('Produk dihapus.', 'success');
}

// ── Banner Modal ──
function openBannerModal(id) {
  const banners = DB.get(KEYS.banners) || [];
  const b = banners.find(x => x.id === id);
  if (!b) return;
  editingBanner = b;

  const body = `
    <div class="form-group">
      <label>Title</label>
      <input type="text" id="bf-title" value="${b.title || ''}">
    </div>
    <div class="form-group">
      <label>Subtitle</label>
      <input type="text" id="bf-subtitle" value="${b.subtitle || ''}">
    </div>
    <div class="form-group">
      <label>Deskripsi</label>
      <input type="text" id="bf-description" value="${b.description || ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Teks Tombol</label>
        <input type="text" id="bf-cta" value="${b.cta || ''}">
      </div>
      <div class="form-group">
        <label>Link Tombol</label>
        <input type="text" id="bf-link" value="${b.link || ''}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Warna Background</label>
        <input type="color" id="bf-bgColor" value="${b.bgColor || '#FAFAFA'}" style="width:60px;height:36px;padding:2px;border:var(--border);cursor:pointer">
      </div>
      <div class="form-group">
        <label>Warna Teks</label>
        <input type="color" id="bf-textColor" value="${b.textColor || '#0A0A0A'}" style="width:60px;height:36px;padding:2px;border:var(--border);cursor:pointer">
      </div>
    </div>`;

  const footer = `
    <button class="btn-ghost" onclick="closeModal()">BATAL</button>
    <button class="btn-primary" onclick="saveBanner()">SIMPAN BANNER</button>`;

  openModal('EDIT BANNER', body, footer);
}

function saveBanner() {
  const banners = DB.get(KEYS.banners) || [];
  const idx = banners.findIndex(b => b.id === editingBanner?.id);
  if (idx < 0) { closeModal(); return; }

  banners[idx] = {
    ...banners[idx],
    title:       document.getElementById('bf-title')?.value || '',
    subtitle:    document.getElementById('bf-subtitle')?.value || '',
    description: document.getElementById('bf-description')?.value || '',
    cta:         document.getElementById('bf-cta')?.value || '',
    link:        document.getElementById('bf-link')?.value || '',
    bgColor:     document.getElementById('bf-bgColor')?.value || '#FAFAFA',
    textColor:   document.getElementById('bf-textColor')?.value || '#0A0A0A',
  };

  DB.set(KEYS.banners, banners);
  closeModal();
  renderBannersTab();
  showDashToast('✦ Banner disimpan!', 'success');
}

function toggleBanner(id, active) {
  const banners = DB.get(KEYS.banners) || [];
  const idx = banners.findIndex(b => b.id === id);
  if (idx >= 0) {
    banners[idx].active = active;
    DB.set(KEYS.banners, banners);
  }
}

function confirmDeleteBanner(id, title) {
  openModal('HAPUS BANNER',
    `<div class="confirm-dialog"><p>Hapus banner ini?</p><strong>${title}</strong></div>`,
    `<button class="btn-ghost" onclick="closeModal()">BATAL</button>
     <button class="btn-secondary" onclick="deleteBanner('${id}')" style="background:#FF3D00;border-color:#FF3D00">HAPUS</button>`
  );
}

function deleteBanner(id) {
  const banners = (DB.get(KEYS.banners) || []).filter(b => b.id !== id);
  DB.set(KEYS.banners, banners);
  closeModal();
  renderBannersTab();
  showDashToast('Banner dihapus.', 'success');
}

// ── Category Modal ──
function openCategoryModal(id) {
  const categories = DB.get(KEYS.categories) || [];
  const cat = categories.find(c => c.id === id);
  editingCategory = cat || null;

  const body = `
    <div class="form-row">
      <div class="form-group">
        <label>Ikon (karakter/emoji)</label>
        <input type="text" id="catf-icon" value="${cat?.icon || '◈'}" maxlength="4" style="font-size:1.5rem;text-align:center">
      </div>
      <div class="form-group">
        <label>Nama Kategori</label>
        <input type="text" id="catf-name" value="${cat?.name || ''}">
      </div>
    </div>`;

  const footer = `
    <button class="btn-ghost" onclick="closeModal()">BATAL</button>
    <button class="btn-primary" onclick="saveCategory()">SIMPAN</button>`;

  openModal(cat ? 'EDIT KATEGORI' : 'TAMBAH KATEGORI', body, footer);
}

function openAddCategoryModal() {
  editingCategory = null;
  openCategoryModal(null);
}

function saveCategory() {
  const name = document.getElementById('catf-name')?.value.trim();
  const icon = document.getElementById('catf-icon')?.value.trim();
  if (!name) { showDashToast('Nama kategori wajib diisi!', 'error'); return; }

  const categories = DB.get(KEYS.categories) || [];

  if (editingCategory) {
    const idx = categories.findIndex(c => c.id === editingCategory.id);
    if (idx >= 0) { categories[idx].name = name; categories[idx].icon = icon; }
  } else {
    const id = name.toLowerCase().replace(/\s+/g, '-');
    if (categories.find(c => c.id === id)) { showDashToast('Kategori sudah ada!', 'error'); return; }
    categories.push({ id, name, icon: icon || '◈', count: 0 });
  }

  DB.set(KEYS.categories, categories);
  closeModal();
  renderCategoriesTab();
  showDashToast('✦ Kategori disimpan!', 'success');
}

function confirmDeleteCategory(id, name) {
  openModal('HAPUS KATEGORI',
    `<div class="confirm-dialog"><p>Hapus kategori ini?</p><strong>${name}</strong><p style="margin-top:8px;color:var(--gray-500);font-size:var(--text-sm)">Produk dalam kategori ini tidak akan terhapus.</p></div>`,
    `<button class="btn-ghost" onclick="closeModal()">BATAL</button>
     <button class="btn-secondary" onclick="deleteCategory('${id}')" style="background:#FF3D00;border-color:#FF3D00">HAPUS</button>`
  );
}

function deleteCategory(id) {
  const categories = (DB.get(KEYS.categories) || []).filter(c => c.id !== id);
  DB.set(KEYS.categories, categories);
  closeModal();
  renderCategoriesTab();
  showDashToast('Kategori dihapus.', 'success');
}

// ── Toast (dashboard) ──
function showDashToast(message, type = 'success') {
  let container = document.getElementById('dash-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'dash-toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none';
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

// ── Init Dashboard ──
async function initDashboard() {
  await seedData();

  // Sidebar nav
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // Modal close
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
  }
  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.addEventListener('click', closeModal);

  // Mobile sidebar
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebarOverlay && sidebarOverlay.classList.toggle('open');
    });
  }
  if (sidebarOverlay && sidebar) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('open');
    });
  }

  // Add product button
  const addProductBtn = document.getElementById('add-product-btn');
  if (addProductBtn) addProductBtn.addEventListener('click', () => openProductModal(null));

  // Add category button
  const addCatBtn = document.getElementById('add-category-btn');
  if (addCatBtn) addCatBtn.addEventListener('click', openAddCategoryModal);

  // Product search
  const prodSearch = document.getElementById('product-table-search');
  if (prodSearch) {
    prodSearch.addEventListener('input', () => renderProductsTab(prodSearch.value));
  }

  // Settings save
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);

  // Accent color preview
  const accentInput = document.getElementById('setting-accentColor');
  const accentVal   = document.getElementById('setting-accentValue');
  if (accentInput && accentVal) {
    accentInput.addEventListener('input', () => { accentVal.textContent = accentInput.value; });
  }

  // Load from URL hash or default
  const hash = location.hash.replace('#', '') || 'overview';
  switchTab(hash);
}

document.addEventListener('DOMContentLoaded', initDashboard);
