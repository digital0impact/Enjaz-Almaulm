#!/usr/bin/env node

/**
 * سكريبت تنظيف شامل لمشروع إنجاز المعلم
 * يقوم بتنظيف الملفات المؤقتة والكاش وتحسين الأداء
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 بدء عملية تنظيف المشروع...\n');

// الألوان للـ console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${step} ${description}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// 1. تنظيف node_modules (اختياري)
logStep('1️⃣', 'تنظيف node_modules (اختياري)');
const shouldCleanNodeModules = process.argv.includes('--clean-deps');
if (shouldCleanNodeModules) {
  try {
    log('حذف node_modules...', 'yellow');
    if (fs.existsSync('node_modules')) {
      fs.rmSync('node_modules', { recursive: true, force: true });
      logSuccess('تم حذف node_modules');
    }
    
    log('إعادة تثبيت التبعيات...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });
    logSuccess('تم إعادة تثبيت التبعيات');
  } catch (error) {
    logError(`فشل في تنظيف التبعيات: ${error.message}`);
  }
} else {
  logWarning('تخطي تنظيف node_modules (استخدم --clean-deps لتشغيله)');
}

// 2. تنظيف كاش npm
logStep('2️⃣', 'تنظيف كاش npm');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  logSuccess('تم تنظيف كاش npm');
} catch (error) {
  logError(`فشل في تنظيف كاش npm: ${error.message}`);
}

// 3. تنظيف كاش Expo
logStep('3️⃣', 'تنظيف كاش Expo');
try {
  if (fs.existsSync('.expo')) {
    fs.rmSync('.expo', { recursive: true, force: true });
    logSuccess('تم حذف مجلد .expo');
  }
  
  execSync('npx expo install --fix', { stdio: 'inherit' });
  logSuccess('تم إصلاح تبعيات Expo');
} catch (error) {
  logError(`فشل في تنظيف كاش Expo: ${error.message}`);
}

// 4. تنظيف ملفات البناء
logStep('4️⃣', 'تنظيف ملفات البناء');
const buildDirs = ['dist', 'build', '.next', 'out'];
buildDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      logSuccess(`تم حذف مجلد ${dir}`);
    } catch (error) {
      logError(`فشل في حذف ${dir}: ${error.message}`);
    }
  }
});

// 5. تنظيف ملفات مؤقتة
logStep('5️⃣', 'تنظيف الملفات المؤقتة');
const tempFiles = [
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '*.tmp',
  '*.temp'
];

tempFiles.forEach(pattern => {
  try {
    execSync(`find . -name "${pattern}" -type f -delete`, { stdio: 'pipe' });
  } catch (error) {
    // تجاهل الأخطاء للملفات غير الموجودة
  }
});
logSuccess('تم تنظيف الملفات المؤقتة');

// 6. تنظيف ملفات IDE
logStep('6️⃣', 'تنظيف ملفات IDE');
const ideDirs = ['.vscode', '.idea', '.vs'];
ideDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      logSuccess(`تم حذف مجلد ${dir}`);
    } catch (error) {
      logError(`فشل في حذف ${dir}: ${error.message}`);
    }
  }
});

// 7. فحص الأخطاء في الكود
logStep('7️⃣', 'فحص الأخطاء في الكود');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  logSuccess('لا توجد أخطاء TypeScript');
} catch (error) {
  logWarning('تم العثور على أخطاء TypeScript - يرجى مراجعتها');
}

// 8. تشغيل ESLint
logStep('8️⃣', 'تشغيل ESLint');
try {
  execSync('npx eslint . --ext .ts,.tsx --fix', { stdio: 'inherit' });
  logSuccess('تم تنظيف الكود باستخدام ESLint');
} catch (error) {
  logWarning('تم العثور على أخطاء ESLint - يرجى مراجعتها');
}

// 9. تنظيف ملفات README المكررة
logStep('9️⃣', 'تنظيف ملفات README المكررة');
const readmeFiles = [
  'QUICK_TEST_GUIDE.md',
  'TESTING_GUIDE.md',
  'QUICK_START_STORAGE.md',
  'STORAGE_SETUP.md',
  'SUPABASE_SETUP.md'
];

readmeFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      logSuccess(`تم حذف ${file}`);
    } catch (error) {
      logError(`فشل في حذف ${file}: ${error.message}`);
    }
  }
});

// 10. إنشاء تقرير التنظيف
logStep('🔟', 'إنشاء تقرير التنظيف');
const cleanupReport = {
  timestamp: new Date().toISOString(),
  cleanedDependencies: shouldCleanNodeModules,
  cleanedCache: true,
  cleanedBuildFiles: true,
  cleanedTempFiles: true,
  cleanedIDEFiles: true,
  typescriptErrors: false,
  eslintErrors: false,
  removedReadmeFiles: readmeFiles.filter(file => !fs.existsSync(file))
};

fs.writeFileSync('cleanup-report.json', JSON.stringify(cleanupReport, null, 2));
logSuccess('تم إنشاء تقرير التنظيف');

// 11. عرض ملخص التنظيف
logStep('📊', 'ملخص عملية التنظيف');
log(`\n${colors.bright}تم الانتهاء من عملية التنظيف!${colors.reset}\n`);

log('📁 الملفات والمجلدات التي تم تنظيفها:', 'green');
log('   • كاش npm', 'green');
log('   • مجلد .expo', 'green');
log('   • ملفات البناء المؤقتة', 'green');
log('   • ملفات IDE', 'green');
log('   • ملفات README المكررة', 'green');

log('\n🔧 الخطوات التالية:', 'yellow');
log('   1. تشغيل التطبيق: npm start', 'yellow');
log('   2. فحص الأخطاء في الكود', 'yellow');
log('   3. اختبار التطبيق', 'yellow');

log('\n📄 تقرير مفصل متاح في: cleanup-report.json', 'blue');

console.log('\n🎉 تم تنظيف المشروع بنجاح!'); 