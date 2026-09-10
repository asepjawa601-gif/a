/* ================================================================
   PETALIA - ADMIN ON INDEX PAGE
   Panel admin sekarang berada di index.html.
   ================================================================ */
(function(){
  'use strict';

  const AdminStore = window.PetaliaStore;
  const CATEGORIES = AdminStore.CATEGORIES;
  const ADMIN_USERNAME = 'admin';
  const DEFAULT_ADMIN_PASSWORD = 'admin123';
  const PASSWORD_KEY = 'petalia_admin_password';
  const SESSION_KEY = 'petaliaAdminSession';

  let adminProducts = [];
  let adminOrders = [];
  let editingProductId = null;

  function fmtPrice(n){
    return 'Rp' + Number(n || 0).toLocaleString('id-ID');
  }

  function fmtDate(iso){
    const d = new Date(iso);
    return d.toLocaleString('id-ID', {
      day:'numeric', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    });
  }

  function escapeHtml(value){
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
  }

  function escapeAttr(value){
    return escapeHtml(value).replace(/`/g,'&#96;');
  }

  function productImg(p){
    return p.image && String(p.image).trim()
      ? String(p.image).trim()
      : `https://placehold.co/100x100/FFE1EC/C43F63?text=${encodeURIComponent(String(p.name).split(' ').slice(0,2).join(' '))}`;
  }

  function findProduct(id){
    return adminProducts.find(p => p.id === id);
  }

  function showToast(msg, isError=false){
    if(typeof window.showToast === 'function'){
      window.showToast(msg, isError);
      return;
    }
    const t = document.getElementById('toast');
    if(!t) return;
    t.textContent = msg;
    t.style.background = isError ? '#B03A4E' : 'var(--text)';
    t.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function getAdminPassword(){
    try{
      return localStorage.getItem(PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
    }catch(e){
      return DEFAULT_ADMIN_PASSWORD;
    }
  }

  function setAdminPassword(password){
    try{
      localStorage.setItem(PASSWORD_KEY, password);
      return true;
    }catch(e){
      showToast('Password tidak bisa disimpan di browser ini.', true);
      return false;
    }
  }

  async function loadAdminData(){
    [adminProducts, adminOrders] = await Promise.all([
      AdminStore.getProducts(),
      AdminStore.getOrders()
    ]);
  }

  function syncCustomerState(){
    /* Sinkronkan variabel app.js bila tersedia. */
    try{
      products = adminProducts;
      orders = adminOrders;
      if(typeof renderHome === 'function') renderHome();
      if(typeof renderOrders === 'function' && currentPage === 'orders') renderOrders();
    }catch(e){
      console.warn('Customer state sync skipped:', e);
    }
  }

  async function refreshAdmin(){
    await loadAdminData();
    syncCustomerState();
    refreshStats();
    renderAdminProducts();
    renderAdminOrders();
    fillCategorySelect();
  }

  function refreshStats(){
    const productsEl = document.getElementById('stat-products');
    const stockEl = document.getElementById('stat-stock');
    const ordersEl = document.getElementById('stat-orders');
    if(productsEl) productsEl.textContent = adminProducts.length;
    if(stockEl) stockEl.textContent = adminProducts.reduce((s,p)=>s+Number(p.stock||0),0);
    if(ordersEl) ordersEl.textContent = adminOrders.length;
  }

  function fillCategorySelect(){
    const select = document.getElementById('f-category');
    if(!select) return;
    const current = select.value;
    select.innerHTML = CATEGORIES.map(c =>
      `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`
    ).join('');
    if(CATEGORIES.includes(current)) select.value = current;
  }

  function openAdminLogin(){
    if(sessionStorage.getItem(SESSION_KEY) === 'true'){
      openAdminPanel();
      return;
    }
    const modal = document.getElementById('admin-login-modal');
    if(!modal) return;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const error = document.getElementById('admin-login-error');
    if(error) error.hidden = true;
    const password = document.getElementById('admin-password');
    if(password) password.value = '';
    setTimeout(() => document.getElementById('admin-username')?.focus(), 30);
  }

  function closeAdminLogin(){
    const modal = document.getElementById('admin-login-modal');
    if(modal) modal.hidden = true;
    if(!document.getElementById('admin-panel')?.hidden) return;
    document.body.style.overflow = '';
  }

  function toggleAdminPassword(){
    const input = document.getElementById('admin-password');
    if(!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
  }

  async function handleAdminLogin(event){
    event.preventDefault();
    const username = document.getElementById('admin-username')?.value.trim() || '';
    const password = document.getElementById('admin-password')?.value || '';
    const error = document.getElementById('admin-login-error');

    if(username === ADMIN_USERNAME && password === getAdminPassword()){
      sessionStorage.setItem(SESSION_KEY, 'true');
      if(error) error.hidden = true;
      closeAdminLogin();
      await openAdminPanel();
      return;
    }

    if(error){
      error.textContent = 'Username atau password salah.';
      error.hidden = false;
    }
    const pass = document.getElementById('admin-password');
    if(pass) pass.value = '';
    pass?.focus();
  }

  async function openAdminPanel(){
    if(sessionStorage.getItem(SESSION_KEY) !== 'true'){
      openAdminLogin();
      return;
    }
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById('admin-panel');
    if(panel) panel.hidden = false;
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-admin-login')?.classList.add('active');
    document.body.style.overflow = '';
    window.history.replaceState(null, '', '#admin');
    await refreshAdmin();
    showAdminTab('produk');
    window.scrollTo({top:0, behavior:'auto'});
  }

  function logoutAdmin(){
    sessionStorage.removeItem(SESSION_KEY);
    const panel = document.getElementById('admin-panel');
    if(panel) panel.hidden = true;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if(typeof window.showPage === 'function'){
      window.showPage('home');
    }
    showToast('Berhasil keluar dari panel admin');
  }

  function showAdminTab(tab){
    document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(el => el.classList.remove('active'));
    document.getElementById('admintab-'+tab)?.classList.add('active');
    document.getElementById('adminpanel-'+tab)?.classList.add('active');
  }

  function renderAdminProducts(){
    const rows = document.getElementById('admin-product-rows');
    if(!rows) return;
    if(!adminProducts.length){
      rows.innerHTML = `<tr><td colspan="7">Belum ada produk.</td></tr>`;
      return;
    }
    rows.innerHTML = adminProducts.map(p => `
      <tr>
        <td><img src="${escapeAttr(productImg(p))}" alt="${escapeAttr(p.name)}"></td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category)}</td>
        <td>${fmtPrice(p.price)}</td>
        <td class="stock-badge ${p.stock <= 5 ? 'low' : ''}">${Number(p.stock||0)}</td>
        <td>${Number(p.sold||0)}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" onclick="editProduct('${escapeAttr(p.id)}')">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct('${escapeAttr(p.id)}')">Hapus</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function editProduct(id){
    const p = findProduct(id);
    if(!p) return;
    editingProductId = id;
    document.getElementById('f-name').value = p.name || '';
    document.getElementById('f-category').value = p.category || CATEGORIES[0];
    document.getElementById('f-image').value = p.image || '';
    document.getElementById('f-price').value = Number(p.price||0);
    document.getElementById('f-stock').value = Number(p.stock||0);
    document.getElementById('f-desc').value = p.desc || '';
    document.getElementById('product-form-title').textContent = 'Edit produk: ' + p.name;
    document.getElementById('product-form-submit').textContent = 'Simpan perubahan';
    document.getElementById('product-form-cancel').style.display = 'inline-flex';
    document.querySelector('#adminpanel-produk .form-card')?.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function resetProductForm(){
    editingProductId = null;
    document.getElementById('f-name').value = '';
    document.getElementById('f-category').value = CATEGORIES[0];
    document.getElementById('f-image').value = '';
    document.getElementById('f-price').value = '';
    document.getElementById('f-stock').value = '';
    document.getElementById('f-desc').value = '';
    document.getElementById('product-form-title').textContent = 'Tambah produk baru';
    document.getElementById('product-form-submit').textContent = 'Tambah produk';
    document.getElementById('product-form-cancel').style.display = 'none';
  }

  async function submitProductForm(){
    const name = document.getElementById('f-name').value.trim();
    const category = document.getElementById('f-category').value;
    const image = document.getElementById('f-image').value.trim();
    const price = Number(document.getElementById('f-price').value);
    const stock = Number(document.getElementById('f-stock').value);
    const desc = document.getElementById('f-desc').value.trim();

    if(!name || !Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0){
      showToast('Nama, harga, dan stok harus diisi dengan benar.', true);
      return;
    }

    if(editingProductId){
      const p = findProduct(editingProductId);
      if(!p) return;
      Object.assign(p,{name,category,image,price,stock,desc});
    }else{
      adminProducts.push({
        id:'p'+Date.now(),
        name, category, image, price, stock, desc,
        sold:0,
        addedAt:new Date().toISOString()
      });
    }

    const saved = await AdminStore.saveProducts(adminProducts);
    if(!saved){
      await refreshAdmin();
      showToast('Gagal menyimpan produk.', true);
      return;
    }
    resetProductForm();
    syncCustomerState();
    refreshStats();
    renderAdminProducts();
    showToast(editingProductId ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
  }

  async function deleteProduct(id){
    const p = findProduct(id);
    if(!p) return;
    if(!confirm(`Hapus "${p.name}" dari toko?`)) return;

    adminProducts = adminProducts.filter(x => x.id !== id);
    const cart = await AdminStore.getCart();
    const newCart = cart.filter(item => item.productId !== id);

    const productsSaved = await AdminStore.saveProducts(adminProducts);
    const cartSaved = await AdminStore.saveCart(newCart);

    if(!productsSaved || !cartSaved){
      await refreshAdmin();
      showToast('Perubahan tidak tersimpan.', true);
      return;
    }

    if(editingProductId === id) resetProductForm();
    syncCustomerState();
    refreshStats();
    renderAdminProducts();
    showToast('Produk berhasil dihapus.');
  }

  function renderAdminOrders(){
    const wrap = document.getElementById('admin-orders-content');
    if(!wrap) return;
    if(!adminOrders.length){
      wrap.innerHTML = `<div class="empty-state"><p class="title">Belum ada pesanan masuk</p></div>`;
      return;
    }
    wrap.innerHTML = adminOrders.map(o => `
      <div class="order-card">
        <div class="order-head">
          <div>
            <div class="order-id">${escapeHtml(o.id)}</div>
            <div class="order-time">${fmtDate(o.time)}</div>
          </div>
          <span class="order-status">${escapeHtml(o.status)}</span>
        </div>
        ${o.items.map(i => `
          <div class="order-line">
            <span>${escapeHtml(i.name)} <span class="muted">× ${i.qty}</span></span>
            <span>${fmtPrice(i.price*i.qty)}</span>
          </div>
        `).join('')}
        <div class="order-total">Total<span class="amt">${fmtPrice(o.total)}</span></div>
      </div>
    `).join('');
  }

  function backupData(){
    const payload = {
      backupVersion:3,
      exportedAt:new Date().toISOString(),
      products:adminProducts,
      orders:adminOrders
    };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petalia-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup data berhasil diunduh.');
  }

  async function restoreData(event){
    const file = event.target.files?.[0];
    if(!file) return;
    try{
      const data = JSON.parse(await file.text());
      if(!Array.isArray(data.products) || !Array.isArray(data.orders)){
        throw new Error('Format backup tidak valid');
      }
      if(!confirm('Restore akan mengganti produk dan pesanan saat ini. Lanjutkan?')) return;
      const productsSaved = await AdminStore.saveProducts(data.products);
      const ordersSaved = await AdminStore.saveOrders(data.orders);
      if(!productsSaved || !ordersSaved) throw new Error('Gagal menyimpan hasil restore');
      await refreshAdmin();
      resetProductForm();
      showToast('Data berhasil dipulihkan dari backup.');
    }catch(err){
      console.error(err);
      showToast('File backup tidak valid atau gagal disimpan.', true);
    }finally{
      event.target.value = '';
    }
  }

  function changeAdminPassword(){
    const current = document.getElementById('current-admin-password').value;
    const next = document.getElementById('new-admin-password').value;
    const confirmPassword = document.getElementById('confirm-admin-password').value;

    if(current !== getAdminPassword()){
      showToast('Password lama salah.', true);
      return;
    }

    if(next.length < 6){
      showToast('Password baru minimal 6 karakter.', true);
      return;
    }

    if(next !== confirmPassword){
      showToast('Konfirmasi password baru tidak cocok.', true);
      return;
    }

    if(next === current){
      showToast('Password baru harus berbeda dari password lama.', true);
      return;
    }

    if(!setAdminPassword(next)) return;

    document.getElementById('current-admin-password').value = '';
    document.getElementById('new-admin-password').value = '';
    document.getElementById('confirm-admin-password').value = '';
    showToast('Password admin berhasil diganti.');
  }

  async function initAdmin(){
    await loadAdminData();
    fillCategorySelect();

    if(sessionStorage.getItem(SESSION_KEY) === 'true'){
      await openAdminPanel();
    }
  }

  window.addEventListener('DOMContentLoaded', initAdmin);
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape') closeAdminLogin();
  });
  document.getElementById('admin-login-modal')?.addEventListener('click', closeAdminLogin);

  window.openAdminLogin = openAdminLogin;
  window.closeAdminLogin = closeAdminLogin;
  window.toggleAdminPassword = toggleAdminPassword;
  window.handleAdminLogin = handleAdminLogin;
  window.openAdminPanel = openAdminPanel;
  window.logoutAdmin = logoutAdmin;
  window.showAdminTab = showAdminTab;
  window.editProduct = editProduct;
  window.resetProductForm = resetProductForm;
  window.submitProductForm = submitProductForm;
  window.deleteProduct = deleteProduct;
  window.backupData = backupData;
  window.restoreData = restoreData;
  window.changeAdminPassword = changeAdminPassword;
})();
