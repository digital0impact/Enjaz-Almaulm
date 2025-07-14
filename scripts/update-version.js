const fs = require('fs');
const path = require('path');

// قراءة ملف Version.ts
const versionPath = path.join(__dirname, '../constants/Version.ts');
let versionContent = fs.readFileSync(versionPath, 'utf8');

// استخراج الأرقام الحالية
const versionMatch = versionContent.match(/major: (\d+),\s+minor: (\d+),\s+patch: (\d+),\s+build: (\d+)/);
if (!versionMatch) {
  console.error('❌ لم يتم العثور على أرقام الإصدار في الملف');
  process.exit(1);
}

const [, major, minor, patch, build] = versionMatch.map(Number);

// زيادة رقم البناء
const newBuild = build + 1;
const newPatch = patch + 1;

// تحديث المحتوى
versionContent = versionContent.replace(
  /major: \d+,\s+minor: \d+,\s+patch: \d+,\s+build: \d+/,
  `major: ${major},\n  minor: ${minor},\n  patch: ${newPatch},\n  build: ${newBuild}`
);

// تحديث تاريخ الإصدار
const today = new Date().toISOString().split('T')[0];
versionContent = versionContent.replace(
  /releaseDate: '[^']*'/,
  `releaseDate: '${today}'`
);

// حفظ الملف
fs.writeFileSync(versionPath, versionContent);

// تحديث package.json
const packagePath = path.join(__dirname, '../package.json');
const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageContent.version = `${major}.${minor}.${newPatch}`;
fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));

// تحديث app.json
const appJsonPath = path.join(__dirname, '../app.json');
const appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
appJsonContent.expo.version = `${major}.${minor}.${newPatch}`;
appJsonContent.expo.ios.buildNumber = newBuild.toString();
appJsonContent.expo.android.versionCode = newBuild;
fs.writeFileSync(appJsonPath, JSON.stringify(appJsonContent, null, 2));

console.log(`✅ تم تحديث الإصدار إلى ${major}.${minor}.${newPatch} (البناء ${newBuild})`);
console.log(`📅 تاريخ الإصدار: ${today}`); 