/**
 * إنشاء أيقونات PWA من شعار التطبيق.
 * - أيقونات عادية (any): logo192.png, logo512.png
 * - أيقونات maskable لأندرويد: logo-maskable-192.png, logo-maskable-512.png
 *   (المحتوى داخل safe zone 80% لظهور صحيح على أي شكل)
 * تشغيل: node scripts/generate-pwa-icons.js
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../assets/images/Logo.png');
const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(src)) {
  console.warn('لم يُعثر على assets/images/Logo.png — أضف أيقونات PWA يدوياً إلى public/.');
  process.exit(0);
}
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

async function run() {
  const outputs = [
    { name: 'logo192.png', size: 192, maskable: false },
    { name: 'logo512.png', size: 512, maskable: false },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'logo-maskable-192.png', size: 192, maskable: true },
    { name: 'logo-maskable-512.png', size: 512, maskable: true },
  ];
  try {
    const sharp = require('sharp');
    for (const { name, size, maskable } of outputs) {
      if (maskable) {
        // أيقونة maskable: المحتوى داخل 80% من المساحة (safe zone لأندرويد)
        const contentSize = Math.round(size * 0.8);
        const logo = await sharp(src)
          .resize(contentSize, contentSize)
          .flatten({ background: { r: 255, g: 255, b: 255 } });
        const padding = (size - contentSize) / 2;
        await sharp({
          create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .composite([{ input: await logo.toBuffer(), left: Math.round(padding), top: Math.round(padding) }])
          .png()
          .toFile(path.join(publicDir, name));
      } else {
        await sharp(src)
          .resize(size, size)
          .flatten({ background: { r: 255, g: 255, b: 255 } })
          .toFile(path.join(publicDir, name));
      }
    }
    console.log('تم إنشاء أيقونات PWA: logo192, logo512, apple-touch-icon, logo-maskable-192, logo-maskable-512');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      const basicOutputs = [
        { name: 'logo192.png' },
        { name: 'logo512.png' },
        { name: 'apple-touch-icon.png' },
      ];
      for (const { name } of basicOutputs) {
        fs.copyFileSync(src, path.join(publicDir, name));
      }
      console.log('تم نسخ الشعار. لأفضل نتيجة: npm i -D sharp ثم أعد التشغيل.');
    } else {
      console.warn('تحذير sharp:', e.message || e);
      try {
        const basicOutputs = outputs.filter((o) => !o.maskable);
        for (const { name } of basicOutputs) {
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
