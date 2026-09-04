// دالة التحقق من مشتريات داخل التطبيق (Apple/Google) على الخادم — تحلّ
// محل التحقق الذي كان يتم بالكامل داخل التطبيق نفسه (services/InAppPurchaseService.ts)
// ثم يكتب مباشرة إلى جدول subscriptions بصلاحية المستخدم العادية. أي
// عميل (حتى معدَّل يدويًا) كان يمكنه تجاوز خطوة "التحقق" بالكامل ومنح
// نفسه اشتراكًا مدفوعًا مجانًا، لأن RLS كانت تسمح للمستخدم بالكتابة في
// صفّه الخاص بأي قيم (راجع migration
// 20260904100000_restrict_subscriptions_client_write.sql التي تمنع ذلك
// الآن). من هنا فصاعدًا: التحقق من الإيصال يتم هنا فقط (بأسرار الخادم،
// غير المُرسَلة للعميل إطلاقًا)، والكتابة الفعلية في subscriptions تتم
// بصلاحية service_role التي تتجاوز RLS.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

const ANDROID_PACKAGE_NAME = "teacher-performance-app";

type PlanType = "yearly" | "half_yearly";

/**
 * تحديد نوع الخطة من معرّف المنتج على الخادم فقط — لا يُقبَل plan_type من
 * العميل إطلاقًا، وإلا لأمكن لمشترٍ حقيقي بخطة أرخص (نصف سنوية) أن يطلب
 * منح نفسه الخطة السنوية طالما الإيصال نفسه صالح (مجرد صالح لأي منتج).
 * خريطة صريحة بمطابقة تامة (وليس .includes) لتفادي خطأ سابق في العميل:
 * 'enjazhalfyearly30'.includes('yearly') === true فيصنَّف خطأً كسنوي.
 */
const PRODUCT_PLAN_MAP: Record<string, PlanType> = {
  Enjaz_Yearly_Subscription_50: "yearly",
  "Enjaz.Half_Yearly_Subscription30": "half_yearly",
  enjazyearly50: "yearly",
  enjazhalfyearly30: "half_yearly",
};

const SUBSCRIPTION_DAYS: Record<PlanType, number> = { yearly: 365, half_yearly: 180 };
const SUBSCRIPTION_PRICES: Record<PlanType, number> = { yearly: 49.99, half_yearly: 29.99 };

function jsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/** التحقق من إيصال آبل: يحاول خادم الإنتاج أولًا، ثم Sandbox تلقائيًا إن كانت الحالة 21007 (إيصال Sandbox أُرسل للإنتاج) — إرشاد آبل الرسمي */
async function verifyAppleReceipt(receiptData: string, sharedSecret: string): Promise<{ ok: boolean; productIds: string[] }> {
  const body = JSON.stringify({
    "receipt-data": receiptData,
    password: sharedSecret,
    "exclude-old-transactions": true,
  });
  const call = (url: string) =>
    fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body }).then((r) => r.json());

  let result = await call("https://buy.itunes.apple.com/verifyReceipt");
  if (result?.status === 21007) {
    result = await call("https://sandbox.itunes.apple.com/verifyReceipt");
  }
  if (result?.status !== 0) return { ok: false, productIds: [] };

  const entries = [
    ...(Array.isArray(result?.latest_receipt_info) ? result.latest_receipt_info : []),
    ...(Array.isArray(result?.receipt?.in_app) ? result.receipt.in_app : []),
  ];
  const productIds = entries.map((e: { product_id?: string }) => e.product_id).filter(Boolean) as string[];
  return { ok: true, productIds };
}

/**
 * التحقق من اشتراك أندرويد عبر Android Publisher API بتوكن وصول ثابت
 * (نفس الآلية المستخدمة سابقًا من العميل، مُنقولة هنا فقط — أُخرجت من
 * الكود المُرسَل للتطبيق). ملاحظة: توكن وصول ثابت ينتهي صلاحيته دوريًا
 * (عادة خلال ساعة لتوكنات OAuth)، فقد يحتاج تحديثًا يدويًا متكررًا في
 * أسرار Supabase؛ الحل الأمثل للإنتاج طويل المدى هو الانتقال لحساب
 * خدمة (service account) بتوكنات تُجدَّد تلقائيًا — خارج نطاق هذا الإصلاح.
 */
async function verifyAndroidPurchase(
  productId: string,
  purchaseToken: string,
  accessToken: string
): Promise<boolean> {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${ANDROID_PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return false;
  const data = await res.json();
  const expiry = Number(data?.expiryTimeMillis ?? 0);
  const cancelReason = data?.cancelReason;
  // paymentState: 1 = دُفع، 2 = تجربة مجانية مؤجَّلة الدفع؛ نقبل كليهما كصالحين
  return expiry > Date.now() && (cancelReason === undefined || cancelReason === null);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user) {
    return jsonResponse({ error: "unauthorized", message: "جلسة غير صالحة" }, 401);
  }
  const userId = userData.user.id;

  let body: {
    platform?: string;
    productId?: string;
    transactionId?: string;
    transactionReceipt?: string;
    purchaseToken?: string;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { platform, productId, transactionId, transactionReceipt, purchaseToken } = body;
  if (!productId || !PRODUCT_PLAN_MAP[productId]) {
    return jsonResponse({ error: "invalid_product", message: "معرّف منتج غير معروف" }, 400);
  }
  if (platform !== "ios" && platform !== "android") {
    return jsonResponse({ error: "invalid_platform" }, 400);
  }

  let verified = false;
  if (platform === "ios") {
    const sharedSecret = Deno.env.get("IOS_SHARED_SECRET") || "";
    if (!transactionReceipt || !sharedSecret) {
      return jsonResponse({ error: "missing_receipt_or_secret" }, 400);
    }
    const result = await verifyAppleReceipt(transactionReceipt, sharedSecret);
    verified = result.ok && result.productIds.includes(productId);
  } else {
    const accessToken = Deno.env.get("ANDROID_ACCESS_TOKEN") || "";
    if (!purchaseToken || !accessToken) {
      return jsonResponse({ error: "missing_token_or_secret" }, 400);
    }
    verified = await verifyAndroidPurchase(productId, purchaseToken, accessToken);
  }

  if (!verified) {
    return jsonResponse({ error: "verification_failed", message: "تعذّر التحقق من عملية الشراء" }, 402);
  }

  const planType = PRODUCT_PLAN_MAP[productId];
  const finalTransactionId = transactionId || `${platform}-${Date.now()}`;

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  // منع منح اشتراك مكرر لنفس معاملة الشراء عند إعادة المحاولة
  const { data: existing } = await serviceClient
    .from("subscriptions")
    .select("id")
    .eq("transaction_id", finalTransactionId)
    .maybeSingle();
  if (existing) {
    return jsonResponse({ success: true, alreadyProcessed: true }, 200);
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS[planType]);

  const { error: insertError } = await serviceClient.from("subscriptions").insert({
    user_id: userId,
    plan_type: planType,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    status: "active",
    price: SUBSCRIPTION_PRICES[planType],
    transaction_id: finalTransactionId,
    purchase_verified: true,
  });

  if (insertError) {
    return jsonResponse({ error: "db_error", message: insertError.message }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
