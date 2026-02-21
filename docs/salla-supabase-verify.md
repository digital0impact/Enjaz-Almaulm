# التحقق من ربط متجر سلة بجداول Supabase

دليل خطوة بخطوة للتحقق من أن متجرك في سلة مربوط بشكل صحيح بدالة **store-subscription-webhook** وجداول Supabase.

---

## 1) قائمة تحقق سريعة

| الخطوة | أين | ماذا تتأكد |
|--------|-----|-------------|
| 1 | Supabase | وجود جدول **subscriptions** (Table Editor) |
| 2 | Supabase | وجود جدولَي **user_profiles** و **users** مع عمود **phone_number** |
| 3 | Supabase | تشغيل الدالة **store-subscription-webhook** (Edge Functions) ووجودها بدون أخطاء |
| 4 | سلة | إضافة **Webhook** يشير إلى رابط الدالة مع الحدث المناسب (مثلاً تحديث حالة الطلب) |
| 5 | سلة + Supabase | إذا استخدمت سراً: قيمة **x-webhook-secret** في سلة = **WEBHOOK_STORE_SECRET** في Supabase |
| 6 | التطبيق | أن المستخدمين يسجّلون **نفس البريد أو رقم الجوال** في التطبيق (البيانات الأساسية) كما في طلب سلة |

---

## 2) التحقق من جاهزية Supabase (الجداول والبيانات)

شغّل السكربت **`scripts/verify-salla-supabase.sql`** في Supabase → **SQL Editor**.

يعرض السكربت:
- هل الجداول المطلوبة موجودة
- عدد المستخدمين الذين لديهم بريد أو رقم جوال (يمكن ربطهم بالطلب)
- عدد سجلات الاشتراكات الحالية

إذا ظهر أن الجداول غير موجودة، طبّق الهجرات من مجلد **supabase/migrations/** (أو السكربتات من **scripts/**) كما في **docs/supabase-tables-review.md**.

---

## 3) التحقق من رابط ويب هوك سلة

- **رابط الدالة (استبدل `YOUR_PROJECT_REF` بمعرّف مشروعك من Supabase):**
  ```
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/store-subscription-webhook
  ```
- من **لوحة سلة** → الإعدادات / التكاملات → **Webhooks**:
  - تأكد أن الـ URL المضاف = الرابط أعلاه.
  - الحدث المربوط: مثلاً **order.created** أو **order.status.updated** (الدالة تقبل الطلب وتحدد الخطة من المنتج؛ لـ `order.status.updated` تُنشئ الاشتراك عند حالة مكتملة فقط).
- إذا ضبطت **WEBHOOK_STORE_SECRET** في Supabase، تأكد أن سلة ترسل نفس القيمة في رأس الطلب (مثلاً **x-webhook-secret** أو **Authorization: Bearer SECRET** حسب ما تدعمه سلة).

---

## 4) اختبار استدعاء الدالة يدوياً

يمكنك التأكد أن الدالة تعمل وتربط المستخدم وتُدخل في **subscriptions** بطلب تجريبي.

### أ) اختبار بالبريد والخطة (استدعاء مباشر)

استبدل القيم ثم نفّذ من الطرفية (أو Postman):

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/store-subscription-webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d "{\"email\": \"بريد@مستخدم.مسجل.في.التطبيق\", \"plan\": \"yearly\", \"transaction_id\": \"test-verify-1\"}"
```

- إذا كان الربط سليماً: استجابة **200** وجسد مثل `{"success":true,"user_id":"...","plan":"yearly",...}`.
- ثم من Supabase → **Table Editor** → جدول **subscriptions** تأكد من ظهور سجل جديد لنفس **user_id** (يمكن حذف السجل لاحقاً إن كان للاختبار فقط).

إذا ظهر **404** مع `No user found with this email or phone` فالمستخدم غير موجود أو البريد غير مطابق؛ تأكد من وجود مستخدم بنفس البريد في **Authentication** أو في **user_profiles** / **users** مع رقم جوال مطابق.

### ب) اختبار برقم الجوال (إن دعمته سلة أو للاستدعاء المباشر)

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/store-subscription-webhook" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d "{\"email\": \"\", \"phone\": \"0512345678\", \"plan\": \"half_yearly\", \"transaction_id\": \"test-verify-2\"}"
```

- يجب أن يكون رقم الجوال **مسجّلاً** في التطبيق (البيانات الأساسية) وفي أحد الجدولين **user_profiles** أو **users** حتى تجد الدالة المستخدم وتُدخل الاشتراك.

**ملاحظة:** إذا لم تضبط **WEBHOOK_STORE_SECRET** في Supabase يمكنك حذف السطر `-H "x-webhook-secret: ..."` من الأمر.

---

## 5) التحقق من سجلات الدالة بعد طلب حقيقي من سلة

1. نفّذ طلب شراء تجريبي من متجر سلة (بريد أو جوال مطابق لمسجّل في التطبيق).
2. من Supabase → **Edge Functions** → **store-subscription-webhook** → **Logs**.
3. ابحث عن الطلب في التوقيت المناسب:
   - إن ظهر **200** ورسالة نجاح → الربط يعمل.
   - إن ظهر **404** و`No user found with this email or phone` → راجع أن البريد/الجوال في الطلب مطابق للمسجّل في التطبيق وجداول **user_profiles** / **users**.
   - إن ظهر **400** أو **500** → راجع نص الخطأ (مثلاً بنية الطلب أو وجود جدول **subscriptions** وسياسات RLS).

---

## 6) ملخص الربط

```
[متجر سلة]  --ويب هوك (طلب مكتمل)-->  [store-subscription-webhook]
                                                    |
                                                    v
                    [البحث عن المستخدم: auth.users / user_profiles / users]
                    (بالبريد أو رقم الجوال من الطلب)
                                                    |
                                                    v
                    [إدراج سجل في جدول subscriptions]
                    (user_id, plan_type, start_date, end_date, status, ...)
                                                    |
                                                    v
                    [التطبيق يقرأ الاشتراك من subscriptions ويعرضه]
```

- **سلة** ترسل الطلب إلى **الدالة**.
- **الدالة** تربط الطلب بمستخدم Supabase (بريد أو جوال) ثم تُدخل في **subscriptions**.
- **التطبيق** يعرض الاشتراك من جدول **subscriptions** فقط (لا من **user_profiles**).

إذا نفذت الخطوات أعلاه وتحققت من السجلات والاختبار اليدوي، تكون قد تحققت من ربط متجر سلة بجداول Supabase.
