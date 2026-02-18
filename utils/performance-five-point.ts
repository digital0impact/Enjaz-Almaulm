/**
 * النموذج الخماسي لتقدير الأداء الوظيفي
 * مستويات التقدير العام للأداء (حسب الصورة المرجعية):
 * - 90-100%  → درجة التقدير 5
 * - 80-89%   → درجة التقدير 4
 * - 70-79%   → درجة التقدير 3
 * - 60-69%   → درجة التقدير 2
 * - أقل من 60% → درجة التقدير 1
 *
 * طريقة حساب المعدل: النسبة = (درجة التقدير × الوزن) ÷ 5
 * المعدل العام = مجموع (درجة التقدير × الوزن) ÷ 5 (مع أن الأوزان مجموعها 100%)
 */

export const FIVE_POINT_RANGES = [
  { min: 90, max: 100, grade: 5 },
  { min: 80, max: 89, grade: 4 },
  { min: 70, max: 79, grade: 3 },
  { min: 60, max: 69, grade: 2 },
  { min: 0, max: 59, grade: 1 },
] as const;

/**
 * تحويل النسبة المئوية (0-100) إلى درجة التقدير (1-5) حسب مستويات التقدير العام للأداء
 */
export function scoreToGrade(scorePercent: number): number {
  const score = Math.max(0, Math.min(100, scorePercent));
  const range = FIVE_POINT_RANGES.find(r => score >= r.min && score <= r.max);
  return range ? range.grade : 1;
}

export interface PerformanceItemForAverage {
  score: number;
  weight: number;
}

/**
 * حساب المعدل العام للأداء وفق النموذج الخماسي
 * المعادلة: المعدل = مجموع(درجة التقدير × الوزن) ÷ 5
 * (الأوزان مفترض أن مجموعها 100%)
 */
export function calculateOverallAverageFivePoint(
  items: PerformanceItemForAverage[]
): number {
  if (!items?.length) return 0;
  const sumGradeWeight = items.reduce(
    (acc, item) => acc + scoreToGrade(item.score ?? 0) * (item.weight ?? 0),
    0
  );
  return Math.round(sumGradeWeight / 5);
}
