const $ = (id) => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function resolveImage(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  return API_BASE + '/' + path.replace(/^\//, '');
}

const loginBox = $('login-box');
const adminLayout = $('admin-layout');
const loginMsg = $('login-msg');
const toast = $('toast');

let token = localStorage.getItem('admin_token') || '';

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function api(path, options = {}) {
  return fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      ...(options.headers || {})
    }
  });
}

async function tryAutoLogin() {
  if (!token) return showAdmin(false);
  try {
    const res = await api('/api/admin/orders');
    if (res.ok) showAdmin(true);
    else showAdmin(false);
  } catch { showAdmin(false); }
}

function showAdmin(ok) {
  if (ok) {
    loginBox.classList.add('hidden');
    adminLayout.classList.remove('hidden');
    loadStats();
    loadMenu();
  } else {
    loginBox.classList.remove('hidden');
    adminLayout.classList.add('hidden');
  }
}

$('login-btn').addEventListener('click', async () => {
  const password = $('admin-password').value;
  const res = await fetch(API_BASE + '/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    localStorage.setItem('admin_token', token);
    showAdmin(true);
  } else {
    loginMsg.textContent = data.error;
  }
});

$('logout-btn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  token = '';
  localStorage.removeItem('admin_token');
  showAdmin(false);
});

/* Tabs */
document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('active'));
    link.classList.add('active');
    const tab = link.dataset.tab;
    $('tab-title').textContent = link.textContent.trim();
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    $('tab-' + tab).classList.add('active');
    if (tab === 'menu') loadMenu();
    if (tab === 'orders') loadOrders();
    if (tab === 'messages') loadMessages();
  });
});

/* Menu */
async function loadMenu() {
  const tbody = $('menu-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="empty">Yuklanmoqda...</td></tr>';
  const res = await api('/api/menu');
  const menu = await res.json();
  if (!menu.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">Mahsulot yo\'q</td></tr>';
    return;
  }
  tbody.innerHTML = menu.map((m) => `
    <tr>
      <td>${m.id}</td>
      <td><img src="${escapeHtml(resolveImage(m.image))}" alt=""></td>
      <td>${escapeHtml(m.name)}</td>
      <td><span class="badge">${escapeHtml(m.category)}</span></td>
      <td>${Number(m.price).toLocaleString('uz-UZ')} so'm</td>
      <td class="actions">
        <a class="edit" data-id="${m.id}"><i class="fas fa-edit"></i></a>
        <a class="del" data-id="${m.id}"><i class="fas fa-trash"></i></a>
      </td>
    </tr>
  `).join('');
}

$('menu-tbody').addEventListener('click', async (e) => {
  const editBtn = e.target.closest('.edit');
  const delBtn = e.target.closest('.del');
  if (editBtn) {
    const id = editBtn.dataset.id;
    const res = await api('/api/menu/' + id);
    const m = await res.json();
    openMenuModal(m);
  } else if (delBtn) {
    const id = delBtn.dataset.id;
    if (!confirm('O\'chirishni tasdiqlaysizmi?')) return;
    const res = await api('/api/admin/menu/' + id, { method: 'DELETE' });
    if (res.ok) { showToast('O\'chirildi'); loadMenu(); }
    else showToast('Xatolik');
  }
});

/* Menu modal */
function openMenuModal(item = {}) {
  $('menu-modal-title').textContent = item.id ? 'Tahrirlash' : 'Yangi mahsulot';
  $('m-id').value = item.id || '';
  $('m-name').value = item.name || '';
  $('m-category').value = item.category || 'nonushta';
  $('m-price').value = item.price || '';
  $('m-oldPrice').value = item.oldPrice || '';
  $('m-image').value = item.image || '';
  $('m-description').value = item.description || '';
  $('menu-modal').classList.add('active');
}

$('add-menu-btn').addEventListener('click', () => openMenuModal());
$('menu-cancel-btn').addEventListener('click', () => $('menu-modal').classList.remove('active'));

$('menu-save-btn').addEventListener('click', async () => {
  const id = $('m-id').value;
  const payload = {
    name: $('m-name').value,
    category: $('m-category').value,
    price: $('m-price').value,
    oldPrice: $('m-oldPrice').value,
    image: $('m-image').value,
    description: $('m-description').value
  };
  const url = id ? '/api/admin/menu/' + id : '/api/admin/menu';
  const method = id ? 'PUT' : 'POST';
  const res = await api(url, { method, body: JSON.stringify(payload) });
  if (res.ok) {
    showToast('Saqlindi');
    $('menu-modal').classList.remove('active');
    loadMenu();
  } else {
    const d = await res.json();
    showToast(d.error || 'Xatolik');
  }
});

function adminMapHtml(loc) {
  if (!loc || !loc.lat) return '';
  const d = 0.005;
  const bbox = `${loc.lng - d},${loc.lat - d},${loc.lng + d},${loc.lat + d}`;
  return `<div class="card-map"><iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${loc.lat},${loc.lng}" frameborder="0" loading="lazy"></iframe></div>`;
}

/* Stats */
async function loadStats() {
  try {
    const [menuRes, ordRes, msgRes] = await Promise.all([
      api('/api/menu'), api('/api/admin/orders'), api('/api/admin/messages')
    ]);
    const menu = await menuRes.json();
    const orders = await ordRes.json();
    const msgs = await msgRes.json();
    $('stat-menu').textContent = menu.length;
    $('stat-orders').textContent = orders.length;
    $('stat-messages').textContent = msgs.length;
  } catch {}
}

/* Orders */
const STATUS_MAP = {
  'yangi': { label: 'Yangi', cls: 'st-new' },
  'tayyorlanmoqda': { label: 'Tayyorlanmoqda', cls: 'st-progress' },
  'yuborildi': { label: 'Yuborildi', cls: 'st-sent' },
  'bajarildi': { label: 'Bajarildi', cls: 'st-done' }
};

async function loadOrders() {
  const list = $('orders-list');
  list.innerHTML = '<p class="empty">Yuklanmoqda...</p>';
  const res = await api('/api/admin/orders');
  const orders = await res.json();
  if (!orders.length) { list.innerHTML = '<p class="empty">Buyurtmalar yo\'q</p>'; return; }
  list.innerHTML = orders.slice().reverse().map((o) => {
    const st = STATUS_MAP[o.status] || STATUS_MAP['yangi'];
    const c = o.customer || {};
    return `
    <div class="card">
      <div class="card-head">
        <h3>Buyurtma #${o.id}</h3>
        <span class="status ${st.cls}">${st.label}</span>
      </div>
      <ul>${o.items.map((i) => `<li>${escapeHtml(i.name)} x${i.qty} — ${Number(i.price * i.qty).toLocaleString('uz-UZ')} so'm</li>`).join('')}</ul>
      <p class="total">Jami: <strong>${Number(o.total).toLocaleString('uz-UZ')} so'm</strong></p>
      <div class="customer">
        <p><i class="fas fa-user"></i> ${escapeHtml(c.name) || '-'}</p>
        <p><i class="fas fa-phone"></i> ${escapeHtml(c.phone) || '-'}</p>
        <p><i class="fas ${o.customer.deliveryType === 'pickup' ? 'fa-store' : 'fa-truck'}"></i> ${o.customer.deliveryType === 'pickup' ? 'Olib kelish' : 'Yetkazib berish'}</p>
        ${c.address ? `<p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(c.address)}</p>` : ''}
      </div>
      ${adminMapHtml(o.customer.location)}
      <p class="meta">${new Date(o.createdAt).toLocaleString('uz-UZ')}</p>
      <div class="card-actions">
        <select class="status-select" data-id="${o.id}">
          ${Object.entries(STATUS_MAP).map(([k, v]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${v.label}</option>`).join('')}
        </select>
        <button class="icon-del" data-id="${o.id}" title="O'chirish"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
}

$('orders-list').addEventListener('change', async (e) => {
  const sel = e.target.closest('.status-select');
  if (!sel) return;
  const res = await api('/api/admin/order/' + sel.dataset.id, { method: 'PUT', body: JSON.stringify({ status: sel.value }) });
  if (res.ok) { showToast('Holat yangilandi'); loadStats(); }
  else showToast('Xatolik');
});

$('orders-list').addEventListener('click', async (e) => {
  const del = e.target.closest('.icon-del');
  if (!del) return;
  if (!confirm('Buyurtmani o\'chirishni tasdiqlaysizmi?')) return;
  const res = await api('/api/admin/order/' + del.dataset.id, { method: 'DELETE' });
  if (res.ok) { showToast('O\'chirildi'); loadOrders(); loadStats(); }
  else showToast('Xatolik');
});

/* Messages */
async function loadMessages() {
  const list = $('messages-list');
  list.innerHTML = '<p class="empty">Yuklanmoqda...</p>';
  const res = await api('/api/admin/messages');
  const msgs = await res.json();
  if (!msgs.length) { list.innerHTML = '<p class="empty">Xabarlar yo\'q</p>'; return; }
  list.innerHTML = msgs.slice().reverse().map((m) => `
    <div class="card">
      <div class="card-head"><h3>${escapeHtml(m.name)}</h3>
        <button class="icon-del" data-id="${m.id}" title="O'chirish"><i class="fas fa-trash"></i></button>
      </div>
      <p>${escapeHtml(m.message)}</p>
      <p class="meta">${escapeHtml(m.email)} · ${new Date(m.createdAt).toLocaleString('uz-UZ')}</p>
    </div>
  `).join('');
}

$('messages-list').addEventListener('click', async (e) => {
  const del = e.target.closest('.icon-del');
  if (!del) return;
  if (!confirm('Xabarni o\'chirishni tasdiqlaysizmi?')) return;
  const res = await api('/api/admin/message/' + del.dataset.id, { method: 'DELETE' });
  if (res.ok) { showToast('O\'chirildi'); loadMessages(); loadStats(); }
  else showToast('Xatolik');
});

tryAutoLogin();
