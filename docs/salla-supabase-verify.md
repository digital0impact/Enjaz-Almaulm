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

## 2) كيف أتأكد من تشغيل الدالة store-subscription-webhook؟

### أ) التأكد من نشر الدالة

1. ادخل إلى [Supabase Dashboard](https://supabase.com/dashboard) واختر مشروعك.
2. من القائمة الجانبية: **Edge Functions**.
3. تأكد من ظهور **store-subscription-webhook** في القائمة وبدون علامة خطأ.
4. إذا لم تكن الدالة منشورة، يمكنك بأحد الطريقتين:
   - **من الطرفية (بدون تثبيت CLI عالمي):** افتح الطرفية من مجلد المشروع ونفّذ:
     ```bash
     npx supabase functions deploy store-subscription-webhook
     ```
     (يحتاج Node.js؛ أول مرة قد يحمّل الحزمة. إن طُلب منك ربط المشروع: `npx supabase link` ثم اختر المشروع وأدخل كلمة مرور قاعدة البيانات.)
   - **من لوحة Supabase (بدون CLI):** **Edge Functions** → **Create a new function** → اسم الدالة `store-subscription-webhook`، ثم انسخ الكود من الملف `supabase/functions/store-subscription-webhook/index.ts` في المشروع.

### ب) اختبار الدالة بطلب يدوي

استدعِ الدالة من الطرفية (استبدل `YOUR_PROJECT_REF` واختيارياً `YOUR_SECRET` وبريداً مسجّلاً في التطبيق).

**في PowerShell (Windows):**
```powershell
$body = '{"email": "بريد@مسجل.في.التطبيق", "plan": "yearly", "transaction_id": "test-1"}'
Invoke-RestMethod -Uri "https://YOUR_PROJECT_REF.supabase.co/functions/v1/store-subscription-webhook" -Method POST -ContentType "application/json" -Body $body
```
إذا استخدمت سر الويب هوك أضف: `-Headers @{"x-webhook-secret"="YOUR_SECRET"}`

**في Bash / CMD (أو Git Bash على Windows):**
```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/store-subscription-webhook" -H "Content-Type: application/json" -d "{\"email\": \"بريد@مسجل.في.التطبيق\", \"plan\": \"yearly\", \"transaction_id\": \"test-1\"}"
```

- **إذا الدالة تعمل:** ستستلم استجابة **200** وجسد مثل:  
  `{"success":true,"user_id":"...","plan":"yearly","end_date":"..."}`  
  وفي جدول **subscriptions** يظهر سجل جديد لهذا المستخدم (يمكنك حذفه لاحقاً إن كان للاختبار فقط).
- **إذا 401:** الدالة تتحقق من السر. راجع قسم **«أين أضبط x-webhook-secret؟»** أدناه.
- **إذا 404 مع "No user found":** الدالة لم تجد مستخدماً يطابق البريد أو الجوال. لرؤية رسالة الدالة في PowerShell (تعمل في الإصدار 5.1 و 7):
  ```powershell
  $body = '{"email": "بريدك@example.com", "plan": "yearly", "transaction_id": "test-1"}'
  try {
    $r = Invoke-WebRequest -Uri "https://YOUR_PROJECT_REF.supabase.co/functions/v1/store-subscription-webhook" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
    $r.Content; $r.StatusCode
  } catch {
    if ($_.Exception.Response) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $reader.ReadToEnd(); $reader.Close()
    }
    $_.ErrorDetails.Message
  }
  ```
  تحقق من القيم المخزّنة: شغّل **`scripts/list-users-for-webhook.sql`** ثم أعد نشر الدالة: `npx supabase functions deploy store-subscription-webhook`.

### ج) مراجعة سجلات الدالة (Logs)

1. في Supabase: **Edge Functions** → **store-subscription-webhook** → تبويب **Logs**.
2. نفّذ الطلب اليدوي أعلاه (أو انتظر طلباً من سلة).
3. في **Logs** يجب أن يظهر سطر لكل استدعاء مع الـ response (مثلاً 200 أو 404 أو 500). من هنا تتأكد أن الدالة **تُستدعى** وتشوف إن كان هناك خطأ أو رسالة مثل "No user found".

**الخلاصة:** الدالة تعمل إذا: (1) تظهر في Edge Functions ومنشورة، (2) طلب يدوي يعيد 200 وربما سجل في **subscriptions**، (3) في Logs يظهر الاستدعاء والاستجابة.

---

## أين أضبط x-webhook-secret؟

**القيمة ليست جاهزة في مكان ما** — أنت تختارها (مثل كلمة مرور: أحرف وأرقام طويلة) ثم تضبطها في موضعين:

### 1) في Supabase (اسم المتغير: WEBHOOK_STORE_SECRET)

1. ادخل [Supabase Dashboard](https://supabase.com/dashboard) → مشروعك.
2. من القائمة: **Project Settings** (أيقونة الترس) → **Edge Functions**.
3. في **Secrets** (أو **Function Secrets**) اضغط **Add new secret**.
4. **Name:** `WEBHOOK_STORE_SECRET`
5. **Value:** أي نص سري تختاره (مثال: `my-salla-webhook-2024-secret`) — احفظه؛ ستستخدمه في الطلبات وفي سلة.
6. احفظ.

(أو من صفحة الدالة نفسها: **Edge Functions** → **store-subscription-webhook** → **Settings** → **Secrets**.)

### 2) عند الاستدعاء (رأس الطلب أو من سلة)

- **في الطلب اليدوي (PowerShell):** استخدم نفس القيمة في الرأس:
  ```powershell
  $headers = @{ "x-webhook-secret" = "نفس_القيمة_التي_ضبطتها_فوق" }
  ```
- **في سلة:** عند إعداد الويب هوك، إذا كانت سلة تسمح بإضافة **Headers** مخصصة، أضف:
  - الاسم: `x-webhook-secret`
  - القيمة: **نفس** قيمة WEBHOOK_STORE_SECRET.

إن لم تضبط أي سر في Supabase، الدالة تقبل الطلبات **بدون** الرأس. للاختبار يمكنك حذف المتغير WEBHOOK_STORE_SECRET من Secrets ثم إعادة الاختبار بدون رأس.

---

## 3) التحقق من جاهزية Supabase (الجداول والبيانات)

شغّل السكربت **`scripts/verify-salla-supabase.sql`** في Supabase → **SQL Editor**.

يعرض السكربت:
- هل الجداول المطلوبة موجودة
- عدد المستخدمين الذين لديهم بريد أو رقم جوال (يمكن ربطهم بالطلب)
- عدد سجلات الاشتراكات الحالية

إذا ظهر أن الجداول غير موجودة، طبّق الهجرات من مجلد **supabase/migrations/** (أو السكربتات من **scripts/**) كما في **docs/supabase-tables-review.md**.

---

## 4) التحقق من رابط ويب هوك سلة

- **رابط الدالة (استبدل `YOUR_PROJECT_REF` بمعرّف مشروعك من Supabase):**
  ```
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/store-subscription-webhook
  ```
- من **لوحة سلة** → الإعدادات / التكاملات → **Webhooks**:
  - تأكد أن الـ URL المضاف = الرابط أعلاه.
  - الحدث المربوط: مثلاً **order.created** أو **order.status.updated** (الدالة تقبل الطلب وتحدد الخطة من المنتج؛ لـ `order.status.updated` تُنشئ الاشتراك عند حالة مكتملة فقط).
- إذا ضبطت **WEBHOOK_STORE_SECRET** في Supabase، تأكد أن سلة ترسل نفس القيمة في رأس الطلب (مثلاً **x-webhook-secret** أو **Authorization: Bearer SECRET** حسب ما تدعمه سلة).

---

## 5) اختبار استدعاء الدالة يدوياً (تفصيل)

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

## 6) التحقق من سجلات الدالة بعد طلب حقيقي من سلة

1. نفّذ طلب شراء تجريبي من متجر سلة (بريد أو جوال مطابق لمسجّل في التطبيق).
2. من Supabase → **Edge Functions** → **store-subscription-webhook** → **Logs**.
3. ابحث عن الطلب في التوقيت المناسب:
   - إن ظهر **200** ورسالة نجاح → الربط يعمل.
   - إن ظهر **404** و`No user found with this email or phone` → راجع أن البريد/الجوال في الطلب مطابق للمسجّل في التطبيق وجداول **user_profiles** / **users**.
   - إن ظهر **400** أو **500** → راجع نص الخطأ (مثلاً بنية الطلب أو وجود جدول **subscriptions** وسياسات RLS).

---

## 7) ملخص الربط

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
