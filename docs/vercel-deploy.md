# نشر التطبيق على Vercel

## الإعداد في لوحة Vercel

1. **ربط المستودع**
   - في [Vercel](https://vercel.com) → Import Git Repository واختر مشروع إنجاز المعلم.

2. **إعدادات البناء (عادةً تُؤخذ من `vercel.json`)**
   - **Build Command:** `npm run build:web`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Framework Preset:** Other (أو اتركه فارغاً لأن `framework: null` في الإعداد).

3. **إصدار Node.js**
   - المشروع يستخدم Node 20 (`package.json` → `"engines": { "node": "20.x" }`).
   - في Vercel: Project Settings → General → Node.js Version اختر **20.x** إن ظهرت المشكلة بسبب الإصدار.

4. **متغيرات البيئة (مهمة للتشغيل)**
   - في Project Settings → Environment Variables أضف نفس المتغيرات المستخدمة في `.env` محلياً، خاصة:
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - أي متغير يبدأ بـ `EXPO_PUBLIC_` يُحقَن أثناء البناء ويُستخدم في الويب.

## إذا استمر فشل النشر

- انسخ **رسالة الخطأ الكاملة** من تبويب Deployments → آخر نشر فاشل → View Build Logs.
- تأكد أن الفرع الذي تنشر منه (مثلاً `main`) محدث وأن البناء يعمل محلياً:
  ```bash
  npm run build:web
  ```
- تم تعديل `scripts/generate-pwa-icons.js` بحيث لا يوقف البناء إذا فشل إنشاء أيقونات PWA (مثلاً مشاكل `sharp` على سيرفر Vercel).
