/**
 * بيانات واقعية جاهزة لوضع العرض التجريبي (Demo) — معلم افتراضي وطلابه
 * وجدوله الدراسي، بنفس مفاتيح ونماذج AsyncStorage التي تقرأها الشاشات
 * الحقيقية بالضبط (basicData / students / teacherSchedule)، حتى تظهر
 * البيانات فورًا دون أي تعديل في تلك الشاشات.
 *
 * ملاحظة نطاق: البيانات هنا تغطي الشاشات الأكثر مشاهدة (الرئيسية،
 * البيانات الأساسية، متابعة المتعلمين، الجدول الدراسي). شاشات أخرى ذات
 * نماذج بيانات أكثر تعقيدًا (الأداء المهني بمحاوره، الخطط العلاجية
 * التفصيلية، اختبارات VARK) تُترك بحالتها الفارغة الافتراضية بدل حقن
 * بيانات قد لا تطابق الشكل المتوقع تمامًا.
 */

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

/** كل مفاتيح AsyncStorage التي يُحقَن بها وضع العرض التجريبي، جاهزة للاستخدام مباشرة مع seedDemoStorage */
export function buildDemoStorageEntries(): Record<string, string> {
  return {
    basicData: JSON.stringify(DEMO_BASIC_DATA),
    students: JSON.stringify(DEMO_STUDENTS),
    teacherSchedule: JSON.stringify(DEMO_SCHEDULE),
  };
}
