# 7seventeen Coffee

Zamonaviy qahvaxona veb-ilovasi: frontend (HTML/CSS/JS) + Node/Express backend.

## Loyiha tuzilishi
- `server.js` — Express server (API + statik fayllar)
- `data/menu.js` — menyu ma'lumotlari
- `index.html`, `app.js`, `main.css` — asosiy sayt (menyu, savat, zakaz, kuzatish)
- `admin.html`, `admin.js`, `admin.css` — admin panel (menyu, buyurtmalar, xabarlar)
- `config.js` — frontend API manzili (sozlanadigan)

## Lokal ishga tushirish
```bash
npm install
npm start
```
Sayt: http://localhost:3000 — Admin: http://localhost:3000/admin.html (parol: `admin123`)

## GitHub Pages + Render (backend host) bilan ishlatish

GitHub Pages **faqat statik fayllarni** server qiladi, Express backend ishlamaydi.
Shuning uchun backend-ni alohida Node hostga (Render/Railway) qo'yish kerak.

### 1. Backend-ni Render'ga qo'yish
- https://render.com → "New Web Service" → GitHub reponi ulash
- Environment: **Node**
- Build command: `npm install`
- Start command: `npm start`
- Branch: `main`
- Render berilgan URL ni ko'rsatadi, masalan: `https://7teen-coffee.onrender.com`

### 2. Frontend'ni GitHub Pages'ga qo'yish
- Reponi GitHub'ga push qiling (Settings → Pages → branch `main` / root)
- `config.js` faylida `API_BASE` ni Render manzili bilan almashtiring:
  ```js
  window.API_BASE = 'https://7teen-coffee.onrender.com';
  ```
- O'zgarishni push qiling.

Endi sayt GitHub Pages'dan, ma'lumotlar esa Render'dagi backend'dan keladi.
CORS avtomatik yoqilgan (`server.js` da), shuning uchun kesishib so'rov ishlaydi.

## API
- `GET  /api/menu?category=qahva` — menyu
- `POST /api/order` — zakaz (mijoz: name, phone, address, deliveryType, location)
- `POST /api/contact` — aloqa xabari
- `GET  /api/orders/track?phone=...` — foydalanuvchi zakazlarini kuzatish
- `POST /api/admin/login` — admin kirish (parol: `admin123`, `ADMIN_PASSWORD` env bilan o'zgartiriladi)
- `GET  /api/admin/orders` — buyurtmalar (token talab)
- `GET  /api/admin/messages` — xabarlar (token talab)
- `POST/PUT/DELETE /api/admin/menu/:id` — menyu boshqaruvi (token talab)
- `PUT/DELETE /api/admin/order/:id` — buyurtma holati/o'chirish (token talab)
- `DELETE /api/admin/message/:id` — xabar o'chirish (token talab)
