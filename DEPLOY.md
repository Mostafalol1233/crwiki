# 🚀 نشر المشروع على Vercel (Deployment Guide)

## نظرة سريعة
هذا المشروع يتم نشره على Vercel كـ **Frontend (React) + Backend (Express Serverless)**. الـ frontend يُـhosted كـ static site والـ backend يعمل كـ serverless functions.

---

## ✅ المتطلبات
1. حساب GitHub (يحتوي على repository المشروع)
2. حساب Vercel (مرتبط بـ GitHub)
3. MongoDB Atlas (database) — يمكن استخدام free tier
4. توكن GitHub (اختياري — فقط لو تستخدم GitHub-as-DB)

---

## 📋 خطوات النشر

### 1️⃣ **تحضير المتغيرات المحلية**
تأكد أن جميع env vars موجودة في ملف `.env` أو `.env.local` محلياً:
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
ADMIN_PASSWORD=...
```

### 2️⃣ **اختبر البناء محلياً**
```bash
npm run build
```
تأكد من أن:
- ✅ `dist/client/` موجود (React app compiled)
- ✅ `dist/server/index.js` موجود (Express app compiled)

### 3️⃣ **ادفع التغييرات إلى GitHub**
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

### 4️⃣ **ربط مشروعك بـ Vercel**
- اذهب إلى https://vercel.com/import
- اختر repository مشروعك
- Vercel سيكتشف `vercel.json` ويستخدم الإعدادات الموجودة فيه

### 5️⃣ **ضبط Environment Variables في Vercel Dashboard**
في **Project Settings → Environment Variables**، أضف:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | `your-secret-key` |
| `ADMIN_PASSWORD` | `SuperAdmin#2024$...` |
| `VITE_API_URL` | `https://your-app.vercel.app/api` |
| `PUBLIC_BASE_URL` | `https://your-app.vercel.app` |

> 💡 للحصول على `MONGODB_URI`:
> 1. اذهب إلى MongoDB Atlas
> 2. أنشئ Cluster (free tier OK)
> 3. اضغط "Connect" → "Drivers" → نسخ connection string
> 4. استبدل `<username>` و `<password>` بـ credentials

### 6️⃣ **تفعيل Deploy**
Vercel سيبدأ البناء تلقائياً عند الـ push. شاهد logs:
- في Vercel Dashboard → **Deployments**
- ابحث عن Build Logs

### ✅ **بعد النشر الناجح**
- Frontend متاح على: `https://your-app.vercel.app`
- API متاح على: `https://your-app.vercel.app/api`

---

## 🔧 هندسة النشر (تفاصيل تقنية)

### البناء (Build Process)
```bash
npm run build
├── vite build                    # Compile React app → dist/client/
└── esbuild server/index.ts       # Bundle Express app → dist/server/index.js
```

### الـ Routing على Vercel
```
- GET  /            →  dist/client/index.html (React Router handles routing)
- GET  /api/*       →  api/server.js wrapper  (Forward to Express app)
- POST /api/*       →  api/server.js wrapper  (Forward to Express app)
```

### Serverless Handler
ملف `api/server.js` يعمل كـ wrapper:
```javascript
export default async function handler(req, res) {
  const mod = await import('../dist/server/index.js');
  const app = mod.default;
  return app(req, res);  // Pass request to Express app
}
```

---

## 🐛 استكشاف الأخطاء

### ❌ خطأ: "Cannot find module '../dist/server/index.js'"
**السبب**: البناء لم ينتج ملفات الـ server  
**الحل**:
1. تحقق من Build Logs في Vercel
2. تأكد من عدم وجود أخطاء في TypeScript (`npm run check`)
3. شغّل `npm run build` محلياً وابحث عن الأخطاء

### ❌ خطأ: "MONGODB_URI is not defined"
**السبب**: متغير البيئة لم يُضَبَط في Vercel  
**الحل**:
1. اذهب إلى Vercel Dashboard
2. Project Settings → Environment Variables
3. أضف `MONGODB_URI` مع قيمة صحيحة
4. أعد Deploy (Redeploy from Vercel UI)

### ❌ الـ API تعود 405 Method Not Allowed
**السبب**: ربما الـ wrapper لم يُحمَّل بنجاح  
**الحل**:
1. افحص Vercel Function Logs
2. تأكد من أن `dist/server/index.js` موجود (check build artifacts)

---

## 📱 اختبار API بعد النشر
```bash
# اختبر authentication
curl -X POST https://your-app.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"SuperAdmin#2024$SecurePass!9x"}'

# اختبر GET weapons
curl https://your-app.vercel.app/api/weapons
```

---

## 🔄 إعادة Deploy
لـ redeploy التطبيق بدون تغييرات:
1. Vercel Dashboard → **Deployments**
2. اختر آخر deployment
3. اضغط **Redeploy**

أو ادفع commit فارغ:
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

---

## 📚 مراجع مفيدة
- [Vercel Documentation](https://vercel.com/docs)
- [Express + Vercel Serverless](https://vercel.com/guides/using-express-with-vercel)
- [MongoDB Atlas Connection](https://docs.atlas.mongodb.com/connect-to-cluster/)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

---

## ✅ Checklist
- [ ] MongoDB Atlas cluster إنشاء وحصول على `MONGODB_URI`
- [ ] Environment variables ضبط في Vercel
- [ ] `npm run build` ينتج `dist/client` و `dist/server/index.js` بنجاح
- [ ] Commit و push إلى GitHub
- [ ] Deploy من Vercel بنجاح (check Build Logs)
- [ ] اختبار API endpoint بعد النشر

---

**تمت!** 🎉 موقعك يعمل الآن على Vercel بـ serverless backend.
