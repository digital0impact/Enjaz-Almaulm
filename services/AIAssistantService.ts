import { supabase, isSupabaseConfigured } from '@/config/supabase';

export type AISuggestType =
  | 'vision'
  | 'mission'
  | 'idp_objective_70'
  | 'idp_objective_20'
  | 'idp_objective_10'
  | 'idp_priority_objective'
  | 'idp_priority_activities'
  | 'idp_priority_procedures'
  | 'idp_priority_success';

export interface AISuggestResult {
  text: string;
}

/**
 * طلب اقتراح نص من مساعد الذكاء الاصطناعي (عبر Supabase Edge Function).
 * يتطلب تفعيل الدالة ai-assistant وضبط OPENAI_API_KEY في Supabase.
 */
export async function suggestWithAI(
  type: AISuggestType,
  currentText?: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'الاتصال بـ Supabase غير مضبوط. أضف EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY في ملف .env ثم أعد تشغيل التطبيق.'
    );
  }

  const typeStr = String(type ?? '').trim();
  if (!typeStr) {
    throw new Error('نوع الاقتراح غير محدد');
  }

  const { data, error } = await supabase.functions.invoke<AISuggestResult>(
    'ai-assistant',
    {
      body: { type: typeStr, currentText: currentText ?? '' },
    }
  );

  if (error) {
    const msg = error.message || '';
    const errWithBody = error as { context?: { body?: { message?: string; error?: string } }; status?: number };
    const status = errWithBody?.status;
    const bodyMsg = errWithBody?.context?.body?.message ?? errWithBody?.context?.body?.error;

    if (status === 503 || (bodyMsg && /OPENAI_API_KEY|not configured/i.test(String(bodyMsg)))) {
      throw new Error(
        'لم يتم ضبط مفتاح OpenAI. في لوحة Supabase: Project Settings → Edge Functions → Secrets أضف OPENAI_API_KEY ثم أعد نشر الدالة أو انتظر دقيقة وحاول مرة أخرى.'
      );
    }
    if (msg.includes('Failed to send') || msg.includes('Edge Function')) {
      throw new Error(
        'تعذر الاتصال بدالة المساعد. تأكد من: 1) نشر الدالة ai-assistant على Supabase (npx supabase functions deploy ai-assistant --no-verify-jwt)، 2) ضبط رابط ومفتاح Supabase في .env (EXPO_PUBLIC_SUPABASE_URL و EXPO_PUBLIC_SUPABASE_ANON_KEY)، 3) إعادة تشغيل التطبيق بعد تعديل .env، 4) أن التطبيق يستخدم نفس مشروع Supabase الذي نُشرت عليه الدالة، 5) الاتصال بالإنترنت.'
      );
    }
    if (bodyMsg) {
      throw new Error(String(bodyMsg));
    }
    throw new Error(msg || 'فشل الاتصال بمساعد الذكاء الاصطناعي');
  }
  if (!data?.text) {
    const errPayload = data as { error?: string; message?: string } | undefined;
    const errMsg = errPayload?.error ?? errPayload?.message;
    if (errMsg) {
      throw new Error(String(errMsg));
    }
    throw new Error('لم يتم استلام اقتراح من المساعد. تحقق من ضبط OPENAI_API_KEY في Supabase → Edge Functions → Secrets.');
  }
  return data.text;
}
