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
  const outputs = [
    { name: 'logo192.png', size: 192 },
    { name: 'logo512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
  ];
  try {
    const sharp = require('sharp');
    for (const { name, size } of outputs) {
      await sharp(src)
        .resize(size, size)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .toFile(path.join(publicDir, name));
    }
    console.log('تم إنشاء أيقونات PWA: logo192.png, logo512.png, apple-touch-icon.png');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      for (const { name } of outputs) {
        fs.copyFileSync(src, path.join(publicDir, name));
      }
      console.log('تم نسخ الشعار. لأفضل نتيجة: npm i -D sharp ثم أعد التشغيل.');
    } else {
      console.warn('تحذير sharp:', e.message || e);
      try {
        for (const { name } of outputs) {
          fs.copyFileSync(src, path.join(publicDir, name));
        }
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
