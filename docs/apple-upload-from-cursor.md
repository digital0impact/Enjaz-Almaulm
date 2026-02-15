# رفع التطبيق إلى حساب أبل للمطورين من Cursor

نعم، يمكنك تنفيذ كل الخطوات من **طرفية Cursor** (Terminal) لبناء التطبيق ورفعه إلى App Store Connect.

> ملاحظة: أبل لا تقبل الكود المصدري، بل تقبل فقط ملف التطبيق المُبنى (IPA). البناء يتم عبر EAS ثم يُرفع الملف تلقائياً.

## المتطلبات

- اشتراك [Apple Developer](https://developer.apple.com) (99 دولار/سنة).
- حساب [Expo](https://expo.dev) (الخطة المجانية تكفي لعدد محدود من البناءات).
- المشروع مضبوط على EAS (وهذا متوفر في المشروع).

## الخطوات من Cursor

### 1. فتح الطرفية

من Cursor: **Terminal → New Terminal** (أو `` Ctrl+` ``).

### 2. تسجيل الدخول إلى Expo (مرة واحدة)

```bash
npx eas login
```

أدخل بريدك وكلمة المرور لحساب Expo.

### 3. ربط حساب أبل مع EAS (مرة واحدة)

عند أول بناء لـ iOS سيُطلب منك ربط Apple ID (حساب المطور). أو يدوياً:

```bash
npx eas credentials --platform ios
```

اختر إدارة بيانات الاعتماد واتبع التعليمات لربط Apple ID.

### 4. بناء نسخة iOS للإنتاج

```bash
npx eas build --platform ios --profile production
```

البناء يتم على سيرفرات EAS (ليس على جهازك). بعد الانتهاء ستجد الرابط في الطرفية وفي [expo.dev](https://expo.dev).

### 5. رفع البناء إلى App Store Connect

بعد نجاح البناء:

```bash
npx eas submit --platform ios --latest
```

أو لرفع بناء معيّن (انسخ الـ Build ID من لوحة EAS):

```bash
npx eas submit --platform ios --id <BUILD_ID>
```

بعد الرفع، ادخل إلى [App Store Connect](https://appstoreconnect.apple.com) وأكمل إعداد الصفحة وإرسال التطبيق للمراجعة.

## ملخص الأوامر

| الهدف              | الأمر |
|--------------------|--------|
| تسجيل الدخول Expo | `npx eas login` |
| بناء iOS للإنتاج   | `npx eas build --platform ios --profile production` |
| رفع آخر بناء       | `npx eas submit --platform ios --latest` |

كل هذه الأوامر تُنفَّذ من طرفية Cursor كما تُنفَّذ من أي طرفية أخرى.
