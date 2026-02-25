# إعداد مساعد الذكاء الاصطناعي

يساعد المساعد المعلم على تحرير نصوص **الرؤية والرسالة** (صفحة البيانات الأساسية) ونصوص **خطة التطوير الفردية (IDP)** (الأهداف 70-20-10 والأهداف التطورية بحسب الأولوية).

## التحقق من اسم الدالة (يجب أن يكون متطابقاً في كل مكان)

| المكان | الاسم المستخدم |
|--------|----------------|
| **مجلد الدالة** | `supabase/functions/ai-assistant/` (المجلد اسمه `ai-assistant`) |
| **ملف الدالة** | `supabase/functions/ai-assistant/index.ts` |
| **الكود (التطبيق)** | `services/AIAssistantService.ts` يستدعي `'ai-assistant'` |
| **أمر النشر** | `npx supabase functions deploy ai-assistant --no-verify-jwt` |
| **لوحة Supabase** | Edge Functions → الدالة تظهر باسم **ai-assistant** |

**مهم:** الاسم بحرف صغير مع شرطة: `ai-assistant` وليس `ai_assistant` أو `AiAssistant`.

### اختبار الدالة من لوحة Supabase (Invoke)

من **Edge Functions** → **ai-assistant** → **Invoke** استخدم في حقل الـ body هذا الـ JSON بالضبط:

```json
{
  "type": "vision",
  "currentText": ""
}
```

يمكنك تغيير `type` إلى أي قيمة من القائمة: `vision`, `mission`, `idp_objective_70`, `idp_objective_20`, `idp_objective_10`, `idp_priority_objective`, `idp_priority_activities`, `idp_priority_procedures`, `idp_priority_success`. إذا أرسلت body فارغ أو بدون مفتاح `type` صحيح ستحصل على 400 Invalid type.

## المتطلبات

- مشروع Supabase مع تفعيل Edge Functions.
- مفتاح API من OpenAI ([platform.openai.com](https://platform.openai.com/api-keys)).

## الخطوات

### 1. نشر الدالة على Supabase

من مجلد المشروع. **مهم:** استخدم `--no-verify-jwt` حتى يعمل المساعد دون اشتراط تسجيل الدخول:

```bash
npx supabase functions deploy ai-assistant --no-verify-jwt
```

(إن نُشرت الدالة سابقاً بدون هذا الخيار، أعد النشر بالأمر أعلاه.)

### 2. ضبط مفتاح OpenAI في Supabase

في لوحة Supabase: **Project Settings → Edge Functions → Secrets**، أضف:

| الاسم             | القيمة            |
|------------------|-------------------|
| `OPENAI_API_KEY` | مفتاحك من OpenAI  |

أو من الطرفية:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-...
```

### 3. التأكد من أن التطبيق متصل بمشروع Supabase

تأكد من وجود `EXPO_PUBLIC_SUPABASE_URL` و `EXPO_PUBLIC_SUPABASE_ANON_KEY` في `.env` وأن المستخدم يسجّل الدخول عند استخدام المساعد (الدالة تستخدم مصادقة Supabase).

## أماكن ظهور المساعد

- **البيانات الأساسية:** عند التعديل، يظهر زر "اقتراح بالذكاء الاصطناعي" بجانب حقلي **الرؤية** و**الرسالة**.
- **خطة التطوير الفردية (IDP):** يظهر زر المساعد (أيقونة نجوم) فوق الحقول التالية في الصف الأول فقط:
  - أهداف 70%، 20%، 10%
  - الهدف التطويري، الأنشطة، الإجراءات التفصيلية، معايير النجاح

بعد الضغط يُرسل النص الحالي (إن وُجد) للمساعد، ويُعرض اقتراح في نافذة يمكن **تطبيق الاقتراح** أو **إلغاء**.

---

## لماذا لا يعمل؟ — قائمة تحقق سريعة

| السبب المحتمل | ماذا تفعل |
|----------------|-----------|
| **لم تُعد تشغيل التطبيق بعد تعديل `.env`** | أوقف السيرفر (Ctrl+C) ثم شغّل من جديد: `npm run web` أو `npx expo start` أو `npx expo start --web`. |
| **الدالة غير منشورة أو نُشرت بدون `--no-verify-jwt`** | نفّذ: `npx supabase functions deploy ai-assistant --no-verify-jwt` من جذر المشروع. |
| **مفتاح OpenAI غير مضبوط في Supabase** | Project Settings → Edge Functions → **Secrets** → أضف `OPENAI_API_KEY` وقيمته مفتاحك من [platform.openai.com/api-keys](https://platform.openai.com/api-keys). |
| **الزر لا يظهر** | في **البيانات الأساسية** الزر يظهر فقط في **وضع التعديل** — اضغط "تعديل" (أيقونة القلم) أولاً. |
| **مشروع مختلف** | تأكد أن `EXPO_PUBLIC_SUPABASE_URL` في `.env` يطابق **نفس المشروع** الذي نشرت عليه دالة `ai-assistant`. |

---

## المساعد لا يعمل في التطبيق — تحقق من التالي

1. **في البيانات الأساسية:** الزر يظهر فقط في **وضع التعديل**. اضغط أولاً على **تعديل** (أيقونة القلم) ثم ابحث عن زر «اقتراح بالذكاء الاصطناعي» بجانب الرؤية أو الرسالة.

2. **ملف `.env` في جذر المشروع** يجب أن يحتوي على:
   - `EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co` (رابط مشروعك)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...` (المفتاح العام من Supabase)
   إذا كان أحدهما ناقصاً أو خاطئاً، يظهر تنبيه مثل «الاتصال بـ Supabase غير مضبوط».

3. **نشر الدالة بالأمر الصحيح:**
   ```bash
   npx supabase functions deploy ai-assistant --no-verify-jwt
   ```

4. **مفتاح OpenAI في Supabase:** من **Project Settings** → **Edge Functions** → **Secrets** يجب وجود **`OPENAI_API_KEY`** وقيمته مفتاحك من [platform.openai.com/api-keys](https://platform.openai.com/api-keys). إن لم يكن مضبوطاً ستظهر رسالة مثل «OpenAI request failed» أو «لم يتم استلام اقتراح».

5. **بعد أي تعديل على `.env` أو Secrets:** أعد تشغيل التطبيق (أو أعد تحميل الصفحة على الويب).

---

## إذا ظهر خطأ "تعذر الاتصال بدالة المساعد"

1. **نشر الدالة مع تعطيل التحقق من JWT** (غالباً هذا سبب الخطأ):
   ```bash
   npx supabase functions deploy ai-assistant --no-verify-jwt
   ```
   بدون `--no-verify-jwt` قد يرفض Supabase الطلب إذا كان التحقق من JWT مفعّلاً.

2. **تأكد من ملف `.env`**  
   قيم حقيقية لمشروعك:
   - `EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...`

3. **تأكد من نشر الدالة على نفس المشروع** الذي يستخدمه التطبيق (نفس الرابط في `.env`).

4. **على الويب:** بعد تغيير `.env` أعد تشغيل سيرفر التطبيق (`npm run web` أو `npx expo start --web`).

5. **للتحقق:** في Supabase: **Edge Functions** → **ai-assistant** → **Logs**. اضغط زر المساعد في التطبيق ثم راجع السجلات — إن ظهر الطلب فالمشكلة من الدالة نفسها (مثلاً `OPENAI_API_KEY`)؛ وإن لم يظهر فالمشكلة من الاتصال أو من إعدادات الدالة (JWT).

---

## إذا ظهر خطأ 502 "OpenAI request failed"

1. **تأكد من مفتاح OpenAI في Supabase**
   - **Project Settings** → **Edge Functions** → **Secrets**
   - يجب وجود Secret باسم **`OPENAI_API_KEY`** وقيمته مفتاحك من [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (يبدأ عادةً بـ `sk-...`).

2. **تأكد من صلاحية المفتاح والحساب**
   - المفتاح قد يكون منتهي الصلاحية أو محذوفاً أو الحساب غير مفعّل للاستخدام.
   - من [platform.openai.com](https://platform.openai.com) تحقق من الاشتراك والرصيد وعدم تعطيل الـ API.

3. **بعد تعديل الـ Secrets** أعد تشغيل الدالة (أو انتظر قليلاً) ثم جرّب مرة أخرى؛ أحياناً تحتاج الدالة إلى إعادة تشغيل لقراءة المفتاح الجديد.
