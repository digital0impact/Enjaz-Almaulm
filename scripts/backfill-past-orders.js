/**
 * ربط المشتريات السابقة (طلبات سلة قبل تفعيل الويب هوك) بجدول subscriptions في Supabase.
 * الاستخدام: node scripts/backfill-past-orders.js [مسار/past-orders.json] [--dry-run]
 *
 * يحتاج: SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env أو بيئة التشغيل.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUBSCRIPTION_DAYS = { yearly: 365, half_yearly: 180 };
const SUBSCRIPTION_PRICES = { yearly: 49.99, half_yearly: 29.99 };
const PLAN_LEVEL = { half_yearly: 1, yearly: 2 };

function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  let digits = phone.replace(/\D/g, "");
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

function saudiLast9(phone) {
  const n = normalizePhone(phone);
  if (n.startsWith("966") && n.length >= 12) return n.slice(3, 12);
  if (n.length >= 9) return n.slice(-9);
  return n;
}

function getPlanFromProductName(productName) {
  if (!productName || typeof productName !== "string") return "yearly";
  const name = productName.toLowerCase();
  if (name.includes("نصف") || name.includes("half")) return "half_yearly";
  return "yearly";
}

async function findUserId(supabase, email, phone) {
  const emailLower = (email && String(email).trim().toLowerCase()) || "";

  if (emailLower) {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = list?.users || [];
    let found = users.find((u) => (u.email || "").toLowerCase() === emailLower);
    if (found) return found.id;

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("id")
      .ilike("email", emailLower)
      .limit(1)
      .maybeSingle();
    if (profileRow?.id) return profileRow.id;

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .ilike("email", emailLower)
      .limit(1)
      .maybeSingle();
    if (userRow?.id) return userRow.id;
  }

  if (phone) {
    const normalized = normalizePhone(phone);
    const last9 = saudiLast9(phone);
    if (normalized.length >= 9 || last9.length >= 9) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, phone_number")
        .not("phone_number", "is", null)
        .neq("phone_number", "");
      const profilesList = profiles || [];
      let found = profilesList.find((p) => {
        const pn = normalizePhone(p.phone_number || "");
        const p9 = saudiLast9(p.phone_number || "");
        return pn === normalized || (last9.length >= 9 && p9 === last9);
      });
      if (found) return found.id;

      const { data: usersRows } = await supabase
        .from("users")
        .select("id, phone_number")
        .not("phone_number", "is", null)
        .neq("phone_number", "");
      const usersList = usersRows || [];
      found = usersList.find((u) => {
        const un = normalizePhone(u.phone_number || "");
        const u9 = saudiLast9(u.phone_number || "");
        return un === normalized || (last9.length >= 9 && u9 === last9);
      });
      if (found) return found.id;
    }
  }

  return null;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a && !a.startsWith("-"));
  const dryRun = process.argv.includes("--dry-run");
  const filePath = args[0] || path.join(__dirname, "past-orders.json");

  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("يحتاج السكربت: SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في .env أو البيئة.");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error("ملف الطلبات غير موجود:", filePath);
    console.error("أنشئ ملفاً من القالب: scripts/past-orders.example.json");
    process.exit(1);
  }

  let orders;
  try {
    orders = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error("خطأ في قراءة/تحليل JSON:", e.message);
    process.exit(1);
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    console.log("لا توجد عناصر في الملف أو الملف ليس مصفوفة.");
    process.exit(0);
  }

  const supabase = createClient(url, serviceKey);
  let ok = 0;
  let skip = 0;
  let err = 0;

  console.log("عدد الطلبات:", orders.length);
  if (dryRun) console.log("وضع التحقق فقط (--dry-run): لن يُدرج أي اشتراك.\n");

  for (let i = 0; i < orders.length; i++) {
    const row = orders[i];
    const email = row.email != null ? String(row.email).trim() : "";
    const phone = row.phone != null ? String(row.phone).trim() : "";
    const productName = row.product_name != null ? String(row.product_name) : "";
    const orderId = row.order_id != null ? String(row.order_id) : `backfill-${Date.now()}-${i}`;
    const transactionId = orderId.startsWith("salla-") ? orderId : `salla-${orderId}`;

    if (!email && !phone) {
      console.log(`[${i + 1}] تخطي: لا بريد ولا جوال. order_id=${orderId}`);
      skip++;
      continue;
    }

    const plan = getPlanFromProductName(productName);
    const userId = await findUserId(supabase, email || null, phone || null);

    if (!userId) {
      console.log(`[${i + 1}] تخطي: لم يُعثر على مستخدم. email=${email || "-"} phone=${phone || "-"} order_id=${orderId}`);
      skip++;
      continue;
    }

    const { data: activeSubs } = await supabase
      .from("subscriptions")
      .select("plan_type")
      .eq("user_id", userId)
      .eq("status", "active");
    const activeList = activeSubs || [];
    const hasSamePlan = activeList.some((s) => s.plan_type === plan);
    const maxLevel = activeList.length ? Math.max(...activeList.map((s) => PLAN_LEVEL[s.plan_type])) : 0;
    const newLevel = PLAN_LEVEL[plan];

    if (hasSamePlan) {
      console.log(`[${i + 1}] تخطي: نفس الباقة موجودة. user_id=${userId} plan=${plan} order_id=${orderId}`);
      skip++;
      continue;
    }
    if (maxLevel > 0 && newLevel <= maxLevel) {
      console.log(`[${i + 1}] تخطي: الترقية للأعلى فقط. user_id=${userId} plan=${plan} order_id=${orderId}`);
      skip++;
      continue;
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS[plan]);

    if (dryRun) {
      console.log(`[${i + 1}] (dry-run) سيدرج: user_id=${userId} plan=${plan} end_date=${endDate.toISOString()} transaction_id=${transactionId}`);
      ok++;
      continue;
    }

    const { error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_type: plan,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
      price: SUBSCRIPTION_PRICES[plan],
      transaction_id: transactionId,
      purchase_verified: true,
    });

    if (error) {
      console.error(`[${i + 1}] خطأ إدراج:`, error.message, "order_id=", orderId);
      err++;
    } else {
      console.log(`[${i + 1}] تم: user_id=${userId} plan=${plan} end_date=${endDate.toISOString()} transaction_id=${transactionId}`);
      ok++;
    }
  }

  console.log("\n---");
  console.log("تم الربط:", ok, "| تخطي:", skip, "| أخطاء:", err);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
