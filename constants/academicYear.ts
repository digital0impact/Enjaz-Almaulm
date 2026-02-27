/**
 * العام الدراسي: تنسيق وحساب العام الحالي (مثلاً 2024-2025).
 * يُفترض أن العام يبدأ في سبتمبر (الشهر 9).
 */

const ACADEMIC_YEAR_START_MONTH = 9; // سبتمبر

/** مفتاح التخزين للعام الحالي */
export const CURRENT_ACADEMIC_YEAR_KEY = 'currentAcademicYear';

/** المفاتيح التي تُحفظ وتُستعاد لكل عام دراسي (بيانات العمل الحالية) */
export const YEAR_SCOPED_STORAGE_KEYS = [
  'students',
  'performanceData',
  'uploadedFiles',
  'performanceObjectivesData',
  'alerts',
  'absenceRecords',
  'teacherSchedule',
  'improvementPlan',
  'idpForm',
] as const;

export type YearScopedKey = (typeof YEAR_SCOPED_STORAGE_KEYS)[number];

/**
 * حساب العام الدراسي الافتراضي من التاريخ الحالي.
 * مثال: سبتمبر 2024 → "2024_2025"
 */
export function getDefaultAcademicYearKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  if (month >= ACADEMIC_YEAR_START_MONTH) {
    return `${year}_${year + 1}`;
  }
  return `${year - 1}_${year}`;
}

/**
 * تحويل السنة الميلادية إلى سنة هجرية تقريبية (للعرض فقط).
 */
export function gregorianToHijriYear(gregorianYear: number): number {
  const y = gregorianYear - 622;
  return gregorianYear - 622 + Math.ceil(y / 32);
}

/** أرقام عربية للهجري (٠١٢٣٤٥٦٧٨٩) */
const ARABIC_NUMBERS = '٠١٢٣٤٥٦٧٨٩';
function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_NUMBERS[parseInt(d, 10)] ?? d);
}

/**
 * تحويل مفتاح العام إلى نص للعرض مع الميلادي والهجري (مثلاً 2024_2025 → "2024 - 2025 (١٤٤٦ - ١٤٤٧)").
 */
export function formatAcademicYearLabel(yearKey: string): string {
  const [a, b] = yearKey.split('_');
  if (!a || !b) return yearKey;
  const startG = parseInt(a, 10);
  const endG = parseInt(b, 10);
  if (isNaN(startG) || isNaN(endG)) return `${a} - ${b}`;
  const startH = gregorianToHijriYear(startG);
  const endH = gregorianToHijriYear(endG);
  const hijriLabel = `${toArabicDigits(startH)} - ${toArabicDigits(endH)}`;
  return `${a} - ${b} (${hijriLabel})`;
}

/**
 * الحصول على مفتاح العام الدراسي التالي (مثلاً 2024_2025 → 2025_2026).
 */
export function getNextAcademicYearKey(currentKey: string): string {
  const parts = currentKey.split('_');
  if (parts.length >= 2) {
    const endYear = parseInt(parts[1], 10);
    if (!isNaN(endYear)) return `${endYear}_${endYear + 1}`;
  }
  const def = getDefaultAcademicYearKey();
  const [_, end] = def.split('_');
  return `${end}_${parseInt(end, 10) + 1}`;
}
