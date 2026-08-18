import type { ComponentProps } from 'react';
import type { Href } from 'expo-router';
import type { IconSymbol } from '@/components/ui/IconSymbol';

type IconSymbolName = ComponentProps<typeof IconSymbol>['name'];

export interface ToolMenuItem {
  icon: IconSymbolName;
  title: string;
  description: string;
  /** مسار expo-router (نفس القيم المستخدمة سابقًا كنصوص مباشرة في router.push). */
  route: Href;
}

/** بطاقات الأدوات في الشاشة الرئيسية (app/(tabs)/index.tsx). */
export const HOME_TOOLS: ToolMenuItem[] = [
  {
    icon: 'doc.text.fill',
    title: 'أذكاري',
    description: 'مجموعة من الأذكار اليومية المفيدة',
    route: '/azkar',
  },
  {
    icon: 'calendar',
    title: 'الجدول',
    description: 'إدارة الجدول الدراسي والحصص',
    route: '/schedule',
  },
  {
    icon: 'person.crop.circle.badge.plus',
    title: 'تتبع حالة المتعلمين',
    description: 'متابعة وتقييم حالة الطلاب',
    route: '/student-tracking',
  },
  {
    icon: 'list.bullet',
    title: 'خطة التطوير الفردية (IDP)',
    description: 'نموذج خطة التطوير الفردية ومجالات التطوير المهني 70-20-10',
    route: '/idp',
  },
  {
    icon: 'doc.badge.plus',
    title: 'منشئ التقارير',
    description: 'إنشاء تقرير تنفيذ برامج النشاط الصفي وتصديره',
    route: '/report-builder',
  },
  {
    icon: 'chart.bar.fill',
    title: 'تحليل النتائج',
    description: 'إدخال درجات الطلاب يدوياً أو من ملف وتحليلها في تقرير واحد',
    route: '/results-analysis',
  },
  {
    icon: 'graduationcap.fill',
    title: 'تحليل أنماط تعلم الطلاب',
    description: 'إنشاء رابط استبيان VARK ومشاركته مع الطلاب، وعرض النتائج مجمّعة حسب الصف',
    route: '/learning-styles',
  },
];

/** بطاقات الأدوات في شاشة الأدوات المساعدة (app/(tabs)/explore.tsx). */
export const EXPLORE_TOOLS: ToolMenuItem[] = [
  {
    icon: 'calendar.badge.plus',
    title: 'الإجازات الرسمية',
    description: 'جدول الإجازات والعطل الرسمية',
    route: '/official-holidays',
  },
  {
    icon: 'calendar',
    title: 'التقويم الهجري والميلادي',
    description: 'عرض التقويم بالتاريخين الهجري والميلادي',
    route: '/calendar',
  },
  {
    icon: 'lock.shield.fill',
    title: 'متتبع المواقع وكلمات المرور',
    description: 'إدارة كلمات المرور والمواقع المهمة',
    route: '/password-tracker',
  },
  {
    icon: 'calendar.badge.exclamationmark',
    title: 'إدارة غيابي',
    description: 'تسجيل ومتابعة أيام الغياب الشخصية',
    route: '/absence-management',
  },
  {
    icon: 'bell.fill',
    title: 'التنبيهات المهمة',
    description: 'إنشاء وإدارة التنبيهات والتذكيرات',
    route: '/alerts-management',
  },
];
