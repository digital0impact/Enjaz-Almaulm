# دليل إعداد In-App Purchase لتجنب رفض Apple

## المشكلة السابقة
تم رفض التطبيق من Apple لأن:
- التطبيق يسمح بالاشتراك دون المرور ببوابة الشراء داخل التطبيق
- عدم وجود التحقق من الفاتورة (Receipt Validation)
- عدم التهيئة الصحيحة لبيئة الاختبار (Sandbox)

## الإصلاحات المطبقة

### 1. إزالة المحاكاة (Mock Purchases)
- ✅ تم إزالة جميع المحاكيات من الكود
- ✅ التطبيق الآن يتطلب اتصال حقيقي بمتجر Apple
- ✅ لا يمكن الشراء إلا من خلال بوابة Apple الرسمية

### 2. إضافة التحقق من الفاتورة (Receipt Validation)
```typescript
private async validateReceipt(purchase: Purchase): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const result = await validateReceiptIos({
      'receipt-data': purchase.transactionReceipt,
      'password': 'your-app-shared-secret',
      'exclude-old-transactions': true
    });
    return result.status === 0;
  }
  // ... Android validation
}
```

### 3. حفظ المشتريات في قاعدة البيانات
- ✅ حفظ محلي في AsyncStorage
- ✅ حفظ في Supabase للنسخ الاحتياطية
- ✅ التحقق من صحة البيانات قبل الحفظ

## خطوات الإعداد المطلوبة

### 1. إعداد App Store Connect

#### أ. إنشاء المنتجات
1. اذهب إلى [App Store Connect](https://appstoreconnect.apple.com)
2. اختر تطبيقك
3. اذهب إلى **Features** > **In-App Purchases**
4. أنشئ منتجين:
   - `com.enjazalmualm.subscription.yearly` (سنوي)
   - `com.enjazalmualm.subscription.halfyearly` (نصف سنوي)

#### ب. إعداد App Shared Secret
1. في App Store Connect، اذهب إلى **Users and Access**
2. اختر **Keys** > **In-App Purchase**
3. أنشئ مفتاح جديد
4. انسخ **App Shared Secret**
5. استبدل `'your-app-shared-secret'` في الكود بالقيمة الحقيقية

### 2. إعداد قاعدة البيانات

#### أ. تشغيل سكريبت الإعداد
```bash
# تأكد من وجود متغيرات البيئة
export EXPO_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# تشغيل سكريبت الإعداد
node scripts/setup-subscription-database.js
```

#### ب. التحقق من الجداول
```sql
-- التحقق من إنشاء الجداول
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_prices', 'user_subscriptions');

-- التحقق من البيانات
SELECT * FROM subscription_prices;
```

### 3. إعداد التطبيق

#### أ. تحديث معرفات المنتجات
في `services/InAppPurchaseService.ts`:
```typescript
const SUBSCRIPTION_SKUS = Platform.select({
  ios: [
    'com.enjazalmualm.subscription.yearly',      // تأكد من تطابق هذا مع App Store Connect
    'com.enjazalmualm.subscription.halfyearly'   // تأكد من تطابق هذا مع App Store Connect
  ],
  android: [
    'yearly_subscription',
    'halfyearly_subscription'
  ],
  default: []
});
```

#### ب. تحديث App Shared Secret
```typescript
// في دالة validateReceipt
const result = await validateReceiptIos({
  'receipt-data': purchase.transactionReceipt,
  'password': 'YOUR_ACTUAL_APP_SHARED_SECRET', // استبدل بالقيمة الحقيقية
  'exclude-old-transactions': true
});
```

### 4. اختبار Sandbox

#### أ. إنشاء حساب اختبار
1. في App Store Connect، اذهب إلى **Users and Access**
2. اختر **Sandbox Testers**
3. أنشئ حساب اختبار جديد
4. استخدم هذا الحساب لاختبار المشتريات

#### ب. اختبار التطبيق
1. ثبت التطبيق على جهاز حقيقي (ليس محاكي)
2. سجل الدخول بحساب Sandbox
3. جرب شراء اشتراك
4. تأكد من ظهور نافذة Apple للدفع
5. تأكد من حفظ المشتريات في قاعدة البيانات

## التحقق من التوافق

### 1. قائمة التحقق قبل الرفع
- [ ] جميع معرفات المنتجات متطابقة مع App Store Connect
- [ ] App Shared Secret محدث في الكود
- [ ] قاعدة البيانات مهيأة بشكل صحيح
- [ ] لا توجد محاكيات في الكود
- [ ] التحقق من الفاتورة يعمل بشكل صحيح
- [ ] اختبار Sandbox ناجح

### 2. اختبارات مطلوبة
- [ ] شراء اشتراك سنوي
- [ ] شراء اشتراك نصف سنوي
- [ ] استعادة المشتريات
- [ ] التحقق من انتهاء الصلاحية
- [ ] التبديل بين الخطط

## ملاحظات مهمة

### 1. بيئة التطوير
- في وضع التطوير، قد لا تعمل المشتريات الحقيقية
- استخدم Sandbox Testers للاختبار
- تأكد من أن التطبيق مبني بـ `expo build` وليس `expo start`

### 2. الأمان
- لا تشارك App Shared Secret في الكود العام
- استخدم متغيرات البيئة للقيم الحساسة
- تأكد من تفعيل RLS في Supabase

### 3. الأداء
- التحقق من الفاتورة قد يستغرق وقتاً
- أضف مؤشرات تحميل للمستخدم
- تعامل مع أخطاء الشبكة بشكل صحيح

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. "فشل في الاتصال بمتجر التطبيقات"
- تأكد من وجود اتصال بالإنترنت
- تأكد من أن التطبيق مبني بشكل صحيح
- تحقق من معرفات المنتجات

#### 2. "فشل في التحقق من صحة الفاتورة"
- تحقق من App Shared Secret
- تأكد من أن المنتج مفعل في App Store Connect
- تحقق من صحة Receipt Data

#### 3. "المنتج غير موجود"
- تحقق من معرفات المنتجات
- تأكد من تفعيل المنتجات في App Store Connect
- انتظر 24 ساعة بعد إنشاء المنتج

## الدعم

إذا واجهت مشاكل:
1. راجع سجلات الأخطاء في التطبيق
2. تحقق من سجلات Supabase
3. راجع إعدادات App Store Connect
4. اختبر في بيئة Sandbox أولاً 