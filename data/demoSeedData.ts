/**
 * بيانات واقعية جاهزة لوضع العرض التجريبي (Demo) — معلم افتراضي وطلابه
 * وجدوله الدراسي ومحاور أدائه المهني، بنفس مفاتيح ونماذج AsyncStorage
 * التي تقرأها الشاشات الحقيقية بالضبط (basicData / students /
 * teacherSchedule / performanceData)، حتى تظهر البيانات فورًا دون أي
 * تعديل في تلك الشاشات.
 *
 * ملاحظة نطاق: لا تُحقَن بيانات لشاشات الخطط العلاجية التفصيلية أو
 * اختبارات VARK أو "الشواهد المهنية" (professionalGrowthItems) — هذا
 * الأخير تحديدًا لأن شاشة البيانات الأساسية تحاول مزامنته فعليًا مع جدول
 * professional_growth الحقيقي في Supabase عند التحميل، ما قد يُظهر خطأ
 * مزامنة غير ضروري لزائر العرض التجريبي (محمي بسياسات RLS، لكن تجربة
 * المستخدم فيه أقل أناقة من مجرد تركه فارغًا).
 */
import { getPerformanceAxesByProfession, PerformanceAxis } from '@/constants/performance-axes';
import { DEFAULT_PROFESSION } from '@/constants/professions';

export const DEMO_BASIC_DATA = {
  fullName: 'أ. خالد العتيبي',
  specialty: 'الرياضيات',
  experience: '8 سنوات',
  education: 'بكالوريوس تربية رياضيات',
  school: 'مدرسة الفاروق المتوسطة',
  educationDepartment: 'إدارة تعليم الرياض',
  gradeLevel: 'المرحلة المتوسطة - الصف الأول والثاني',
  vision: 'إعداد جيل متميز قادر على مواجهة تحديات المستقبل',
  mission: 'تقديم تعليم نوعي يركز على بناء الشخصية المتكاملة للطالب',
  email: 'demo@enjaz-almaulm.com',
  phone: '+966500000000',
  socialMedia: '',
  appointmentDate: '2018/09/01',
  rank: 'معلم',
  profession: 'معلم/ة',
  experiences: 'تدريس الرياضيات للمرحلة المتوسطة، تدريب المعلمين الجدد، إعداد المناهج الدراسية',
};

export const DEMO_STUDENTS = [
  {
    id: 'demo-1',
    name: 'عبدالله محمد السالم',
    grade: 'الأول متوسط',
    status: 'تفوق',
    lastUpdate: '2026-08-20',
    notes: 'طالب متفوق ومنضبط، يشارك بفعالية في الحصة.',
    goals: [
      {
        id: 'demo-1-g1',
        title: 'المشاركة في مسابقة الرياضيات',
        description: 'تجهيز الطالب للمشاركة في مسابقة المدرسة السنوية',
        targetDate: '2026-11-01',
        progress: 60,
        status: 'قيد التنفيذ',
      },
    ],
    needs: [],
    performanceEvidence: [],
  },
  {
    id: 'demo-2',
    name: 'سارة أحمد القحطاني',
    grade: 'الأول متوسط',
    status: 'يحتاج إلى تطوير',
    lastUpdate: '2026-08-18',
    notes: 'تحتاج متابعة إضافية في مهارات الضرب والقسمة.',
    goals: [
      {
        id: 'demo-2-g1',
        title: 'إتقان جدول الضرب',
        description: 'حفظ وإتقان جداول الضرب من 1 إلى 12',
        targetDate: '2026-10-15',
        progress: 40,
        status: 'قيد التنفيذ',
      },
    ],
    needs: ['خطة علاجية في الضرب والقسمة'],
    performanceEvidence: [],
  },
  {
    id: 'demo-3',
    name: 'فيصل خالد الدوسري',
    grade: 'الثاني متوسط',
    status: 'صعوبات التعلم',
    lastUpdate: '2026-08-15',
    notes: 'يحتاج دعمًا إضافيًا في القراءة والفهم.',
    goals: [],
    needs: ['خطة علاجية فردية', 'تحويل لأخصائي صعوبات تعلم'],
    performanceEvidence: [],
  },
  {
    id: 'demo-4',
    name: 'نورة سعد المطيري',
    grade: 'الثاني متوسط',
    status: 'تفوق',
    lastUpdate: '2026-08-22',
    notes: 'مستوى متقدم، تُرشَّح لبرنامج الموهوبين.',
    goals: [
      {
        id: 'demo-4-g1',
        title: 'الترشح لبرنامج الموهوبين',
        description: 'استكمال إجراءات الترشح والاختبارات المطلوبة',
        targetDate: '2026-12-01',
        progress: 75,
        status: 'قيد التنفيذ',
      },
    ],
    needs: [],
    performanceEvidence: [],
  },
  {
    id: 'demo-5',
    name: 'ماجد عبدالعزيز الحربي',
    grade: 'الأول متوسط',
    status: 'ضعف',
    lastUpdate: '2026-08-10',
    notes: 'أداء متوسط، بحاجة إلى تحفيز أكبر.',
    goals: [],
    needs: [],
    performanceEvidence: [],
  },
];

/** الجدول الدراسي الأسبوعي — يطابق تمامًا ترتيب tableDays/tableTimeSlots في app/schedule.tsx */
export const DEMO_SCHEDULE = [
  { id: 'demo-s1', day: 'الأحد', time: 'الحصة الأولى', subject: 'رياضيات', class: 'الأول متوسط - أ', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s2', day: 'الأحد', time: 'الحصة الثانية', subject: 'رياضيات', class: 'الأول متوسط - ب', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s3', day: 'الأحد', time: 'الحصة الرابعة', subject: 'انتظار', class: '', type: 'انتظار', color: '#FF9800' },
  { id: 'demo-s4', day: 'الأحد', time: 'الحصة الخامسة', subject: 'رياضيات', class: 'الثاني متوسط - أ', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s5', day: 'الاثنين', time: 'الحصة الأولى', subject: 'رياضيات', class: 'الثاني متوسط - ب', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s6', day: 'الاثنين', time: 'الحصة الثالثة', subject: 'مناوبة', class: '', type: 'مناوبة', color: '#2196F3' },
  { id: 'demo-s7', day: 'الاثنين', time: 'الحصة السادسة', subject: 'رياضيات', class: 'الأول متوسط - أ', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s8', day: 'الثلاثاء', time: 'الحصة الثانية', subject: 'رياضيات', class: 'الأول متوسط - ب', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s9', day: 'الثلاثاء', time: 'الحصة الرابعة', subject: 'رياضيات', class: 'الثاني متوسط - أ', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s10', day: 'الثلاثاء', time: 'الحصة السابعة', subject: 'حصص انتظار', class: '', type: 'حصص انتظار', color: '#9C27B0' },
  { id: 'demo-s11', day: 'الأربعاء', time: 'الحصة الأولى', subject: 'رياضيات', class: 'الثاني متوسط - ب', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s12', day: 'الأربعاء', time: 'الحصة الثالثة', subject: 'رياضيات', class: 'الأول متوسط - أ', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s13', day: 'الأربعاء', time: 'الحصة السادسة', subject: 'فراغ', class: '', type: 'فراغ', color: '#9E9E9E' },
  { id: 'demo-s14', day: 'الخميس', time: 'الحصة الثانية', subject: 'رياضيات', class: 'الأول متوسط - ب', type: 'حصة', color: '#4CAF50' },
  { id: 'demo-s15', day: 'الخميس', time: 'الحصة الخامسة', subject: 'رياضيات', class: 'الثاني متوسط - أ', type: 'حصة', color: '#4CAF50' },
];

/**
 * عدد الشواهد التي تُعتبر "متوفرة" في كل محور (حسب ترتيب المحور 1-11 في
 * القالب الرسمي لمهنة 'معلم/ة')، لإنتاج توزيع نسب واقعي ومتنوع بدل صفر
 * أو 100% موحّدة. الصيغة مطابقة تمامًا لـcalculateScoreBasedOnEvidence في
 * app/(tabs)/performance.tsx: available>=5 → 100%، وإلا round(available/total*100).
 */
const DEMO_AVAILABLE_EVIDENCE_COUNT: Record<number, number> = {
  1: 5, // 6 شواهد → 5 متوفرة → 100%
  2: 3, // 4 شواهد → 75%
  3: 2, // 3 شواهد → 67%
  4: 3, // 4 شواهد → 75%
  5: 4, // 5 شواهد → 80%
  6: 2, // 3 شواهد → 67%
  7: 3, // 5 شواهد → 60%
  8: 1, // شاهد واحد → 100%
  9: 2, // 3 شواهد → 67%
  10: 2, // 4 شواهد → 50%
  11: 3, // 5 شواهد → 60%
};

function calculateScoreBasedOnEvidence(evidence: { available: boolean }[]): number {
  if (!evidence || evidence.length === 0) return 0;
  const availableCount = evidence.filter((e) => e.available).length;
  if (availableCount >= 5) return 100;
  return Math.round((availableCount / evidence.length) * 100);
}

/**
 * محاور الأداء المهني لمعلم/ة (المهنة الافتراضية) مبنية من نفس القالب
 * الرسمي المستخدم في شاشة الأداء المهني الفعلية (constants/performance-axes.ts)
 * حتى تُقبَل كبيانات "مطابقة للقالب الحالي" دون أن تستبدلها الشاشة عند
 * التحميل (تتحقق من تطابق عناوين المحاور بالضبط قبل قبول البيانات المحفوظة).
 */
function buildDemoPerformanceData(): PerformanceAxis[] {
  return getPerformanceAxesByProfession(DEFAULT_PROFESSION).map((axis) => {
    const availableCount = DEMO_AVAILABLE_EVIDENCE_COUNT[axis.id] ?? 0;
    const evidence = axis.evidence.map((ev, index) => ({
      ...ev,
      available: index < availableCount,
    }));
    return {
      ...axis,
      evidence,
      score: calculateScoreBasedOnEvidence(evidence),
    };
  });
}

/** كل مفاتيح AsyncStorage التي يُحقَن بها وضع العرض التجريبي، جاهزة للاستخدام مباشرة مع seedDemoStorage */
export function buildDemoStorageEntries(): Record<string, string> {
  return {
    basicData: JSON.stringify(DEMO_BASIC_DATA),
    students: JSON.stringify(DEMO_STUDENTS),
    teacherSchedule: JSON.stringify(DEMO_SCHEDULE),
    performanceData: JSON.stringify(buildDemoPerformanceData()),
  };
}
