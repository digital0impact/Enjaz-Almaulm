# اشتراك اشتريته ولم يظهر في التطبيق

إذا اشتريت اشتراكاً برقم جوال معيّن ولم يظهر في التطبيق أو في جدول `subscriptions`، اتبع الخطوات التالية.

---

## 1) التحقق من وجود رقم الجوال في الجداول

الويب هوك يربط الطلب بالمستخدم عبر **البريد** أو **رقم الجوال**. رقم الجوال يجب أن يكون مسجّلاً في أحد الجدولين:
- `public.user_profiles` (عمود `phone_number`)
- `public.users` (عمود `phone_number`)

**في Supabase → SQL Editor نفّذ:**

```sql
-- استبدل 05XXXXXXXX برقم الجوال الذي اشتريت به (مثلاً 0512345678 أو 966512345678)
SELECT id, email, name, phone_number FROM public.user_profiles
WHERE phone_number IS NOT NULL AND phone_number != ''
  AND (phone_number LIKE '%512345678%' OR REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') LIKE '%512345678%');

SELECT id, email, name, phone_number FROM public.users
WHERE phone_number IS NOT NULL AND phone_number != ''
  AND (phone_number LIKE '%512345678%' OR REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') LIKE '%512345678%');
```

- إذا **لم يظهر أي صف:** رقم الجوال غير مسجّل في التطبيق. سجّل الدخول من التطبيق → الإعدادات → البيانات الأساسية → احفظ **نفس رقم الجوال** الذي استخدمته في الطلب، ثم انتقل إلى الخطوة 2 أو استخدم السكربت اليدوي لإضافة الاشتراك بعد أن يظهر المستخدم.
- إذا **ظهر صف:** انسخ قيمة `id` (UUID) للمستخدم للاستخدام في الخطوة 3.

---

## 2) التحقق من ويب هوك المتجر وسجلات الدالة

- **ربط الويب هوك:** في متجر سلة (أو منصتك) تأكد أن عنوان الويب هوك يشير إلى دالة Supabase:  
  `https://<PROJECT_REF>.supabase.co/functions/v1/store-subscription-webhook`  
  وأن رأس `x-webhook-secret` (إن وُجد في الإعدادات) يطابق المتغير `WEBHOOK_STORE_SECRET` في Supabase → Edge Functions → store-subscription-webhook → Settings.

- **سجلات الدالة:** في Supabase → **Edge Functions** → `store-subscription-webhook` → **Logs**.  
  ابحث عن طلب بعد وقت شرائك. إن ظهر خطأ مثل:
  - `No user found with this email or phone` → المستخدم لم يُربط (رقم الجوال أو البريد غير موجود أو غير مطابق).
  - `No customer email or phone in webhook` → الطلب وصل بدون بريد أو جوال.
  - رسالة خطأ من قاعدة البيانات → تحقق من وجود جدول `subscriptions` وسياسات RLS وصولاً لـ service_role.

---

## 3) إضافة الاشتراك يدوياً (حل فوري)

استخدم السكربت **`scripts/add-subscription-by-phone.sql`** في Supabase → SQL Editor:

1. **الخطوة 1 في السكربت:** استبدل `'0512345678'` برقم الجوال الذي اشتريت به، ثم شغّل الاستعلام. انسخ قيمة **user_id** من النتيجة (UUID).
2. **الخطوة 2 في السكربت:** في أحد أسطر الـ INSERT (السنوي أو النصف سنوي) استبدل `YOUR_USER_UUID` بـ **user_id** الذي نسخته، احذف الشرطات `--` من بداية السطر لتشغيل الـ INSERT، ثم شغّل الاستعلام.

بعد التشغيل، اطلب من المستخدم فتح صفحة الاشتراك في التطبيق والضغط على «تحقق من اشتراكي» أو إعادة فتح التطبيق.
