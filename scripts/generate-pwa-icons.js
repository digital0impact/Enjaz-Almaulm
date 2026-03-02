/**
 * إنشاء أيقونات PWA (logo192.png, logo512.png) من شعار التطبيق.
 * تشغيل: node scripts/generate-pwa-icons.js
 * يتطلب: npm install --save-dev sharp (أو انسخ Logo.png يدوياً إلى public/ بالأحجام المطلوبة).
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../assets/images/Logo.png');
const publicDir = path.join(__dirname, '../public');

if (!fs.existsSync(src)) {
  console.warn('لم يُعثر على assets/images/Logo.png — أضف أيقونات PWA يدوياً إلى public/ (logo192.png، logo512.png).');
  process.exit(0);
}
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

async function run() {
  try {
    const sharp = require('sharp');
    await Promise.all([
      sharp(src).resize(192, 192).toFile(path.join(publicDir, 'logo192.png')),
      sharp(src).resize(512, 512).toFile(path.join(publicDir, 'logo512.png')),
    ]);
    console.log('تم إنشاء public/logo192.png و public/logo512.png بنجاح.');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      fs.copyFileSync(src, path.join(publicDir, 'logo192.png'));
      fs.copyFileSync(src, path.join(publicDir, 'logo512.png'));
      console.log('تم نسخ الشعار إلى public/logo192.png و logo512.png (لأفضل نتيجة: npm i -D sharp ثم أعد التشغيل).');
    } else {
      // على Vercel قد يفشل sharp (ربطات أصلية) — ننسخ الملف كبديل ولا نوقف البناء
      console.warn('تحذير sharp:', e.message || e);
      try {
        fs.copyFileSync(src, path.join(publicDir, 'logo192.png'));
        fs.copyFileSync(src, path.join(publicDir, 'logo512.png'));
        console.log('تم نسخ الشعار كبديل إلى public/.');
      } catch (copyErr) {
        console.warn('لم يتم إنشاء أيقونات PWA:', copyErr.message || copyErr);
      }
    }
  }
}

run().catch((err) => {
  console.warn('generate-pwa-icons:', err.message || err);
  process.exit(0);
});
