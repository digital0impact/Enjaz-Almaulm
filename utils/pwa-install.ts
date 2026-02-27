/**
 * مساعد PWA: عرض تلميح "إضافة إلى الشاشة الرئيسية" بعد التسجيل.
 * على Chrome/Edge يُستخدم beforeinstallprompt، وعلى iOS تُعرض تعليمات يدوية.
 */

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
  });
}

/** هل المتصفح يدعم نافذة التثبيت (Chrome/Edge على سطح المكتب أو أندرويد) */
export function canPromptInstall(): boolean {
  return typeof window !== 'undefined' && !!deferredPrompt;
}

/** فتح نافذة تثبيت التطبيق (إضافة أيقونة لسطح المكتب/الشاشة الرئيسية) */
export function promptInstall(): Promise<void> {
  if (typeof window === 'undefined' || !deferredPrompt) return Promise.resolve();
  return deferredPrompt.prompt();
}

/** هل المستخدم على Safari/أجهزة Apple (نعرض له تعليمات إضافة يدوياً) */
export function isIOSWeb(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** هل نعرض تلميح الإضافة (إما نافذة تثبيت أو تعليمات iOS) */
export function shouldShowInstallPrompt(): boolean {
  return typeof window !== 'undefined' && (canPromptInstall() || isIOSWeb());
}
