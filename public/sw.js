// Service worker بسيط لتطبيق إنجاز المعلم (PWA).
// الهدف: استيفاء شروط قابلية التثبيت في Chrome/أندرويد (يتطلب service worker
// مسجّل مع معالج fetch)، مع دعم أساسي للعمل دون اتصال لملفات التطبيق الثابتة.
//
// استراتيجية "الشبكة أولاً": كل طلب يُحاول عبر الشبكة أولاً (فيبقى المحتوى
// محدّثًا دائمًا عند الاتصال)، ويُخزَّن في الكاش، ولا يُستخدم الكاش إلا عند
// فشل الاتصال (offline). لا نتدخل في الطلبات غير GET أو الطلبات الخارجية
// (مثل Supabase) حتى لا نؤثر على البيانات الحية.

const CACHE_NAME = 'enjaz-almaulm-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
