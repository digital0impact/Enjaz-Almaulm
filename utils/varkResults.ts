import { VarkStyle } from '@/constants/varkQuestions';

/** ملخص نتائج VARK لصف دراسي واحد: عدد الطلاب حسب النمط الغالب */
export interface ClassSummary {
  className: string;
  total: number;
  counts: Record<VarkStyle | 'mixed', number>;
}

export const EMPTY_VARK_COUNTS = (): Record<VarkStyle | 'mixed', number> => ({
  V: 0,
  A: 0,
  R: 0,
  K: 0,
  mixed: 0,
});

/** يحوّل صفوف vark_responses الخام إلى ملخص مجمّع حسب الصف (بلا أسماء طلاب) */
export function summarizeVarkByClass(
  responses: { class_name: string; dominant_style: string }[]
): ClassSummary[] {
  const map = new Map<string, ClassSummary>();
  responses.forEach((r) => {
    const className = r.class_name || 'غير محدد';
    if (!map.has(className)) {
      map.set(className, { className, total: 0, counts: EMPTY_VARK_COUNTS() });
    }
    const entry = map.get(className)!;
    entry.total += 1;
    const style = (r.dominant_style as VarkStyle | 'mixed') || 'mixed';
    entry.counts[style] = (entry.counts[style] || 0) + 1;
  });
  return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className, 'ar'));
}

export function getShareBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  const env = typeof process !== 'undefined' ? process.env : undefined;
  const url = (env?.EXPO_PUBLIC_APP_URL ?? '').trim();
  return url ? url.replace(/\/$/, '') : '';
}
