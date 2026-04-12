/**
 * يولّد assets/images/Logo-1024.png (1024×1024) من Logo.png لأيقونة أندرويد/Expo.
 * أندرويد يولّد عدة كثافات من المصدر؛ 512px غالباً يبدو ضبابياً على الشاشات عالية الكثافة.
 * تشغيل: node scripts/generate-logo-1024.js
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../assets/images/Logo.png');
const out = path.join(__dirname, '../assets/images/Logo-1024.png');

if (!fs.existsSync(src)) {
  console.error('غير موجود:', src);
  process.exit(1);
}

async function run() {
  const sharp = require('sharp');
  const meta = await sharp(src).metadata();
  await sharp(src)
    .resize(1024, 1024, {
      fit: 'contain',
      position: 'centre',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(
    `تم إنشاء Logo-1024.png من ${meta.width}×${meta.height} — يُفضَّل لاحقاً تصدير الشعار متجهياً أو 1024px من المصمم لأفضل وضوح.`
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
