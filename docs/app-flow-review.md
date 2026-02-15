# مراجعة منطق التدفق في التطبيق

## 1. هيكل المسارات (Expo Router)

```
app/
├── _layout.tsx          → Stack جذر (بدون هيدر) + ThemeProvider + UserProvider
├── index.tsx            → إعادة توجيه فورية إلى "/(tabs)"
├── (tabs)/
│   ├── _layout.tsx      → تبويبات: explore | performance | basicData | index (الرئيسية)
│   ├── index.tsx        → الشاشة الرئيسية (ترحيب أو لوحة تحكم)
│   ├── explore.tsx       → الأدوات المساعدة
│   ├── performance.tsx   → الأداء المهني
│   └── basicData.tsx    → البيانات الأساسية
├── login.tsx
├── signup.tsx
├── settings.tsx
├── subscription.tsx
├── azkar.tsx
├── schedule.tsx
├── interactive-report.tsx
├── student-tracking.tsx
├── add-student.tsx
├── remedial-plans.tsx
├── password-tracker.tsx
├── add-absence.tsx
├── absence-management.tsx
├── alerts-management.tsx
├── edit-alert.tsx
├── calendar.tsx
├── monthly-calendar.tsx
├── official-holidays.tsx
├── file-management.tsx
├── improvement-plan.tsx
├── detailed-report.tsx
├── report-screen.tsx
├── student-category-details.tsx
└── +not-found.tsx
```

---

## 2. تدفق الدخول والخروج

### نقطة الدخول
- **المسار `/`** → `app/index.tsx` يعيد التوجيه إلى `/(tabs)`.
- المستخدم يصل دائماً إلى **التبويبات**، والتبويب الافتراضي هو **الرئيسية** `(tabs)/index`.

### الشاشة الرئيسية `(tabs)/index.tsx`
- عند التحميل تستدعي `checkLoginStatus()`:
  - **Supabase:** `AuthService.checkAuthStatus()` (جلسة الحالية).
  - **احتياطي (ويب):** إن لم توجد جلسة، تُقرأ `userInfo` من AsyncStorage.
- النتيجة:
  - **يوجد مستخدم (جلسة أو userInfo)** → `currentScreen = 'dashboard'` وتبديل التبويبات ظاهر.
  - **لا يوجد مستخدم** → `currentScreen = 'welcome'` (صفحة الشعار) وإخفاء شريط التبويبات.

### صفحة الترحيب (Welcome)
- أزرار:
  - **"ابدأ الآن"** → `router.push('/signup')`
  - **"لديك حساب؟ تسجيل الدخول"** → `router.push('/login')`
- عند وجود الترحيب، التبويبات مخفية فلا يمكن الوصول لـ explore / performance / basicData بدون تسجيل دخول.

### تسجيل الدخول `login.tsx`
- بعد نجاح `AuthService.signInWithEmail()`:
  - AuthService يحفظ المستخدم محلياً: `userInfo` + `userToken` في AsyncStorage.
  - تحديث/إنشاء `basicData` (الاسم، البريد) في AsyncStorage.
  - **التوجيه:** `router.replace('/')` → إعادة توجيه إلى `/(tabs)` → الرئيسية تعيد فحص الحالة وتُظهر لوحة التحكم.

### إنشاء الحساب `signup.tsx`
- بعد نجاح `AuthService.signUpWithEmail()`:
  - AuthService يحفظ المستخدم محلياً (إن وُجدت جلسة).
  - حفظ `basicData` (الاسم، البريد).
  - تنبيه: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني".
  - **التوجيه:** `router.replace('/(tabs)')` → يفتح التبويبات على الرئيسية (حسب وجود جلسة/تأكيد البريد قد تظهر لوحة التحكم أو تبقى ترحيب).

### تسجيل الخروج (من لوحة التحكم)
- **المشكلة السابقة:** `handleLogout` في `(tabs)/index.tsx` كان يمسح فقط `userToken` و `userInfo` من AsyncStorage ولا يستدعي `AuthService.signOut()`، فجلسة Supabase تبقى فعّالة. عند إعادة فتح التطبيق أو إعادة تحميل الصفحة قد يعود `checkAuthStatus()` بجلسة ويُظهر لوحة التحكم مرة أخرى.
- **الإصلاح:** استدعاء `AuthService.signOut()` داخل `handleLogout` قبل أو بعد مسح التخزين المحلي، لضمان إنهاء الجلسة من Supabase أيضاً.

### الإعدادات وحذف الحساب `settings.tsx`
- **استعادة النسخة الاحتياطية:** بعد النجاح → `router.replace('/')`.
- **حذف الحساب:** مسح `userToken`, `userInfo`, `userId`, `basicData`, `userSettings` ثم `router.replace('/login')`. (لا يستدعي AuthService.signOut؛ يُفضّل إضافته إن كان الحساب يُحذف من Supabase أيضاً.)

---

## 3. تدفق التنقل من لوحة التحكم

من **الرئيسية (dashboard)**:
- الإعدادات → `/settings`
- تسجيل الخروج → `handleLogout()` ثم البقاء في نفس الشاشة مع عرض الترحيب
- أذكاري → `/azkar`
- الجدول → `/schedule`
- التقرير التفاعلي → `/interactive-report`
- تتبع المتعلمين → `/student-tracking`
- متتبع كلمات المرور → `/password-tracker`

التبويبات الأخرى (الأدوات المساعدة، الأداء المهني، البيانات الأساسية) تُفتح من شريط التبويبات ولا تتحقق من تسجيل الدخول داخل الشاشة؛ الاعتماد على أن التبويبات تظهر فقط عندما يكون المستخدم في وضع "dashboard" يمنع الوصول لها دون دخول.

---

## 4. ملخص التوصيات

| البند | الحالة | التوصية |
|-------|--------|----------|
| تدفق الدخول (ترحيب → تسجيل دخول/إنشاء حساب → رئيسية) | سليم | — |
| حفظ المستخدم بعد تسجيل الدخول (Supabase + AsyncStorage) | سليم | — |
| التوجيه بعد تسجيل الدخول (`replace('/')`) | سليم | — |
| تسجيل الخروج لا ينهي جلسة Supabase | **خلل** | استدعاء `AuthService.signOut()` في `handleLogout` (تم تطبيقه) |
| إخفاء التبويبات في شاشة الترحيب | سليم | — |
| حذف الحساب من الإعدادات | مقبول | إضافة `AuthService.signOut()` إن كان الحساب يُحذف من الخلفية |

---

## 5. ملاحظات إضافية

- **صفحة test-login:** موجودة وتوجّه إلى `/` بعد نجاح؛ يمكن إزالتها أو تقييدها للتطوير فقط.
- **الشاشات الأخرى (التقارير، الطلاب، الجدول، إلخ):** تعتمد على التنقل من داخل التطبيق بعد الدخول؛ لا يوجد حماية مسارات (route guard) على مستوى الـ Stack، والاعتماد الحالي على أن المستخدم يصل لهذه الشاشات فقط بعد المرور بالرئيسية وتسجيل الدخول.

إذا رغبت، يمكن في خطوة لاحقة إضافة طبقة حماية للمسارات (مثلاً تحقق من الجلسة قبل عرض بعض الشاشات) أو توحيد منطق "تسجيل الخروج" بين الرئيسية والإعدادات.
