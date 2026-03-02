/**
 * عند العودة للتطبيق (من تبويب آخر أو من PWA) يُطلق حدث 'app-focus-refresh'
 * الشاشات التي تحتاج تحديث البيانات تستمع له وتستدعي دالة التحديث
 */
export const APP_FOCUS_REFRESH_EVENT = 'app-focus-refresh';

export function setupAppFocusRefresh(): () => void {
  if (typeof document === 'undefined') return () => {};

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      window.dispatchEvent(new CustomEvent(APP_FOCUS_REFRESH_EVENT));
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  return () => document.removeEventListener('visibilitychange', onVisibilityChange);
}
