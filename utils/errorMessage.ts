/**
 * استخراج رسالة خطأ قابلة للعرض من قيمة خطأ غير معروفة الشكل (unknown).
 * يوحّد النمط المكرر `error instanceof Error ? error.message : 'خطأ غير معروف'`
 * الموجود في عدة خدمات وشاشات عبر التطبيق.
 */
export function getErrorMessage(
  error: unknown,
  fallback: string = 'خطأ غير معروف'
): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) {
      return message;
    }
  }
  return fallback;
}
