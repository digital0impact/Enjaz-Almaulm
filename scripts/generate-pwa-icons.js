/**
 * إنشاء أيقونات PWA (logo192.png, logo512.png) من شعار التطبيق.
 * تشغيل: node scripts/generate-pwa-icons.js
 * يتطلب: npm install --save-dev sharp (أو انسخ Logo.png يدوياً إلى public/ بالأحجام المطلوبة).
 */
const fs = require('fs');
const path = require('path');

const hiRes = path.join(__dirname, '../assets/images/Logo-1024.png');
const fallback = path.join(__dirname, '../assets/images/Logo.png');
const src = fs.existsSync(hiRes) ? hiRes : fallback;
const publicDir = path.join(__dirname, '../public');

if (!fs.existsSync(src)) {
  console.warn('لم يُعثر على Logo-1024.png أو Logo.png — أضف أيقونات PWA يدوياً إلى public/.');
  process.exit(0);
}
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

/** أيقونة maskable: الشعار داخل ~72% من المربع حتى لا يُقصّ بقناع الدائرة على أندرويد (Chrome). */
async function writeMaskable(sharpMod, size, fileName) {
  const inner = Math.max(1, Math.round(size * 0.72));
  const padded = await sharpMod(src)
    .resize(inner, inner, {
      fit: 'contain',
      position: 'centre',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: sharpMod.kernel.lanczos3,
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();
  const left = Math.floor((size - inner) / 2);
  const top = Math.floor((size - inner) / 2);
  await sharpMod({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: padded, left, top }])
    .png()
    .toFile(path.join(publicDir, fileName));
}

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
    await writeMaskable(sharp, 192, 'logo-maskable-192.png');
    await writeMaskable(sharp, 512, 'logo-maskable-512.png');
    console.log(
      'تم إنشاء أيقونات PWA: logo192.png, logo512.png, apple-touch-icon.png, logo-maskable-*.png'
    );
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      for (const { name } of outputs) {
        fs.copyFileSync(src, path.join(publicDir, name));
      }
      fs.copyFileSync(path.join(publicDir, 'logo192.png'), path.join(publicDir, 'logo-maskable-192.png'));
      fs.copyFileSync(path.join(publicDir, 'logo512.png'), path.join(publicDir, 'logo-maskable-512.png'));
      console.log('تم نسخ الشعار. لأفضل نتيجة: npm i -D sharp ثم أعد التشغيل.');
    } else {
      console.warn('تحذير sharp:', e.message || e);
      try {
        for (const { name } of outputs) {
          fs.copyFileSync(src, path.join(publicDir, name));
        }
        fs.copyFileSync(path.join(publicDir, 'logo192.png'), path.join(publicDir, 'logo-maskable-192.png'));
        fs.copyFileSync(path.join(publicDir, 'logo512.png'), path.join(publicDir, 'logo-maskable-512.png'));
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
