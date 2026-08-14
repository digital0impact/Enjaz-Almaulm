import { getPerformanceAxesByProfession } from '../performance-axes';

const PROFESSIONS = [
  'معلم/ة',
  'محضر المختبر',
  'معلم/ة مسند له نشاط طلابي',
  'معلم/ة مسند له توجيه صحي',
  'الموجه/ه الطلابي',
  'وكيل/ة المدرسة',
  'مدير/ة المدرسة',
  'التشكيلات الإشرافية المشتركة',
  'التشكيلات الإشرافية',
] as const;

describe('getPerformanceAxesByProfession', () => {
  it('sums criteria weights to exactly 100 for every profession', () => {
    // Regression guard: the 'معلم/ة' (default) branch previously had a data
    // bug where two criteria ("تهيئة البيئة التعليمية" و"الإدارة الصفية")
    // carried weight 10 instead of 5, making its total 110 instead of 100
    // like every other profession. Fixed with explicit product sign-off
    // (originally in data/performanceCriteria.ts, reapplied here after PR
    // #1 independently extracted the same data into this file). This test
    // locks in the invariant so it can't silently regress.
    for (const profession of PROFESSIONS) {
      const totalWeight = getPerformanceAxesByProfession(profession).reduce(
        (sum, axis) => sum + axis.weight,
        0
      );
      expect(totalWeight).toBe(100);
    }
  });

  it('has a non-empty axis list for every profession', () => {
    for (const profession of PROFESSIONS) {
      const axes = getPerformanceAxesByProfession(profession);
      expect(Array.isArray(axes)).toBe(true);
      expect(axes.length).toBeGreaterThan(0);
    }
  });

  it('falls back to the default profession for an unrecognized value', () => {
    expect(getPerformanceAxesByProfession('مهنة غير موجودة')).toEqual(
      getPerformanceAxesByProfession('معلم/ة')
    );
  });
});
