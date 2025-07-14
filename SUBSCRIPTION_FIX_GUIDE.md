# دليل إصلاح نظام الاشتراكات

## المشاكل التي تم إصلاحها

### 1. مشكلة الشراء التلقائي بدون بوابة الدفع
**المشكلة**: التطبيق كان ينشئ اشتراكات بدون المرور عبر بوابة الدفع
**الحل**: 
- إصلاح `InAppPurchaseService.ts` لمنع المحاكاة في الإنتاج
- إضافة التحقق من حالة الشراء قبل إنشاء الاشتراك

### 2. إنشاء اشتراكات بدون تحقق من الدفع
**المشكلة**: إنشاء اشتراكات مباشرة في قاعدة البيانات
**الحل**:
- إضافة حقل `purchase_verified` للتحقق من صحة الدفع
- إضافة حقل `transaction_id` لتتبع المعاملات
- إلغاء الدالة `startSubscription` واستبدالها بـ `createVerifiedSubscription`

## خطوات التطبيق

### 1. تحديث قاعدة البيانات
```sql
-- تشغيل الملف: scripts/update-subscription-schema.sql
-- في Supabase SQL Editor
```

### 2. إعادة تشغيل التطبيق
```bash
npx expo start --clear
```

### 3. اختبار التدفق الجديد
1. محاولة شراء اشتراك
2. التأكد من المرور عبر بوابة الدفع
3. التحقق من إنشاء الاشتراك فقط بعد الدفع الناجح

## التغييرات المطلوبة في الكود

### ملفات معدلة:
- `services/InAppPurchaseService.ts` ✅
- `services/SubscriptionService.ts` ✅
- `scripts/update-subscription-schema.sql` ✅

### ملفات تحتاج مراجعة:
- `app/subscription.tsx` - تحديث استخدام الدوال الجديدة
- أي ملفات أخرى تستخدم `startSubscription`

## التحقق من الإصلاح

### 1. في وضع التطوير:
- يجب أن تعمل المحاكاة بشكل طبيعي
- ظهور رسائل تحذير عند استخدام الدوال القديمة

### 2. في الإنتاج:
- يجب أن يمر المستخدم عبر بوابة الدفع
- لا يمكن إنشاء اشتراك بدون دفع ناجح
- تسجيل جميع المعاملات مع معرفات فريدة

## ملاحظات مهمة

1. **الاشتراكات المجانية**: تبقى متحقق منها تلقائياً
2. **الاشتراكات الموجودة**: تحتاج مراجعة يدوية
3. **النسخ الاحتياطية**: تأكد من عمل نسخة احتياطية قبل التحديث

## اختبار ما بعد الإصلاح

```typescript
// اختبار إنشاء اشتراك جديد
const success = await InAppPurchaseService.purchase('yearly');
if (success) {
  // يجب أن يكون هناك transaction_id
  const subscription = await SubscriptionService.getCurrentSubscription(userId);
  console.log('Transaction ID:', subscription?.transaction_id);
  console.log('Verified:', subscription?.purchase_verified);
}
``` 