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
    if (msg.includes('Failed to send') || msg.includes('Edge Function')) {
      throw new Error(
        'تعذر الاتصال بدالة المساعد. تأكد من: 1) نشر الدالة ai-assistant على Supabase، 2) ضبط رابط ومفتاح Supabase في .env، 3) الاتصال بالإنترنت.'
      );
    }
    throw new Error(msg || 'فشل الاتصال بمساعد الذكاء الاصطناعي');
  }
  if (!data?.text) {
    throw new Error('لم يتم استلام اقتراح من المساعد');
  }
  return data.text;
}
