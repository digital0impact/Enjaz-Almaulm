// supabase/functions/salla-webhook/index.ts
// ويب هوك مخصّص لطلبات سلة فقط — يربط الطلب بالمستخدم ويُدخل اشتراكاً في subscriptions

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUBSCRIPTION_DAYS = { yearly: 365, half_yearly: 180 } as const;
const SUBSCRIPTION_PRICES = { yearly: 49.99, half_yearly: 29.99 } as const;
const PLAN_LEVEL: Record<PlanType, number> = { half_yearly: 1, yearly: 2 };

type PlanType = "yearly" | "half_yearly";

function normalizePhone(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  digits = digits.replace(/^0+/, "") || digits;
  if (digits.startsWith("966")) {
    const rest = digits.slice(3);
    if (rest.length >= 9) return "966" + rest.slice(0, 9);
    if (rest.length > 0) return "966" + rest;
    return digits.slice(0, 12);
  }
  if (digits.length >= 10 && digits.startsWith("0")) return "966" + digits.slice(1).slice(0, 9);
  if (digits.length === 9 && digits.startsWith("5")) return "966" + digits;
  if (digits.length > 9 && digits.startsWith("5")) return "966" + digits.slice(0, 9);
  return digits;
}

function saudiLast9(phone: string): string {
  const n = normalizePhone(phone);
  if (n.startsWith("966") && n.length >= 12) return n.slice(3, 12);
  if (n.length >= 9) return n.slice(-9);
  return n;
}

function getPlanFromSallaItems(
  items: Array<{ product?: { id?: number; name?: string; sku?: string }; name?: string }>
): PlanType | null {
  if (!items?.length) return null;
  const name = (items[0].product?.name ?? items[0].name ?? "").toLowerCase();
  const sku = (items[0].product?.sku ?? "").toLowerCase();
  if (name.includes("سنوي") && !name.includes("نصف")) return "yearly";
  if (name.includes("نصف") || name.includes("half") || sku.includes("half")) return "half_yearly";
  if (name.includes("yearly") || sku.includes("yearly")) return "yearly";
  return "yearly";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
      },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const webhookSecret = Deno.env.get("WEBHOOK_STORE_SECRET") || "";
  const authHeader = req.headers.get("x-webhook-secret") || req.headers.get("authorization")?.replace("Bearer ", "") || "";
  if (webhookSecret && authHeader !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let email: string;
  let phone: string | null = null;
  let plan: PlanType;
  let transactionId: string;

  try {
    const body = await req.json();
    // سلة ترسل عادة { event, data } — إن كان الطلب كله هو الطلب (بدون event/data) نتعامل معه
    let event: string;
    let data: Record<string, unknown>;
    if (body.event && body.data) {
      event = String(body.event);
      data = typeof body.data === "object" && body.data !== null ? (body.data as Record<string, unknown>) : {};
    } else if (body.id != null || body.reference_id != null || body.order) {
      // الطلب مُرسل مباشرة (أو داخل order)
      event = (body.event as string) || "order.created";
      const rawOrder = body.order ?? body;
      data = typeof rawOrder === "object" && rawOrder !== null ? (rawOrder as Record<string, unknown>) : {};
    } else {
      // طلب اختبار أو تنسيق غير معروف — نرجع 200 حتى لا تعيد سلة المحاولة، مع توضيح
      const receivedKeys = typeof body === "object" && body !== null ? Object.keys(body).join(", ") : "empty";
      return new Response(
        JSON.stringify({
          message: "Webhook URL is reachable. For subscription activation, Salla must send a real order event (e.g. order.created or order.status.updated) with { event, data }.",
          received_keys: receivedKeys || "(none)",
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const order = (data.order as Record<string, unknown>) || data;
    const customer = (data.customer || order.customer || (data.shipping as Record<string, unknown>)?.receiver || order.receiver) as Record<string, unknown> | undefined;
    const shippingReceiver = ((data.shipping as Record<string, unknown>)?.receiver || (order.shipping as Record<string, unknown>)?.receiver) as Record<string, unknown> | undefined;
    email = String(customer?.email || shippingReceiver?.email || order.email || data.email || "").trim().toLowerCase();
    const rawPhone =
      customer?.mobile ?? customer?.phone ?? customer?.mobile_number
      ?? shippingReceiver?.phone ?? shippingReceiver?.mobile ?? shippingReceiver?.mobile_number
      ?? (data.receiver as Record<string, unknown>)?.phone ?? (data.receiver as Record<string, unknown>)?.mobile
      ?? (order.shipping_address as Record<string, unknown>)?.phone ?? (order.billing_address as Record<string, unknown>)?.phone
      ?? data.phone ?? order.phone ?? "";
    phone = rawPhone && String(rawPhone).trim() ? String(rawPhone).trim() : null;

    if (!email && !phone) {
      return new Response(
        JSON.stringify({ error: "No customer email or phone in webhook" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const items = ((data.items || order.items) as Array<{ product?: { id?: number; name?: string; sku?: string }; name?: string }>) || [];
    const inferredPlan = getPlanFromSallaItems(items);
    if (!inferredPlan) {
      return new Response(
        JSON.stringify({ error: "Could not determine plan from order items" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    plan = inferredPlan;
    transactionId = `salla-${data.id ?? order.id ?? data.reference_id ?? order.reference_id ?? Date.now()}`;

    const statusObj = (data.order ?? data) as Record<string, unknown>;
    const statusSlug = String((statusObj?.status as { slug?: string })?.slug ?? (data.status as { slug?: string })?.slug ?? (order.status as { slug?: string })?.slug ?? "");
    if (
      event === "order.status.updated" &&
      statusSlug &&
      statusSlug !== "completed" &&
      statusSlug !== "delivered"
    ) {
      return new Response(
        JSON.stringify({ message: "Order not completed, subscription not created" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let userId: string | null = null;
  const emailLower = email ? email.trim().toLowerCase() : "";

  if (emailLower) {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const listData = list as { users?: Array<{ id: string; email?: string }> } | null;
    const all = listData?.users ?? [];
    const found = all.find((u: { email?: string }) => (u.email || "").toLowerCase() === emailLower);
    if (found) userId = found.id;
    if (!userId) {
      const { data: profileRow } = await supabase
        .from("user_profiles")
        .select("id")
        .ilike("email", emailLower)
        .limit(1)
        .maybeSingle();
      if (profileRow && (profileRow as { id?: string }).id) userId = (profileRow as { id: string }).id;
    }
    if (!userId) {
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .ilike("email", emailLower)
        .limit(1)
        .maybeSingle();
      if (userRow && (userRow as { id?: string }).id) userId = (userRow as { id: string }).id;
    }
  }

  if (!userId && phone) {
    const normalized = normalizePhone(phone);
    const last9 = saudiLast9(phone);
    if (normalized.length >= 9 || last9.length >= 9) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, phone_number")
        .not("phone_number", "is", null)
        .neq("phone_number", "");
      const profilesList = (profiles || []) as Array<{ id: string; phone_number: string }>;
      let found = profilesList.find((p) => {
        const pn = normalizePhone(p.phone_number || "");
        const p9 = saudiLast9(p.phone_number || "");
        return pn === normalized || (last9.length >= 9 && p9 === last9);
      });
      if (found) userId = found.id;
      if (!userId) {
        const { data: usersRows } = await supabase
          .from("users")
          .select("id, phone_number")
          .not("phone_number", "is", null)
          .neq("phone_number", "");
        const usersList = (usersRows || []) as Array<{ id: string; phone_number: string }>;
        found = usersList.find((u) => {
          const un = normalizePhone(u.phone_number || "");
          const u9 = saudiLast9(u.phone_number || "");
          return un === normalized || (last9.length >= 9 && u9 === last9);
        });
        if (found) userId = found.id;
      }
    }
  }

  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "No user found with this email or phone.",
        hint_ar:
          "تأكد من استخدام نفس رقم الجوال المسجّل في التطبيق (الإعدادات → البيانات الأساسية) عند الشراء من متجر سلة.",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("plan_type")
    .eq("user_id", userId)
    .eq("status", "active");
  const activeList = (activeSubs || []) as Array<{ plan_type: PlanType }>;
  const hasSamePlan = activeList.some((s) => s.plan_type === plan);
  const maxActiveLevel = activeList.length ? Math.max(...activeList.map((s) => PLAN_LEVEL[s.plan_type])) : 0;
  const newLevel = PLAN_LEVEL[plan];

  if (hasSamePlan) {
    return new Response(
      JSON.stringify({
        error: "Same plan already active.",
        hint_ar: "لا يمكن الاشتراك في نفس الباقة لنفس الهاتف أو البريد إلا مرة واحدة فقط.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }
  if (maxActiveLevel > 0 && newLevel <= maxActiveLevel) {
    return new Response(
      JSON.stringify({
        error: "Upgrade only.",
        hint_ar: "يمكن الترقية إلى الباقة الأعلى فقط.",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS[plan]);

  const { error: insertError } = await supabase.from("subscriptions").insert({
    user_id: userId,
    plan_type: plan,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    status: "active",
    price: SUBSCRIPTION_PRICES[plan],
    transaction_id: transactionId,
    purchase_verified: true,
  });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, user_id: userId, plan, end_date: endDate.toISOString() }),
    { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
  );
});
