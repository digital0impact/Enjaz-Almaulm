# نشر دالة salla-webhook فقط (من جذر المشروع)
# شغّل: .\deploy-salla-webhook.ps1
Set-Location $PSScriptRoot
npx supabase functions deploy salla-webhook --project-ref jwdyslxetmqxebeujphn --no-verify-jwt
