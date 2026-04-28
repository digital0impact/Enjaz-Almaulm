/**
 * expo export لا يدمج وسوم <head> من app/+html.tsx في dist/index.html،
 * فيفقد المتصفح (خصوصاً Chrome على أندرويد) رابط manifest والأيقونات PNG.
 * يُشغَّل بعد: expo export --platform web
 */
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/index.html');

if (!fs.existsSync(indexPath)) {
  console.warn('inject-pwa-html: dist/index.html غير موجود — تخطي.');
  process.exit(0);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes('rel="manifest"')) {
  console.log('inject-pwa-html: dist/index.html يحتوي manifest مسبقاً — تخطي.');
  process.exit(0);
}

const pwaHead = `
    <meta name="theme-color" content="#0d9488" />
    <meta name="description" content="تطبيق إنجاز المعلم للتطوير المهني والأداء" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/png" sizes="192x192" href="/logo192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/logo512.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
    <link rel="apple-touch-icon" href="/logo192.png" sizes="192x192" />
    <meta name="apple-mobile-web-app-title" content="إنجاز المعلم" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
`;

html = html.replace('<html lang="en">', '<html lang="ar" dir="rtl">');
html = html.replace(
  /<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" \/>/,
  `<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />${pwaHead}`
);

if (!html.includes('rel="manifest"')) {
  console.error('inject-pwa-html: فشل إدراج وسوم PWA (تنسيق index.html غير متوقع).');
  process.exit(1);
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('inject-pwa-html: تم تحديث dist/index.html (manifest + أيقونات PWA).');
