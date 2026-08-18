/**
 * أسئلة استبيان تحديد نمط التعلم (VARK) — 10 أسئلة، 4 خيارات لكل سؤال.
 * منقولة حرفيًا من النموذج الورقي المعتمد (استبيان VARK)، وثابتة داخل
 * التطبيق (غير قابلة للتعديل من المعلم في هذا الإصدار).
 *
 * كل خيار مرتبط بنمط تعلم واحد: بصري (V) / سمعي (A) / قراءة-كتابة (R) / حركي (K).
 * ترتيب الخيارات في كل سؤال ثابت دائمًا: أ=V، ب=A، ج=R، د=K.
 */

export type VarkStyle = 'V' | 'A' | 'R' | 'K';

export interface VarkOption {
  key: 'a' | 'b' | 'c' | 'd';
  text: string;
  style: VarkStyle;
}

export interface VarkQuestion {
  id: number;
  text: string;
  options: VarkOption[];
}

export const VARK_STYLE_LABELS: Record<VarkStyle, string> = {
  V: 'بصري',
  A: 'سمعي',
  R: 'قراءة/كتابة',
  K: 'حركي',
};

export const VARK_QUESTIONS: VarkQuestion[] = [
  {
    id: 1,
    text: 'عندما تحاول فهم فكرة جديدة، تفضل:',
    options: [
      { key: 'a', text: 'رؤية صور ورسوم بيانية تشرح الفكرة', style: 'V' },
      { key: 'b', text: 'الاستماع إلى شرح صوتي أو محاضرة', style: 'A' },
      { key: 'c', text: 'قراءة نص مكتوب عنها أو تدوين ملاحظات', style: 'R' },
      { key: 'd', text: 'تطبيقها عمليًا أو تنفيذ تجربة عليها', style: 'K' },
    ],
  },
  {
    id: 2,
    text: 'عند تعلمك مهارة جديدة (مثل ركوب الدراجة أو استخدام جهاز جديد)، تفضل:',
    options: [
      { key: 'a', text: 'مشاهدة فيديو أو صور توضيحية حول كيفية القيام بها', style: 'V' },
      { key: 'b', text: 'الاستماع إلى شخص يشرح لك الخطوات', style: 'A' },
      { key: 'c', text: 'قراءة دليل التعليمات', style: 'R' },
      { key: 'd', text: 'تجربتها بنفسك مباشرة', style: 'K' },
    ],
  },
  {
    id: 3,
    text: 'عندما تحتاج إلى تذكر شيء مهم، تفضل:',
    options: [
      { key: 'a', text: 'تذكر صورة أو مخطط يشرح الفكرة', style: 'V' },
      { key: 'b', text: 'تكرار الكلمات بصوت عالٍ أو الاستماع إليها مجددًا', style: 'A' },
      { key: 'c', text: 'كتابتها في ورقة أو قراءتها عدة مرات', style: 'R' },
      { key: 'd', text: 'تمثيلها عمليًا أو القيام بحركات تساعدك على التذكر', style: 'K' },
    ],
  },
  {
    id: 4,
    text: 'ما الطريقة المفضلة لديك عند الدراسة؟',
    options: [
      { key: 'a', text: 'استخدام الألوان والمخططات والرسوم البيانية', style: 'V' },
      { key: 'b', text: 'الاستماع إلى الشرح الصوتي أو التحدث مع الآخرين حول الموضوع', style: 'A' },
      { key: 'c', text: 'كتابة الملخصات والملاحظات', style: 'R' },
      { key: 'd', text: 'إعادة تطبيق المفاهيم من خلال التجارب والأنشطة', style: 'K' },
    ],
  },
  {
    id: 5,
    text: 'عند حضور محاضرة، ما الذي يساعدك أكثر على الفهم؟',
    options: [
      { key: 'a', text: 'عرض الشرائح أو الفيديوهات', style: 'V' },
      { key: 'b', text: 'الاستماع بتركيز إلى شرح المحاضر', style: 'A' },
      { key: 'c', text: 'قراءة النصوص والمذكرات لاحقًا', style: 'R' },
      { key: 'd', text: 'المشاركة في أنشطة وتطبيقات عملية', style: 'K' },
    ],
  },
  {
    id: 6,
    text: 'عند الذهاب إلى مكان جديد، كيف تفضل معرفة الطريق؟',
    options: [
      { key: 'a', text: 'مشاهدة خريطة للمكان', style: 'V' },
      { key: 'b', text: 'الاستماع إلى شخص يشرح لك الطريق', style: 'A' },
      { key: 'c', text: 'قراءة إرشادات مكتوبة حول الاتجاهات', style: 'R' },
      { key: 'd', text: 'المشي في المكان واكتشافه بنفسك', style: 'K' },
    ],
  },
  {
    id: 7,
    text: 'عندما أريد تذكر شيء مهم، أفضّل:',
    options: [
      { key: 'a', text: 'رسمه أو تخيله في ذهني', style: 'V' },
      { key: 'b', text: 'تكراره بصوت عالٍ أو سماعه من شخص آخر', style: 'A' },
      { key: 'c', text: 'كتابته في دفتري', style: 'R' },
      { key: 'd', text: 'القيام به أو الإشارة إليه بيدي', style: 'K' },
    ],
  },
  {
    id: 8,
    text: 'عند التعرف على شخص جديد، كيف تتذكر اسمه؟',
    options: [
      { key: 'a', text: 'تتذكر ملامحه أو صورته', style: 'V' },
      { key: 'b', text: 'تتذكر صوته أو طريقة حديثه', style: 'A' },
      { key: 'c', text: 'تكتب اسمه أو تراه مكتوبًا', style: 'R' },
      { key: 'd', text: 'تربطه بموقف أو تجربة معينة', style: 'K' },
    ],
  },
  {
    id: 9,
    text: 'عندما تواجه مشكلة تقنية في جهاز إلكتروني، كيف تفضل حلها؟',
    options: [
      { key: 'a', text: 'مشاهدة فيديو تعليمي لحلها', style: 'V' },
      { key: 'b', text: 'الاستماع إلى شخص يشرح لك الحل', style: 'A' },
      { key: 'c', text: 'قراءة دليل المستخدم أو تعليمات مكتوبة', style: 'R' },
      { key: 'd', text: 'تجربة الضغط على الأزرار بنفسك لاكتشاف الحل', style: 'K' },
    ],
  },
  {
    id: 10,
    text: 'ما الطريقة التي تفضلها عند تعلم لغة جديدة؟',
    options: [
      { key: 'a', text: 'مشاهدة الصور والفيديوهات المتعلقة بالكلمات', style: 'V' },
      { key: 'b', text: 'الاستماع إلى التسجيلات الصوتية ونطق الكلمات بصوت عالٍ', style: 'A' },
      { key: 'c', text: 'قراءة الكلمات وكتابتها مرارًا', style: 'R' },
      { key: 'd', text: 'استخدام الإشارات والتفاعل مع الآخرين مباشرة', style: 'K' },
    ],
  },
];

/** يحسب عدد الإجابات لكل نمط، ويحدد النمط الغالب (أو "مختلط" عند تقارب النسب). */
export function computeVarkResult(
  answers: Record<number, VarkStyle[]>
): { counts: Record<VarkStyle, number>; dominant: VarkStyle | 'mixed' } {
  const counts: Record<VarkStyle, number> = { V: 0, A: 0, R: 0, K: 0 };
  Object.values(answers).forEach((styles) => {
    styles.forEach((style) => {
      counts[style] += 1;
    });
  });

  const max = Math.max(counts.V, counts.A, counts.R, counts.K);
  const topStyles = (Object.keys(counts) as VarkStyle[]).filter((s) => counts[s] === max);
  const dominant: VarkStyle | 'mixed' = max === 0 || topStyles.length > 1 ? 'mixed' : topStyles[0];

  return { counts, dominant };
}
