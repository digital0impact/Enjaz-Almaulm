import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * جذر HTML لنسخة الويب فقط.
 * يُستخدم لربط manifest التطبيق التقدمي (PWA) حتى يمكن تثبيت التطبيق على سطح المكتب أو الشاشة الرئيسية بأيقونة.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0d9488" />
        <meta name="description" content="تطبيق إنجاز المعلم للتطوير المهني والأداء" />

        {/* PWA: يسمح بتثبيت التطبيق على سطح المكتب/الرئيسية بأيقونة */}
        <link rel="manifest" href="/manifest.json" />
        {/* أيقونة Safari/iOS: 180x180 بخلفية بيضاء صلبة (مطلوبة لظهور صحيح) */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/logo192.png" sizes="192x192" />
        <meta name="apple-mobile-web-app-title" content="إنجاز المعلم" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
