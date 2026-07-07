const navbar = document.querySelector('.navbar');
const menuBtn = document.querySelector('#menu-btn');
const header = document.querySelector('#header');
const searchBtn = document.querySelector('#search-btn');
const searchForm = document.querySelector('#search-form');
const searchBox = document.querySelector('#search-box');
const cartBtn = document.querySelector('#cart-btn');
const cartModal = document.querySelector('#cart-modal');
const cartClose = document.querySelector('#cart-close');
const cartItemsEl = document.querySelector('#cart-items');
const cartCountEl = document.querySelector('#cart-count');
const cartTotalEl = document.querySelector('#cart-total');
const checkoutBtn = document.querySelector('#checkout-btn');
const menuContainer = document.querySelector('#menu-container');
const filterBar = document.querySelector('#filter-bar');
const contactForm = document.querySelector('#contact-form');
const contactMsg = document.querySelector('#contact-msg');
const toast = document.querySelector('#toast');

let allMenu = [];
let cart = [];

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

if (menuBtn) {
    menuBtn.addEventListener('click', () => navbar.classList.toggle('active'));
}

searchBtn.addEventListener('click', () => searchForm.classList.toggle('active'));

window.addEventListener('scroll', () => {
    if (navbar.classList.contains('active')) navbar.classList.remove('active');
    if (searchForm.classList.contains('active')) searchForm.classList.remove('active');
    header.style.background = window.scrollY > 50 ? 'rgba(1, 1, 3, 0.95)' : 'var(--bg)';
});

cartBtn.addEventListener('click', () => cartModal.classList.add('active'));
cartClose.addEventListener('click', () => {
    cartModal.classList.remove('active');
    resetCheckout();
});
function resetCheckout() {
    if (checkoutForm) {
        checkoutForm.classList.remove('active');
        checkoutForm.reset();
    }
    if (checkoutBtn) checkoutBtn.style.display = '';
}

function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function formatPrice(n) {
    return n.toLocaleString('uz-UZ');
}

async function loadMenu(category = 'all', query = '') {
    menuContainer.innerHTML = '<p class="loading">Yuklanmoqda...</p>';
    try {
        const res = await fetch(`${API_BASE}/api/menu${category !== 'all' ? '?category=' + category : ''}`);
        allMenu = await res.json();
        renderMenu(query);
    } catch (e) {
        menuContainer.innerHTML = '<p class="loading">Menyuni yuklab bo\'lmadi.</p>';
    }
}

function renderMenu(query = '') {
    const q = query.trim().toLowerCase();
    const items = allMenu.filter((i) => !q || i.name.toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q));
    if (items.length === 0) {
        menuContainer.innerHTML = '<p class="loading">Hech narsa topilmadi.</p>';
        return;
    }
    menuContainer.innerHTML = items.map((item) => `
        <div class="box">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
            <h3>${escapeHtml(item.name)}</h3>
            <p class="desc">${escapeHtml(item.description) || ''}</p>
            <div class="price">${formatPrice(item.price)} so'm ${item.oldPrice ? `<span>${formatPrice(item.oldPrice)} so'm</span>` : ''}</div>
            <a href="#" class="btn add-btn" data-id="${item.id}">Savatga qo'shish</a>
        </div>
    `).join('');
}

menuContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-btn');
    if (!btn) return;
    e.preventDefault();
    const id = Number(btn.dataset.id);
    addToCart(id);
});

filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    filterBar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    loadMenu(btn.dataset.category, searchBox.value);
});

searchBox.addEventListener('input', () => renderMenu(searchBox.value));

function addToCart(id) {
    const item = allMenu.find((i) => i.id === id);
    if (!item) return;
    const existing = cart.find((c) => c.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ id, name: item.name, price: item.price, image: item.image, qty: 1 });
    updateCart();
    showToast(`${item.name} savatga qo'shildi`);
}

function updateCart() {
    const count = cart.reduce((s, c) => s + c.qty, 0);
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    cartCountEl.textContent = count;
    cartTotalEl.textContent = formatPrice(total);
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="empty-cart">Savat bo\'sh</p>';
        return;
    }
    cartItemsEl.innerHTML = cart.map((c) => `
        <div class="cart-item">
            <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}">
            <div class="ci-info">
                <h4>${escapeHtml(c.name)}</h4>
                <p>${formatPrice(c.price)} so'm</p>
            </div>
            <div class="ci-qty">
                <button data-act="dec" data-id="${c.id}">-</button>
                <span>${c.qty}</span>
                <button data-act="inc" data-id="${c.id}">+</button>
            </div>
        </div>
    `).join('');
}

cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const item = cart.find((c) => c.id === id);
    if (!item) return;
    if (btn.dataset.act === 'inc') item.qty += 1;
    else {
        item.qty -= 1;
        if (item.qty <= 0) cart = cart.filter((c) => c.id !== id);
    }
    updateCart();
});

const checkoutForm = document.querySelector('#checkout-form');
let selectedLocation = null;

function getDeliveryType() {
    const sel = document.querySelector('input[name="deliveryType"]:checked');
    return sel ? sel.value : 'delivery';
}

function toggleAddressBlock() {
    const isDelivery = getDeliveryType() === 'delivery';
    const block = document.querySelector('#address-block');
    const addr = document.querySelector('#cust-address');
    block.style.display = isDelivery ? '' : 'none';
    addr.required = isDelivery;
    if (!isDelivery) { selectedLocation = null; document.querySelector('#map-box').style.display = 'none'; }
}

document.querySelectorAll('input[name="deliveryType"]').forEach((r) => r.addEventListener('change', toggleAddressBlock));

document.querySelector('#loc-btn').addEventListener('click', () => {
    if (!navigator.geolocation) { showToast('Brauzer lokatsiyani qo\'llamaydi'); return; }
    navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        selectedLocation = { lat: latitude, lng: longitude };
        const note = document.querySelector('#map-note');
        note.textContent = `Lokatsiya: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        const d = 0.005;
        const bbox = `${longitude - d},${latitude - d},${longitude + d},${latitude + d}`;
        document.querySelector('#map-frame').src =
            `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
        document.querySelector('#map-box').style.display = 'block';
        showToast('Lokatsiya olindi');
    }, () => showToast('Lokatsiyani olish rad etildi'));
});

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) { showToast('Savat bo\'sh'); return; }
    checkoutForm.classList.add('active');
    checkoutBtn.style.display = 'none';
});

checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const deliveryType = getDeliveryType();
    const customer = {
        name: document.querySelector('#cust-name').value.trim(),
        phone: document.querySelector('#cust-phone').value.trim(),
        address: document.querySelector('#cust-address').value.trim(),
        deliveryType,
        location: selectedLocation
    };
    const items = cart.map((c) => ({ id: c.id, name: c.name, price: c.price, qty: c.qty }));
    try {
        const res = await fetch(API_BASE + '/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, customer })
        });
        const data = await res.json();
        if (res.ok) {
            cart = [];
            updateCart();
            checkoutForm.classList.remove('active');
            checkoutBtn.style.display = '';
            checkoutForm.reset();
            selectedLocation = null;
            document.querySelector('#map-box').style.display = 'none';
            cartModal.classList.remove('active');
            showToast('Buyurtma qabul qilindi!');
        } else showToast(data.error || 'Xatolik yuz berdi');
    } catch (e) {
        showToast('Server bilan bog\'lanish xatosi');
    }
});

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.querySelector('#c-name').value;
    const email = document.querySelector('#c-email').value;
    const message = document.querySelector('#c-message').value;
    try {
        const res = await fetch(API_BASE + '/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });
        const data = await res.json();
        contactMsg.textContent = res.ok ? data.message : (data.error || 'Xatolik');
        if (res.ok) contactForm.reset();
    } catch (e) {
        contactMsg.textContent = 'Server bilan bog\'lanish xatosi';
    }
});

loadMenu();
updateCart();

/* Order tracking */
const trackModal = document.querySelector('#track-modal');
const trackClose = document.querySelector('#track-close');
const trackForm = document.querySelector('#track-form');
const trackResult = document.querySelector('#track-result');

document.querySelector('#track-link').addEventListener('click', (e) => {
    e.preventDefault();
    trackModal.classList.add('active');
});

trackClose.addEventListener('click', () => trackModal.classList.remove('active'));

const TRACK_STATUS = {
    'yangi': { label: 'Yangi', cls: 'st-new' },
    'tayyorlanmoqda': { label: 'Tayyorlanmoqda', cls: 'st-progress' },
    'yuborildi': { label: 'Yuborildi', cls: 'st-sent' },
    'bajarildi': { label: 'Bajarildi', cls: 'st-done' }
};

function mapHtml(loc) {
    if (!loc || !loc.lat) return '';
    const d = 0.005;
    const bbox = `${loc.lng - d},${loc.lat - d},${loc.lng + d},${loc.lat + d}`;
    return `<div class="track-map"><iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${loc.lat},${loc.lng}" frameborder="0" loading="lazy"></iframe></div>`;
}

trackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.querySelector('#track-phone').value.trim();
    trackResult.innerHTML = '<p class="loading">Qidirilmoqda...</p>';
    try {
        const res = await fetch(API_BASE + '/api/orders/track?phone=' + encodeURIComponent(phone));
        const orders = await res.json();
        if (!res.ok) { trackResult.innerHTML = `<p class="loading">${orders.error}</p>`; return; }
        if (!orders.length) { trackResult.innerHTML = '<p class="loading">Buyurtmalar topilmadi</p>'; return; }
        trackResult.innerHTML = orders.slice().reverse().map((o) => {
            const st = TRACK_STATUS[o.status] || TRACK_STATUS['yangi'];
            const type = o.deliveryType === 'pickup' ? 'Olib kelish' : 'Yetkazib berish';
            return `
            <div class="track-card">
                <div class="track-head">
                    <h4>Buyurtma #${o.id}</h4>
                    <span class="status ${st.cls}">${st.label}</span>
                </div>
                <ul>${o.items.map((i) => `<li>${escapeHtml(i.name)} x${i.qty}</li>`).join('')}</ul>
                <p class="track-total">Jami: <strong>${Number(o.total).toLocaleString('uz-UZ')} so'm</strong></p>
                <p class="track-meta"><i class="fas fa-truck"></i> ${type}</p>
                ${o.address ? `<p class="track-meta"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(o.address)}</p>` : ''}
                ${mapHtml(o.location)}
                <p class="track-date">${new Date(o.createdAt).toLocaleString('uz-UZ')}</p>
            </div>`;
        }).join('');
    } catch (e) {
        trackResult.innerHTML = '<p class="loading">Server xatosi</p>';
    }
});
