# إعداد Supabase لنسيان كلمة المرور

إذا ظهر خطأ `{"error":"requested path is invalid"}` عند طلب إعادة تعيين كلمة المرور، تحقق من الإعدادات التالية في لوحة Supabase:

## 1. URL Configuration

اذهب إلى: **Authentication** → **URL Configuration**

### Site URL
يجب أن يكون:
```
https://www.enjaz-almaulm.com
```
⚠️ **مهم:** استخدم `https://` وليس `http://`

### Redirect URLs
أضف السطور التالية (كل سطر في سطر منفصل):
```
https://www.enjaz-almaulm.com/**
https://www.enjaz-almaulm.com/auth/reset-password
enjazalmualm://**
```

اضغط **Save** لحفظ التغييرات.

## 2. قالب البريد (Email Template)

اذهب إلى: **Authentication** → **Email Templates** → **Reset Password**

تأكد أن الرابط في القالب يستخدم `{{ .ConfirmationURL }}` (القيمة الافتراضية):
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

لا تعدّل هذا الرابط يدوياً—Supabase يبني الرابط تلقائياً مع `redirect_to` الصحيح.

## 3. متغير البيئة (اختياري)

في ملف `.env` أو في Vercel → Environment Variables، أضف:
```
EXPO_PUBLIC_APP_URL=https://www.enjaz-almaulm.com
```

## التحقق

بعد تطبيق التغييرات:
1. اطلب "نسيان كلمة المرور" من صفحة تسجيل الدخول
2. افتح البريد واضغط على الرابط
3. يجب أن تُعاد توجيهك إلى `https://www.enjaz-almaulm.com/auth/reset-password` لتعيين كلمة مرور جديدة
