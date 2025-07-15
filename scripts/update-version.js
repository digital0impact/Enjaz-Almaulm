const fs = require('fs');
const path = require('path');

// قراءة ملف app.json أولاً
const appJsonPath = path.join(__dirname, '../app.json');
const appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

// استخراج الأرقام الحالية من app.json
const currentVersion = appJsonContent.expo.version.split('.').map(Number);
const currentBuildNumber = parseInt(appJsonContent.expo.ios.buildNumber);

// زيادة الأرقام
const [major, minor, patch] = currentVersion;
const newBuildNumber = currentBuildNumber + 1;
const newPatch = patch + 1;

// تحديث app.json
appJsonContent.expo.version = `${major}.${minor}.${newPatch}`;
appJsonContent.expo.ios.buildNumber = newBuildNumber.toString();
appJsonContent.expo.android.versionCode = newBuildNumber;
fs.writeFileSync(appJsonPath, JSON.stringify(appJsonContent, null, 2));

// تحديث Version.ts
const versionPath = path.join(__dirname, '../constants/Version.ts');
let versionContent = fs.readFileSync(versionPath, 'utf8');

// تحديث القيم في Version.ts
versionContent = versionContent.replace(
  /major: \d+,\s+minor: \d+,\s+patch: \d+,\s+build: \d+/,
  `major: ${major},\n  minor: ${minor},\n  patch: ${newPatch},\n  build: ${newBuildNumber}`
);

const today = new Date().toISOString().split('T')[0];
versionContent = versionContent.replace(
  /releaseDate: '[^']*'/,
  `releaseDate: '${today}'`
);

fs.writeFileSync(versionPath, versionContent);

// تحديث package.json
const packagePath = path.join(__dirname, '../package.json');
const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageContent.version = `${major}.${minor}.${newPatch}`;
fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2));

console.log(`✅ تم تحديث الإصدار إلى ${major}.${minor}.${newPatch} (البناء ${newBuildNumber})`);
console.log(`📅 تاريخ الإصدار: ${today}`); 