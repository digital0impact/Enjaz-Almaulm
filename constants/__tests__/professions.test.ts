import {
  PROFESSIONS,
  PROFESSIONS_WITH_OBJECTIVES,
  DEFAULT_PROFESSION,
} from '../professions';

describe('PROFESSIONS', () => {
  it('matches the exact list/order previously hardcoded in basicData.tsx', () => {
    expect(PROFESSIONS).toEqual([
      'معلم/ة',
      'محضر المختبر',
      'معلم/ة مسند له نشاط طلابي',
      'معلم/ة مسند له توجيه صحي',
      'الموجه/ه الطلابي',
      'وكيل/ة المدرسة',
      'مدير/ة المدرسة',
      'التشكيلات الإشرافية المشتركة',
      'التشكيلات الإشرافية',
    ]);
  });

  it('has no duplicate entries', () => {
    expect(new Set(PROFESSIONS).size).toBe(PROFESSIONS.length);
  });

  it('includes the default profession', () => {
    expect(PROFESSIONS).toContain(DEFAULT_PROFESSION);
  });
});

describe('PROFESSIONS_WITH_OBJECTIVES', () => {
  it('is a subset of PROFESSIONS', () => {
    for (const profession of PROFESSIONS_WITH_OBJECTIVES) {
      expect(PROFESSIONS).toContain(profession);
    }
  });

  it('matches the set previously hardcoded in performance.tsx', () => {
    expect(PROFESSIONS_WITH_OBJECTIVES).toEqual([
      'التشكيلات الإشرافية المشتركة',
      'التشكيلات الإشرافية',
    ]);
  });
});
