const express = require('express');
const path = require('path');
const { menu } = require('./data/menu');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname)));

/* ---------- Public API ---------- */

app.get('/api/menu', (req, res) => {
  const { category } = req.query;
  if (category && category !== 'all') {
    return res.json(menu.filter((item) => item.category === category));
  }
  res.json(menu);
});

app.get('/api/menu/:id', (req, res) => {
  const item = menu.find((m) => m.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  res.json(item);
});

const orders = [];

app.post('/api/order', (req, res) => {
  const { items, customer } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Savat bo\'sh' });
  }
  const { name, phone, address, deliveryType, location } = customer || {};
  const type = deliveryType === 'pickup' ? 'pickup' : 'delivery';
  if (!name || !phone) {
    return res.status(400).json({ error: 'Ism va telefon majburiy' });
  }
  if (type === 'delivery' && !address) {
    return res.status(400).json({ error: 'Yetkazib berish uchun manzil majburiy' });
  }
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const order = {
    id: orders.length + 1,
    items,
    customer: {
      name, phone, address: address || '',
      deliveryType: type,
      location: location && location.lat ? { lat: Number(location.lat), lng: Number(location.lng) } : null
    },
    total,
    status: 'yangi',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  res.status(201).json({ message: 'Buyurtma qabul qilindi', order });
});

const messages = [];

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Barcha maydonlarni to\'ldiring' });
  }
  messages.push({ id: messages.length + 1, name, email, message, createdAt: new Date().toISOString() });
  res.status(201).json({ message: 'Xabar muvaffaqiyatli yuborildi' });
});

app.get('/api/orders/track', (req, res) => {
  const phone = (req.query.phone || '').replace(/[\s\-+]/g, '');
  if (!phone) return res.status(400).json({ error: 'Telefon raqamini kiriting' });
  const userOrders = orders
    .filter((o) => (o.customer.phone || '').replace(/[\s\-+]/g, '') === phone)
    .map((o) => ({
      id: o.id,
      items: o.items,
      total: o.total,
      status: o.status,
      deliveryType: o.customer.deliveryType,
      address: o.customer.address,
      location: o.customer.location,
      createdAt: o.createdAt
    }));
  res.json(userOrders);
});

/* ---------- Admin Auth ---------- */

const sessions = new Set();

function auth(req, res, next) {
  const token = req.headers['authorization'] || '';
  if (!sessions.has(token)) return res.status(401).json({ error: 'Kirish rad etildi' });
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Parol noto\'g\'ri' });
  }
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  sessions.add(token);
  res.json({ token });
});

app.post('/api/admin/logout', auth, (req, res) => {
  sessions.delete(req.headers['authorization']);
  res.json({ message: 'Chiqildi' });
});

/* ---------- Admin API ---------- */

app.get('/api/admin/orders', auth, (req, res) => res.json(orders));
app.get('/api/admin/messages', auth, (req, res) => res.json(messages));

app.put('/api/admin/order/:id', auth, (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  if (req.body.status) order.status = req.body.status;
  res.json(order);
});

app.delete('/api/admin/order/:id', auth, (req, res) => {
  const idx = orders.findIndex((o) => o.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  orders.splice(idx, 1);
  res.json({ message: 'Buyurtma o\'chirildi' });
});

app.delete('/api/admin/message/:id', auth, (req, res) => {
  const idx = messages.findIndex((m) => m.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Xabar topilmadi' });
  messages.splice(idx, 1);
  res.json({ message: 'Xabar o\'chirildi' });
});

app.post('/api/admin/menu', auth, (req, res) => {
  const { name, category, price, oldPrice, image, description } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: 'Nom, kategoriya va narx majburiy' });
  }
  const id = menu.length ? Math.max(...menu.map((m) => m.id)) + 1 : 1;
  const item = {
    id,
    name,
    category,
    price: Number(price),
    oldPrice: oldPrice ? Number(oldPrice) : null,
    image: image || '',
    description: description || ''
  };
  menu.push(item);
  res.status(201).json(item);
});

app.put('/api/admin/menu/:id', auth, (req, res) => {
  const item = menu.find((m) => m.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  const { name, category, price, oldPrice, image, description } = req.body;
  if (name != null) item.name = name;
  if (category != null) item.category = category;
  if (price != null) item.price = Number(price);
  if (oldPrice !== undefined) item.oldPrice = oldPrice ? Number(oldPrice) : null;
  if (image != null) item.image = image;
  if (description != null) item.description = description;
  res.json(item);
});

app.delete('/api/admin/menu/:id', auth, (req, res) => {
  const idx = menu.findIndex((m) => m.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Mahsulot topilmadi' });
  menu.splice(idx, 1);
  res.json({ message: 'O\'chirildi' });
});

app.listen(PORT, () => {
  console.log(`7seventeen Coffee serveri http://localhost:${PORT} manzilida ishlamoqda`);
});
