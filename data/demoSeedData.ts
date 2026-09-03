/**
 * بيانات واقعية جاهزة لوضع العرض التجريبي (Demo) — معلم افتراضي وطلابه
 * وجدوله الدراسي ومحاور أدائه المهني ونتائج اختبار تجريبي وتقارير محفوظة
 * وخطة تطوير فردية وبطاقة متابعة متعلم، بنفس مفاتيح ونماذج AsyncStorage
 * التي تقرأها الشاشات الحقيقية بالضبط (basicData / students /
 * teacherSchedule / performanceData / resultsAnalysisDraft /
 * reportBuilderReports / idpForm / difficultyCardDraft)، حتى تظهر
 * البيانات فورًا دون أي تعديل في تلك الشاشات.
 *
 * ملاحظة اتساق: أسماء طلاب "بطاقة متابعة متعلم" (DEMO_DIFFICULTY_CARD)
 * هي نفسها أسماء DEMO_STUDENTS بالضبط — عمدًا، حتى تعرض "قائمة المتعلمين"
 * و"بطاقة متابعة متعلم" في نفس الشاشة (app/student-tracking.tsx) بيانات
 * متسقة لنفس مجموعة الطلاب، لا كأنهما لطلاب مختلفين (رغم أن الكود الفعلي
 * لا يربط بين القائمتين، فكل منهما مصدر بيانات مستقل).
 *
 * ملاحظة نطاق: لا تُحقَن بيانات لـ"الشواهد المهنية" (professionalGrowthItems)
 * لأن شاشة البيانات الأساسية تحاول مزامنتها فعليًا مع جدول
 * professional_growth الحقيقي في Supabase عند التحميل، ما قد يُظهر خطأ
 * مزامنة غير ضروري لزائر العرض التجريبي (محمي بسياسات RLS، لكن تجربة
 * المستخدم فيه أقل أناقة من مجرد تركه فارغًا).
 *
 * ملاحظة VARK: شاشة "تحليل أنماط تعلم الطلاب" تقرأ من جدولي Supabase
 * الحقيقيين vark_tests/vark_responses مباشرة (لا AsyncStorage)، فبياناتها
 * التجريبية لا يمكن حقنها من هذا الملف — أُدرجت يدويًا مرة واحدة عبر SQL
 * مباشرة لحساب demo@enjaz-almaulm.com (محمية بنفس سياسات القراءة فقط
 * RLS كبقية جداول العرض التجريبي).
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
 * "بطاقة متابعة متعلم (الخطط العلاجية والإثرائية)" — app/student-tracking.tsx،
 * مفتاح difficultyCardDraft. متعمَّد أن أسماء الطلاب في جدول المتابعة هنا هي
 * نفسها أسماء DEMO_STUDENTS بالضبط (لا أسماء مختلفة) حتى تظهر بطاقتا هذه
 * الشاشة ("قائمة المتعلمين" و"بطاقة متابعة متعلم") ببيانات متسقة لنفس
 * المجموعة من الطلاب، لا كأنهما قائمتان منفصلتان عن طلاب مختلفين.
 */
export const DEMO_DIFFICULTY_CARD = {
  subjectGrade: 'الرياضيات - الأول متوسط',
  schoolType: 'متوسطة',
  schoolName: 'مدرسة الفاروق المتوسطة',
  masteryCriteria: '80',
  deputyName: 'أ. منيرة الحربي',
  teacherName: 'أ. خالد العتيبي',
  entries: [
    {
      id: 'demo-de-1',
      studentName: 'عبدالله محمد السالم',
      grade: 'الأول متوسط',
      masteryPercent: '88',
      afterPercent: '97',
      followUpDate: '2026/09/10',
      needType: 'إثراء وتوسيع للمتفوقين',
      skill: 'حل المسائل الهندسية المتقدمة',
      plan: 'تكليفه بمسائل إثرائية إضافية ومشاركته في نادي الرياضيات المدرسي',
    },
    {
      id: 'demo-de-2',
      studentName: 'سارة أحمد القحطاني',
      grade: 'الأول متوسط',
      masteryPercent: '55',
      afterPercent: '78',
      followUpDate: '2026/09/15',
      needType: 'ضعف فهم المفهوم',
      skill: 'الضرب والقسمة',
      plan: 'جلسات تقوية فردية أسبوعية مع تدريب مكثف على جدول الضرب',
    },
    {
      id: 'demo-de-3',
      studentName: 'فيصل خالد الدوسري',
      grade: 'الثاني متوسط',
      masteryPercent: '35',
      afterPercent: '58',
      followUpDate: '2026/09/20',
      needType: 'صعوبة تطبيق الخطوات',
      skill: 'حل المسائل اللفظية',
      plan: 'خطة علاجية فردية مكثفة بالتنسيق مع أخصائي صعوبات التعلم',
    },
    {
      id: 'demo-de-4',
      studentName: 'نورة سعد المطيري',
      grade: 'الثاني متوسط',
      masteryPercent: '92',
      afterPercent: '98',
      followUpDate: '2026/09/10',
      needType: 'إثراء وتوسيع للمتفوقين',
      skill: 'حل المسائل المنطقية المتقدمة',
      plan: 'إشراكها في مسابقة الرياضيات الترفيهية وتكليفها بمسائل تحدٍ إضافية',
    },
    {
      id: 'demo-de-5',
      studentName: 'ماجد عبدالعزيز الحربي',
      grade: 'الأول متوسط',
      masteryPercent: '74',
      afterPercent: '88',
      followUpDate: '2026/09/18',
      needType: 'حاجة إلى تدريب إضافي',
      skill: 'العمليات الأساسية على الكسور',
      plan: 'تدريب إضافي على الكسور باستخدام وسائل تعليمية محسوسة',
    },
  ],
  skillPlans: {
    'حل المسائل الهندسية المتقدمة': {
      objective: 'تعميق مهارة حل المسائل الهندسية المتقدمة',
      strategy: 'مسائل إثرائية تطبيقية ومشاركة في نادي الرياضيات',
      resources: 'أوراق عمل إثرائية، مسائل تحدٍ',
      duration: 'أسبوعان',
      measurementTool: 'اختبار قصير',
    },
    'الضرب والقسمة': {
      objective: 'إتقان جدول الضرب والقسمة حتى 12',
      strategy: 'جلسات تقوية فردية وتدريب مكثف يومي',
      resources: 'بطاقات تدريب، تطبيق تفاعلي',
      duration: 'أسبوعان',
      measurementTool: 'اختبار قصير',
    },
    'حل المسائل اللفظية': {
      objective: 'تحسين فهم وتحليل المسائل اللفظية',
      strategy: 'خطة علاجية فردية بالتنسيق مع أخصائي صعوبات التعلم',
      resources: 'مسائل مبسّطة تدريجية، وسائل بصرية',
      duration: '3 أسابيع',
      measurementTool: 'ملاحظة مباشرة + اختبار قصير',
    },
    'حل المسائل المنطقية المتقدمة': {
      objective: 'تنمية مهارات التفكير المنطقي المتقدم',
      strategy: 'مسابقات ومسائل تحدٍ إثرائية',
      resources: 'مسائل تحدٍ، مسابقة رياضيات',
      duration: 'أسبوعان',
      measurementTool: 'اختبار قصير',
    },
    'العمليات الأساسية على الكسور': {
      objective: 'إتقان العمليات الأساسية على الكسور',
      strategy: 'تدريب باستخدام وسائل تعليمية محسوسة',
      resources: 'وسائل محسوسة، أوراق عمل',
      duration: '3 أسابيع',
      measurementTool: 'اختبار قصير',
    },
  },
  highlightAchieved: 'تحسّن ملحوظ في نسب الإتقان لدى 3 من أصل 5 متعلمين خلال فترة المتابعة',
  stillNeedsSupport: 'مهارة حل المسائل اللفظية لدى الطلاب ذوي صعوبات التعلم',
  nextAction: 'تكثيف الجلسات الفردية للطلاب الذين لم يصلوا لمعيار الإتقان بعد',
  reviewDate: '2026/10/01',
};

/**
 * درجات اختبار تجريبي لصف كامل (20 طالبًا) — بنفس نموذج ResultsForm في
 * app/results-analysis.tsx بالضبط (درجة قياس من 40)، لتظهر إحصائيات
 * وتوزيع مستويات فعلي فور دخول شاشة "تحليل النتائج" دون أي إدخال يدوي.
 */
export const DEMO_RESULTS_ANALYSIS = {
  educationAdministration: 'إدارة تعليم الرياض',
  schoolName: 'مدرسة الفاروق المتوسطة',
  subject: 'الرياضيات',
  gradeLevel: 'الأول متوسط',
  semester: 'الفصل الدراسي الأول',
  maxScore: '40',
  testLabel: 'الاختبار النهائي',
  teacherName: 'أ. خالد العتيبي',
  principalName: 'أ. سعود الحربي',
  students: [
    { id: 'r1', name: 'عبدالله محمد السالم', score: '40' },
    { id: 'r2', name: 'نورة سعد المطيري', score: '38' },
    { id: 'r3', name: 'فهد ناصر العنزي', score: '37' },
    { id: 'r4', name: 'ريم عبدالرحمن الشمري', score: '36' },
    { id: 'r5', name: 'سلطان علي الغامدي', score: '35' },
    { id: 'r6', name: 'لمى خالد الزهراني', score: '34' },
    { id: 'r7', name: 'يزيد فهد القحطاني', score: '33' },
    { id: 'r8', name: 'جود سعود العتيبي', score: '32' },
    { id: 'r9', name: 'تركي بندر الحربي', score: '32' },
    { id: 'r10', name: 'سارة أحمد القحطاني', score: '31' },
    { id: 'r11', name: 'عمر ياسر الدوسري', score: '30' },
    { id: 'r12', name: 'غلا محمد آل سعيد', score: '29' },
    { id: 'r13', name: 'خالد سالم المالكي', score: '28' },
    { id: 'r14', name: 'دانة عبدالله الحارثي', score: '28' },
    { id: 'r15', name: 'فيصل خالد الدوسري', score: '25' },
    { id: 'r16', name: 'شهد وليد العصيمي', score: '23' },
    { id: 'r17', name: 'ماجد عبدالعزيز الحربي', score: '22' },
    { id: 'r18', name: 'رهف تركي البقمي', score: '20' },
    { id: 'r19', name: 'ناصر سعيد الشهري', score: '18' },
    { id: 'r20', name: 'وجدان محمد العمري', score: '15' },
  ],
};

/**
 * تقريران محفوظان في "إنشاء التقارير" (app/report-builder.tsx، مفتاح
 * reportBuilderReports) — بنفس نموذج SavedReport بالضبط (ReportForm +
 * id + savedAt)، بترتيب الأحدث أولًا كما تحفظه الشاشة الفعلية عند
 * الحفظ. القيم المختارة (goals/means/results/challenges/suggestions)
 * جميعها من القوائم الجاهزة الرسمية لكل نوع تقرير في REPORT_TYPES حتى
 * تظهر محددة (لا نص إضافي فقط) عند فتح التقرير من قائمة "المحفوظة".
 */
export const DEMO_REPORTS = [
  {
    id: 'demo-report-2',
    reportType: 'lesson',
    schoolName: 'مدرسة الفاروق المتوسطة',
    educationAdministration: 'إدارة تعليم الرياض',
    teacherName: 'أ. خالد العتيبي',
    semester: 'الأول',
    gradeDetails: 'الثاني متوسط',
    week: 'الأسبوع السابع',
    domain: 'الرياضيات',
    program: 'المعادلات الخطية بمتغير واحد',
    goals: ['تحقيق نواتج التعلم المستهدفة', 'تعزيز المشاركة والتفاعل الصفي', 'معالجة الفروق الفردية بين المتعلمين'],
    goalsOther: '',
    means: ['الحوار والمناقشة', 'التعلم التعاوني', 'أوراق عمل وتقويم تكويني'],
    meansOther: '',
    results: ['تحقيق أهداف الدرس', 'إتقان أغلب المتعلمين للمهارة'],
    resultsOther: '',
    steps: [
      'تمهيد بسؤال حياتي مرتبط بالمعادلات',
      'شرح الخطوات عبر أمثلة تدريجية',
      'تطبيق عملي عبر أوراق عمل جماعية',
      'تقويم ختامي بسؤالين سريعين',
    ],
    challenges: ['تفاوت المستويات بين المتعلمين'],
    challengesOther: '',
    suggestions: ['تخصيص وقت لمعالجة الفروق الفردية', 'توظيف تقنيات تفاعلية إضافية'],
    suggestionsOther: '',
    evidenceNotes: 'نموذج من ورقة العمل المستخدمة\nعينة من إجابات الطلاب',
    evidenceImages: [],
    implementationDate: '2026/09/01',
    activityLeaderName: 'أ. خالد العتيبي',
    principalName: 'أ. سعود الحربي',
    savedAt: '2026-09-01T09:30:00.000Z',
  },
  {
    id: 'demo-report-1',
    reportType: 'activity',
    schoolName: 'مدرسة الفاروق المتوسطة',
    educationAdministration: 'إدارة تعليم الرياض',
    teacherName: 'أ. خالد العتيبي',
    semester: 'الأول',
    gradeDetails: 'الأول متوسط',
    week: 'الأسبوع الخامس',
    domain: 'النشاط الطلابي',
    program: 'مسابقة الرياضيات الترفيهية',
    goals: ['تنمية المهارات الاجتماعية', 'تعزيز التفكير الناقد والإبداع', 'تعزيز روح التعاون والعمل الجماعي'],
    goalsOther: '',
    means: ['أنشطة عملية / تجارب', 'مسابقات وألعاب تعليمية', 'حوار ومناقشة جماعية'],
    meansOther: '',
    results: ['تفاعل الطالب/ة مع النشاط', 'زيادة دافعية الطالب/ة', 'مشاركة جماعية فعالة'],
    resultsOther: '',
    steps: [
      'تجهيز أسئلة المسابقة وتوزيع الفرق',
      'تنفيذ الجولة التمهيدية داخل الفصل',
      'تكريم الفائزين في طابور الصباح',
    ],
    challenges: ['ضيق الوقت', 'نقص الوسائل التعليمية'],
    challengesOther: '',
    suggestions: ['تكرار النشاط في مناسبات أخرى', 'تنويع طرق التنفيذ'],
    suggestionsOther: '',
    evidenceNotes: 'صور من المسابقة داخل الفصل\nنموذج ورقة الأسئلة المستخدمة',
    evidenceImages: [],
    implementationDate: '2026/08/25',
    activityLeaderName: 'أ. خالد العتيبي',
    principalName: 'أ. سعود الحربي',
    savedAt: '2026-08-25T10:00:00.000Z',
  },
];

/**
 * خطة تطوير فردية (IDP) — بنفس نموذج تخزين app/idp.tsx بالضبط (مفتاح
 * idpForm)، بثلاثة أهداف تطويرية بحسب الأولوية معبأة بالكامل.
 */
export const DEMO_IDP = {
  name: 'أ. خالد العتيبي',
  entity: 'مدرسة الفاروق المتوسطة',
  startDate: '2026/08/01',
  endDate: '2027/06/30',
  objectives70: [
    'تطبيق استراتيجيات تعلم نشط جديدة داخل الفصل',
    'المشاركة في مجتمع التعلم المهني للرياضيات بالمدرسة',
    'تبادل زيارات صفية مع زملاء التخصص',
  ],
  objectives20: [
    'حضور دورة "التقويم الحديث في الرياضيات"',
    'حضور ورشة استخدام منصة مدرستي في التقويم',
    'المشاركة في لقاء تبادل خبرات بين معلمي الرياضيات',
  ],
  objectives10: [
    'قراءة كتاب عن استراتيجيات تدريس الرياضيات',
    'متابعة دورات تدريبية إلكترونية عبر بوابة عين',
    'الاطلاع على أبحاث حديثة في تعليم الرياضيات',
  ],
  priorityObjectives: [
    {
      objective: 'تحسين نتائج الطلاب في مهارة الكسور والأعداد العشرية',
      activities: 'تنفيذ حصص إثرائية أسبوعية وأوراق عمل تفاعلية',
      endDate: '2026/12/01',
      supporter: 'وكيل الشؤون التعليمية',
      procedures: 'تحليل نتائج الاختبار القبلي، تصميم خطة علاجية، متابعة أسبوعية للتقدم',
      successCriteria: 'ارتفاع نسبة الإتقان إلى 85% فأكثر',
    },
    {
      objective: 'تطوير مهارات التقويم البديل لدى المعلم',
      activities: 'حضور ورشة تدريبية وتطبيق أداة تقويم جديدة على صف تجريبي',
      endDate: '2027/02/01',
      supporter: 'المشرف التربوي',
      procedures: 'التسجيل في الدورة، التطبيق العملي، توثيق النتائج في ملف الإنجاز',
      successCriteria: 'توثيق 3 نماذج تقويم بديل مطبقة فعليًا',
    },
    {
      objective: 'تعزيز التكامل التقني في تدريس الرياضيات',
      activities: 'دمج تطبيقات تفاعلية (مثل Padlet) في حصتين أسبوعيًا',
      endDate: '2027/04/01',
      supporter: 'قائد تقنية المعلومات بالمدرسة',
      procedures: 'تجربة التطبيقات، تدريب الطلاب على استخدامها، جمع تغذية راجعة',
      successCriteria: 'استخدام التقنية بانتظام في 80% من الحصص',
    },
  ],
};

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
    resultsAnalysisDraft: JSON.stringify(DEMO_RESULTS_ANALYSIS),
    reportBuilderReports: JSON.stringify(DEMO_REPORTS),
    idpForm: JSON.stringify(DEMO_IDP),
    difficultyCardDraft: JSON.stringify(DEMO_DIFFICULTY_CARD),
  };
}
