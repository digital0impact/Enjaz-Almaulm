 # ربط متجر سلة بتفعيل الاشتراك تلقائياً

عند إتمام الشراء من متجرك على سلة، يمكن تفعيل الاشتراك في تطبيق إنجاز المعلم **تلقائياً** بإرسال ويب هوك من سلة إلى الدالة على Supabase.

---

## 1. نشر الدالة على مشروعك في Supabase

مشروعك الحالي (من ملف `.env`): **jwdyslxetmqxebeujphn**

### الطريقة أ: من لوحة Supabase

1. ادخل إلى [Supabase Dashboard](https://supabase.com/dashboard) واختر مشروع **إنجاز المعلم**.
2. من القائمة الجانبية: **Edge Functions** → **Create a new function**.
3. الاسم: `store-subscription-webhook`.
4. انسخ محتوى الملف `supabase/functions/store-subscription-webhook/index.ts` من المشروع والصقه في المحرر، ثم انشر الدالة (Deploy).

### الطريقة ب: من الطرفية (Supabase CLI)

1. سجّل الدخول أولاً (مرة واحدة): `npx supabase login`
2. من مجلد المشروع:

```bash
npx supabase functions deploy store-subscription-webhook --project-ref jwdyslxetmqxebeujphn
```

إذا ظهر خطأ **"failed to scan line: expected newline"** جرّب:
- `npx supabase functions deploy store-subscription-webhook --project-ref jwdyslxetmqxebeujphn --use-api`
- أو استخدم **الطريقة أ** (لوحة Supabase) ونشر الدالة يدوياً بنسخ الكود من `supabase/functions/store-subscription-webhook/index.ts`.

بعد النشر، رابط الدالة سيكون:

```
https://jwdyslxetmqxebeujphn.supabase.co/functions/v1/store-subscription-webhook
```

---

## 2. إضافة ويب هوك في لوحة تحكم سلة

1. ادخل إلى **لوحة تحكم متجرك في سلة** (تسجيل الدخول كتاجر).
2. اذهب إلى **أدوات المطور** أو **التكاملات** أو **الإعدادات** ثم ابحث عن **Webhooks** أو **الويب هوك**.
3. اضغط **إضافة ويب هوك** (أو Create Webhook).
4. أدخل البيانات التالية:

| الحقل | القيمة |
|--------|--------|
| **رابط الـ URL** | `https://jwdyslxetmqxebeujphn.supabase.co/functions/v1/store-subscription-webhook` |
| **الحدث** | **طلب تم إنشاؤه** (`order.created`) و/أو **تم تحديث حالة الطلب** (`order.status.updated`) |

5. إذا وُجد خيار لإضافة رؤوس (Headers) وضبطت سراً في Supabase (انظر أدناه)، أضف:
   - الاسم: `x-webhook-secret`
   - القيمة: نفس قيمة السر الذي ضبطته في Supabase.

6. احفظ الويب هوك.

---

## 3. (اختياري) ضبط سر للويب هوك

لتفادي استدعاء الدالة من غير سلة:

1. في Supabase: **Project Settings** → **Edge Functions** → **Secrets**.
2. أضف سِراً باسم: `WEBHOOK_STORE_SECRET` وقيمة سرية (مثلاً كلمة مرور طويلة).
3. في إعدادات الويب هوك في سلة، أضف الرأس `x-webhook-secret` بنفس القيمة.

---

## 4. كيف تعمل الدالة مع سلة؟

- عند حدوث الحدث المختار (مثلاً إنشاء طلب أو تحديث حالته)، سلة ترسل طلب `POST` إلى الرابط أعلاه مع بيانات الطلب.
- الدالة تقرأ **بريد العميل** من الطلب وتحدد **الخطة** (سنوي / نصف سنوي) من اسم أو SKU المنتج.
- تبحث عن مستخدم في Supabase Auth **بنفس البريد**.
- إن وُجد المستخدم، تُدرج سجلاً في جدول `subscriptions` فيصبح الاشتراك **مفعّلاً تلقائياً** في التطبيق.

---

## 5. شروط مهمة

- **البريد أو رقم الجوال:** يتم ربط الطلب بالمستخدم في التطبيق عبر **البريد الإلكتروني** أو **رقم الجوال**. إذا تطابق أحدهما (البريد في حساب Supabase، أو رقم الجوال في **البيانات الأساسية** أو الملف الشخصي في التطبيق) مع بيانات العميل في طلب سلة، يُفعّل الاشتراك تلقائياً. **مهم:** أدخل رقم الجوال **نفسه** الذي تستخدمه في متجر سلة في التطبيق من: **الإعدادات → البيانات الأساسية** (أو عند التسجيل) حتى يتم الربط بعد الشراء.
- **أسماء المنتجات:** الدالة تستنتج الخطة من اسم أو SKU المنتج:
  - كلمة "سنوي" (بدون "نصف") → اشتراك سنوي.
  - "نصف" أو "half" → اشتراك نصف سنوي.

إذا كانت أسماء منتجاتك مختلفة، يمكن تعديل الدالة في الملف `supabase/functions/store-subscription-webhook/index.ts` (دالة `getPlanFromSallaItems`).

---

## 6. استكشاف الأخطاء: «اشتريت من سلة ولم يظهر الاشتراك»

- **تأكد من رقم الجوال في التطبيق:** يجب أن يكون نفس الرقم الذي أدخلته في طلب سلة مسجّلاً في التطبيق من **الإعدادات → البيانات الأساسية**. إذا كان الرقم غير موجود أو مختلف (مثلاً 05xx في التطبيق و 9665xx في سلة)، الدالة لا تجد المستخدم.
- **أضف كلا الحدثين في سلة:** اختر **طلب تم إنشاؤه** (`order.created`) **و** **تم تحديث حالة الطلب** (`order.status.updated`) حتى يُفعّل الاشتراك عند اكتمال الطلب.
- **راجع سجلات الدالة:** في Supabase: **Edge Functions** → `store-subscription-webhook` → **Logs**. إذا ظهر خطأ مثل "No user found with this email or phone" فالمشكلة من عدم تطابق البريد/الجوال بين التطبيق وطلب سلة.
- **بعد تعديل كود الدالة:** أعد نشر الدالة (Deploy) من لوحة Supabase أو عبر `npx supabase functions deploy store-subscription-webhook --project-ref jwdyslxetmqxebeujphn`.

---

## 7. اختبار الربط

- بعد إضافة الويب هوك، نفّذ طلب تجريبي من متجر سلة (بريد مسجّل في التطبيق).
- تحقق من ظهور الاشتراك في التطبيق (صفحة الاشتراكات أو من جدول `subscriptions` في Supabase).
- يمكن مراجعة سجلات الدالة من Supabase: **Edge Functions** → `store-subscription-webhook` → **Logs**. عند نجاح الربط تظهر رسالة تحتوي على `success: true`.

---

## الرابط المباشر لمشروعك (للنسخ)

```
https://jwdyslxetmqxebeujphn.supabase.co/functions/v1/store-subscription-webhook
```

استخدم هذا الرابط كما هو في حقل **رابط الـ URL** عند إضافة الويب هوك في سلة.
