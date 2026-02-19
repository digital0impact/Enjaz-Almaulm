import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUBSCRIPTION_DAYS = { yearly: 365, half_yearly: 180 } as const;
const SUBSCRIPTION_PRICES = { yearly: 49.99, half_yearly: 29.99 } as const;

type PlanType = 'yearly' | 'half_yearly';

/** Normalize phone for comparison (digits only). Saudi canonical: 966 + 9 digits = 12 chars. */
function normalizePhone(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  // إزالة أصفار البداية (00966, 0966) حتى نصل لـ 966 أو 5
  digits = digits.replace(/^0+/, '') || digits;
  if (digits.startsWith('966')) {
    const rest = digits.slice(3);
    if (rest.length >= 9) return '966' + rest.slice(0, 9);
    if (rest.length > 0) return '966' + rest;
    return digits.slice(0, 12);
  }
  if (digits.length >= 10 && digits.startsWith('0')) return '966' + digits.slice(1).slice(0, 9);
  if (digits.length === 9 && digits.startsWith('5')) return '966' + digits;
  if (digits.length > 9 && digits.startsWith('5')) return '966' + digits.slice(0, 9);
  return digits;
}

/** Saudi mobile: last 9 digits (5xxxxxxxx) - for fallback matching */
function saudiLast9(phone: string): string {
  const n = normalizePhone(phone);
  if (n.startsWith('966') && n.length >= 12) return n.slice(3, 12);
  if (n.length >= 9) return n.slice(-9);
  return n;
}

/** Infer plan from Salla order items (edit product names/IDs for your store) */
function getPlanFromSallaItems(items: Array<{ product?: { id?: number; name?: string; sku?: string }; name?: string }>): PlanType | null {
  if (!items?.length) return null;
  const name = (items[0].product?.name ?? items[0].name ?? '').toLowerCase();
  const sku = (items[0].product?.sku ?? '').toLowerCase();
  if (name.includes('سنوي') && !name.includes('نصف')) return 'yearly';
  if (name.includes('نصف') || name.includes('half') || sku.includes('half')) return 'half_yearly';
  if (name.includes('yearly') || sku.includes('yearly')) return 'yearly';
  return 'yearly';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret' } });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const webhookSecret = Deno.env.get('WEBHOOK_STORE_SECRET') || '';

  const authHeader = req.headers.get('x-webhook-secret') || req.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (webhookSecret && authHeader !== webhookSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let email: string;
  let phone: string | null = null;
  let plan: PlanType;
  let transactionId: string;

  try {
    const body = await req.json();

    if (body.email && (body.plan === 'yearly' || body.plan === 'half_yearly')) {
      email = body.email.trim().toLowerCase();
      phone = (body.phone && String(body.phone).trim()) ? String(body.phone).trim() : null;
      plan = body.plan;
      transactionId = body.transaction_id || `direct-${Date.now()}`;
    } else if (body.event && body.data) {
      const event = body.event;
      const data = body.data;
      // سلة قد ترسل الطلب داخل data أو data.order
      const order = data.order || data;
      const customer = data.customer || order.customer || data.shipping?.receiver || order.shipping?.receiver || order.receiver;
      const shippingReceiver = data.shipping?.receiver || order.shipping?.receiver;
      email = (customer?.email || shippingReceiver?.email || order.email || data.email || '').trim().toLowerCase();
      const rawPhone =
        customer?.mobile ?? customer?.phone ?? customer?.mobile_number
        ?? shippingReceiver?.phone ?? shippingReceiver?.mobile ?? shippingReceiver?.mobile_number
        ?? data.receiver?.phone ?? data.receiver?.mobile
        ?? order.shipping_address?.phone ?? order.billing_address?.phone
        ?? data.phone ?? order.phone ?? '';
      phone = (rawPhone && String(rawPhone).trim()) ? String(rawPhone).trim() : null;
      if (!email && !phone) {
        return new Response(JSON.stringify({ error: 'No customer email or phone in webhook' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const items = data.items || order.items || [];
      const inferredPlan = getPlanFromSallaItems(items);
      if (!inferredPlan) {
        return new Response(JSON.stringify({ error: 'Could not determine plan from order items' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      plan = inferredPlan;
      transactionId = `salla-${data.id ?? order.id ?? data.reference_id ?? order.reference_id ?? Date.now()}`;
      const statusSlug = (data.order ?? data).status?.slug ?? data.status?.slug ?? order.status?.slug ?? '';
      if (event === 'order.status.updated' && statusSlug && statusSlug !== 'completed' && statusSlug !== 'delivered') {
        return new Response(JSON.stringify({ message: 'Order not completed, subscription not created' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid body: need { email, plan } or Salla webhook { event, data }' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
  } catch (_e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let userId: string | null = null;

  if (email) {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const all = (list as { users?: Array<{ id: string; email?: string }> })?.users ?? [];
    const found = all.find((u: { email?: string }) => (u.email || '').toLowerCase() === email);
    if (found) userId = found.id;
  }
  if (!userId && phone) {
    const normalized = normalizePhone(phone);
    const last9 = saudiLast9(phone);
    if (normalized.length >= 9 || last9.length >= 9) {
      const { data: profiles } = await supabase.from('user_profiles').select('id, phone_number').not('phone_number', 'is', null).neq('phone_number', '');
      const profilesList = (profiles || []) as Array<{ id: string; phone_number: string }>;
      let found = profilesList.find((p) => {
        const pn = normalizePhone(p.phone_number || '');
        const p9 = saudiLast9(p.phone_number || '');
        return pn === normalized || (last9.length >= 9 && p9 === last9);
      });
      if (found) userId = found.id;
      if (!userId) {
        const { data: usersRows } = await supabase.from('users').select('id, phone_number').not('phone_number', 'is', null).neq('phone_number', '');
        const usersList = (usersRows || []) as Array<{ id: string; phone_number: string }>;
        found = usersList.find((u) => {
          const un = normalizePhone(u.phone_number || '');
          const u9 = saudiLast9(u.phone_number || '');
          return un === normalized || (last9.length >= 9 && u9 === last9);
        });
        if (found) userId = found.id;
      }
    }
  }
  if (!userId) {
    return new Response(JSON.stringify({
      error: 'No user found with this email or phone.',
      hint_ar: 'تأكد من استخدام نفس رقم الجوال المسجّل في التطبيق (الإعدادات → البيانات الأساسية) عند الشراء من متجر سلة، أو سجّل الدخول ثم احفظ رقم الجوال في البيانات الأساسية وأعد المحاولة.',
    }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS[plan]);

  const { error: insertError } = await supabase.from('subscriptions').insert({
    user_id: userId,
    plan_type: plan,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    status: 'active',
    price: SUBSCRIPTION_PRICES[plan],
    transaction_id: transactionId,
    purchase_verified: true,
  });

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true, user_id: userId, plan, end_date: endDate.toISOString() }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
});


