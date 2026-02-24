# نشر دالة مساعد الذكاء الاصطناعي (ai-assistant) على Supabase
# الاسم يجب أن يطابق: مجلد supabase/functions/ai-assistant واستدعاء التطبيق 'ai-assistant'
# شغّل من جذر المشروع: .\deploy-ai-assistant.ps1
Set-Location $PSScriptRoot
npx supabase functions deploy ai-assistant --no-verify-jwt
