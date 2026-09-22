# ✅ Full-Stack Todo List App

> Nuxt 3, Node.js/Express ve MongoDB Atlas ile geliştirilmiş full-stack Todo List uygulaması.

---

## 🚀 Özellikler

- **JWT + httpOnly Cookie** kimlik doğrulama — token API yanıtında veya Pinia state'inde tutulmaz
- **Todo CRUD** — oluşturma, listeleme, güncelleme, silme (soft delete)
- **Filtreleme, Arama, Sıralama, Sayfalama** — tam-metin arama + öncelik/durum/kategori filtresi
- **Görsel yükleme** — Cloudinary entegrasyonu (her todo'ya opsiyonel görsel)
- **Todo Paylaşımı** — kullanıcı adı/isim aramasıyla view/edit izinleriyle paylaşım
- **Profil gizliliği** — todo'lar varsayılan private; yalnızca kullanıcı isterse profilde görünür
- **Email Bildirimleri** — iletişim formu + günlük hatırlatma maili (cron job)
- **Dark/Light Mode** — localStorage + sistem tercihi
- **Responsive Tasarım** — Tailwind CSS + Inter font
- **Jest + Supertest** — auth ve todo API'si için entegrasyon testleri

---

## 📋 Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Backend | Node.js, Express.js, Nodemon |
| Frontend | Nuxt 3, Vue 3, Composition API, Pinia |
| Stil | Tailwind CSS, Inter font |
| Veritabanı | MongoDB Atlas, Mongoose |
| Auth | JWT, bcryptjs, cookie-parser |
| Dosya Yükleme | express-fileupload, Cloudinary |
| Validasyon | Joi (backend), client-side validators |
| Mail | Nodemailer (SMTP) |
| Zamanlama | node-cron |
| Test | Jest, Supertest |

---

## 📁 Proje Yapısı

```
todo-list/
├── backend/
│   ├── config/       → DB, Cloudinary yapılandırması
│   ├── models/       → User.js, Todo.js (Mongoose şemaları)
│   ├── controllers/  → auth, todo, user, mail, cron
│   ├── routes/       → authRoutes, todoRoutes, userRoutes
│   ├── middlewares/  → auth (JWT), validate (Joi), upload, errorHandler
│   ├── utils/        → jwtHelper, sendMail, apiFeatures
│   ├── tests/        → auth.test.js, todo.test.js
│   ├── app.js       → Express uygulaması (test edilebilir, port dinlemez)
│   └── server.js    → DB bağlantısı ve HTTP başlatıcısı
│
└── frontend/
    ├── pages/        → index, login, register, dashboard, todos/[id], profile/[username], contact
    ├── components/   → AppNavbar, TodoCard, TodoForm, TodoFilter, ...
    ├── composables/  → useDarkMode, useToast
    ├── stores/       → auth.ts, todos.ts (Pinia)
    ├── middleware/   → auth.ts, guest.ts
    ├── layouts/      → default.vue
    └── nuxt.config.ts
```

---

## ⚙️ Kurulum

### Gereksinimler

- Node.js >= 20.19.0
- Kalıcı veri için MongoDB Atlas hesabı (demo modu için gerekmez)
- Görsel yüklemek için Cloudinary hesabı (opsiyonel)
- İletişim ve hatırlatma e-postaları için SMTP hesabı (opsiyonel)

### 1. Projeyi Klonla

```bash
git clone https://github.com/ahmetkocdeveci/todo-list-backend.git
cd todo-list-backend
```

### 2. Backend Kurulumu

```bash
cd backend
npm ci
cp .env.example .env
# .env dosyasını doldurun (bkz. Ortam Değişkenleri)
npm run dev
```

Windows PowerShell kullanıyorsanız kopyalama komutu `Copy-Item .env.example .env` şeklindedir.

### 3. Frontend Kurulumu

```bash
cd frontend
npm ci
# Local API proxy varsayılan olarak http://localhost:5000'e gider.
npm run dev
```

Backend `http://localhost:5000`, Frontend `http://localhost:3000` adresinde çalışacaktır.

---

## 🔑 Ortam Değişkenleri (backend/.env)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas — cluster bağlantı dizisi
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/todolist

# JWT
JWT_SECRET=cok_gizli_bir_anahtar_bunu_degistir
JWT_EXPIRES_IN=7d

# Cookie
COOKIE_EXPIRES_IN=7
COOKIE_SAME_SITE=lax
# Gerekmedikçe boş bırakın; proxy mimarisinde cookie frontend alan adında kalır.
COOKIE_DOMAIN=

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Nodemailer (Gmail örneği — App Password kullanın)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM=Todo List App <your_email@gmail.com>

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend ortam değişkeni

Tarayıcı tüm istekleri aynı origin'deki `/api` yoluna yapar; Nuxt/Nitro bu yolu backend'e proxy'ler. Böylece frontend ve backend farklı servislerde olsa bile httpOnly cookie düzgün çalışır.

```env
# frontend/.env (local için opsiyonel)
NUXT_BACKEND_ORIGIN=http://localhost:5000
```

Production build sırasında `NUXT_BACKEND_ORIGIN`, backend URL'niz olmalıdır; örneğin `https://todo-api.onrender.com`.

## 🎬 Sıfır Yapılandırmalı Demo

Atlas bilgisi girmeden örnek verileri görmek için iki terminal açın:

```bash
# Terminal 1
cd backend
npm run demo

# Terminal 2
cd frontend
npm run dev
```

Ardından `http://localhost:3000` adresini açın:

```text
Email:    demo@todoapp.com
Password: Demo1234!
```

Demo bellek içi MongoDB kullanır; ilk çalıştırmada uygun MongoDB binary'si indirilir ve backend kapandığında demo verileri silinir. Kalıcı kullanım için `backend/.env` içindeki `MONGO_URI` değerini Atlas bağlantınızla doldurup `npm run dev` kullanın.

---

## 🌐 API Endpoints

### Auth

| Metot | URL | Açıklama | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Yeni kullanıcı kaydı | ❌ |
| POST | `/api/auth/login` | Giriş yapma | ❌ |
| POST | `/api/auth/logout` | Çıkış yapma | ✅ |
| GET | `/api/auth/me` | Mevcut oturum bilgisi | ✅ |

### Todos

| Metot | URL | Açıklama | Auth |
|---|---|---|---|
| GET | `/api/todos` | Todo listesi (filtreli/sıralı/sayfalı) | ✅ |
| GET | `/api/todos/stats` | Toplam, durum ve gecikme istatistikleri | ✅ |
| POST | `/api/todos` | Yeni todo oluştur | ✅ |
| GET | `/api/todos/shared` | Benimle paylaşılan todo'lar | ✅ |
| GET | `/api/todos/:id` | Tek todo detayı | ✅ |
| PATCH | `/api/todos/:id` | Todo güncelle | ✅ |
| DELETE | `/api/todos/:id` | Todo sil (soft delete) | ✅ |
| POST | `/api/todos/:id/share` | Todo paylaş | ✅ |
| DELETE | `/api/todos/:id/share/:userId` | Paylaşımı kaldır | ✅ |

### Users

| Metot | URL | Açıklama | Auth |
|---|---|---|---|
| GET | `/api/users/:username` | Kullanıcı profili | ❌ |
| GET | `/api/users/:username/todos` | Public todo'lar; sahibi giriş yapmışsa tümü | ❌ / opsiyonel |
| GET | `/api/users/search?q=ah` | Paylaşılacak kullanıcı ara | ✅ |
| PATCH | `/api/users/profile` | Profil güncelle | ✅ |
| POST | `/api/users/avatar` | Avatar yükle | ✅ |
| POST | `/api/users/contact` | İletişim formu | ❌ |
| GET | `/api/users` | Tüm kullanıcılar (Admin) | ✅ Admin |

---

## 🧪 Thunder Client / Postman Örnek İstekleri

Giriş isteğinden dönen `Set-Cookie` başlığını istemcinin cookie jar'ında saklayın. JWT yanıt gövdesinde dönmez; sonraki isteklerde httpOnly `token` cookie'si otomatik gönderilmelidir.

### 1. Kayıt Ol (Register)
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### 2. Giriş Yap (Login)
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Yeni Todo Oluştur
```
POST http://localhost:5000/api/todos
Cookie: token=<your_token>
Content-Type: application/json

{
  "title": "Learn Nuxt 3",
  "description": "Complete the Nuxt 3 tutorial series",
  "priority": "high",
  "category": "learning",
  "isPublic": false,
  "dueDate": "2099-12-31T23:59:00.000Z",
  "tags": ["nuxt", "vue", "frontend"]
}
```

### 4. Todo Listesi (Filtreli)
```
GET http://localhost:5000/api/todos?status=pending&priority=high&sort=-dueDate&page=1&limit=10
Cookie: token=<your_token>
```

### 5. Todo Ara
```
GET http://localhost:5000/api/todos?search=nuxt&page=1
Cookie: token=<your_token>
```

### 6. Todo Güncelle
```
PATCH http://localhost:5000/api/todos/<todo_id>
Cookie: token=<your_token>
Content-Type: application/json

{
  "status": "completed"
}
```

### 7. Todo Paylaş
```
POST http://localhost:5000/api/todos/<todo_id>/share
Cookie: token=<your_token>
Content-Type: application/json

{
  "userId": "<search endpointinden gelen target_user_id>",
  "permission": "edit"
}
```

---

## 🧪 Testleri Çalıştırma

```bash
cd backend
npm test
```

Testler Atlas'a bağlanmaz. Jest, test başlangıcında izole bir `mongodb-memory-server` açar ve sonunda kapatır.

Test dosyaları `backend/tests/` altında:
- `auth.test.js` — register, login, logout, getMe
- `todo.test.js` — CRUD, filtreler, istatistikler, profil gizliliği ve sahip izolasyonu

Frontend tip kontrolü ve production build doğrulaması:

```bash
cd frontend
npm run typecheck
npm run build
```

---

## 🚀 Deployment

Bu depo bir monorepo'dur. Her servis için aşağıdaki root directory değerini ayrıca ayarlayın. `backend/.env` dosyasını Git'e eklemeyin; değerleri hosting sağlayıcısının Environment Variables ekranına girin.

### Backend → Render veya Railway

Her iki platformda da servis ayarları:

- **Root Directory**: `backend`
- **Build Command**: `npm ci`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

Production ortamında en az şu değerleri tanımlayın:

```env
NODE_ENV=production
MONGO_URI=<mongodb-atlas-connection-string>
JWT_SECRET=<long-random-secret>
FRONTEND_URL=https://your-frontend.example
COOKIE_SAME_SITE=lax
```

`NODE_ENV=production` zorunludur; development değeri güvenli cookie, CSRF kontrolü ve hata yanıtlarının davranışını değiştirir. `COOKIE_DOMAIN` yalnızca bilinçli bir subdomain paylaşımı yapıyorsanız ayarlanmalıdır. Cloudinary ve SMTP değişkenlerini, ilgili özellikleri kullanacaksanız ayrıca ekleyin. Platformun sağladığı `PORT` değerini değiştirmeyin.

### Frontend → Vercel

GitHub deposunu yeni bir Vercel projesine bağlarken:

- **Root Directory**: `frontend`
- **Framework Preset**: Nuxt.js
- **Build Command**: `npm run build`
- **Environment Variable**: `NUXT_BACKEND_ORIGIN=https://your-backend.example`

Backend URL'sini sondaki `/` olmadan girin. Değişken build sırasında mevcut olmalıdır.

### Frontend → Render veya Railway

Frontend'i Node web servisi olarak çalıştırmak için:

- **Root Directory**: `frontend`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `node .output/server/index.mjs`
- **Environment Variable**: `NUXT_BACKEND_ORIGIN=https://your-backend.example`

Son olarak backend'deki `FRONTEND_URL` değerini gerçek frontend adresiyle eşleştirin. Nuxt `/api` proxy'si kullanıldığından `COOKIE_SAME_SITE=lax` bırakılabilir. Production ortamında HTTPS ile cookie otomatik olarak `Secure` olur.

---

## 📜 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

---

> Proje, Arin Yazılım "NODEJS Proje" serisindeki Express, MVC, MongoDB, JWT,
> dosya yükleme, e-posta ve deployment başlıkları temel alınarak Todo List alanına uyarlanmıştır.
