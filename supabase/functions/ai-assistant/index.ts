import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

type SuggestionType =
  | "vision"
  | "mission"
  | "idp_objective_70"
  | "idp_objective_20"
  | "idp_objective_10"
  | "idp_priority_objective"
  | "idp_priority_activities"
  | "idp_priority_procedures"
  | "idp_priority_success";

function getPrompt(type: SuggestionType, currentText: string): { system: string; user: string } {
  const base = "أنت مساعد لمعلم في المملكة العربية السعودية. اكتب نصاً قصيراً بالعربية الفصحى فقط، مناسب للحقل المطلوب. لا تضع عناوين أو شرحاً إضافياً، فقط النص المقترح في سطر أو بضع جمل.";
  const withCurrent = currentText?.trim()
    ? `النص الحالي للمستخدم: "${currentText.trim()}". يمكنك تحسينه أو اقتراح بديل أفضل.`
    : "اقترح نصاً جديداً مناسباً.";
  const byType: Record<SuggestionType, string> = {
    vision:
      "الحقل: الرؤية التعليمية للمعلم/المدرسة. المطلوب: جملة أو جملتين تعبّران عن رؤية تربوية طموحة ومختصرة.",
    mission:
      "الحقل: الرسالة التعليمية. المطلوب: جملة أو جملتين تعبّران عن رسالة المعلم أو المؤسسة تجاه الطلاب والتعلم.",
    idp_objective_70:
      "الحقل: هدف تطويري في إطار «التعلم من خلال التجارب والخبرات (70%)» مثل مجتمعات التعلم المهنية. المطلوب: هدف واحد واضح وقابل للقياس في سطر أو سطرين.",
    idp_objective_20:
      "الحقل: هدف تطويري في إطار «التعلم من خلال الآخرين (20%)» مثل الدورات والندوات. المطلوب: هدف واحد واضح في سطر أو سطرين.",
    idp_objective_10:
      "الحقل: هدف تطويري في إطار «التعلم المباشر (10%)» مثل التعلم الذاتي والقراءة. المطلوب: هدف واحد واضح في سطر أو سطرين.",
    idp_priority_objective:
      "الحقل: هدف من الأهداف التطورية ذات الأولوية في خطة التطوير الفردية (IDP). المطلوب: هدف واحد واضح وقابل للتحقيق في سطر أو سطرين.",
    idp_priority_activities:
      "الحقل: الأنشطة المرتبطة بالهدف التطويري (بناء على نموذج 10-20-70). المطلوب: أنشطة محددة وقصيرة في بضع جمل.",
    idp_priority_procedures:
      "الحقل: الإجراءات التفصيلية لتحقيق الهدف في خطة التطوير الفردية. المطلوب: خطوات عملية مختصرة.",
    idp_priority_success:
      "الحقل: معايير النجاح لتحقيق الهدف التطويري. المطلوب: معايير قابلة للقياس في جمل أو جملتين.",
  };
  return {
    system: base,
    user: `${byType[type]} ${withCurrent}`,
  };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

function jsonResponse(body: object, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS, ...extraHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "OPENAI_API_KEY not configured" }, 503);
  }

  const allowed: SuggestionType[] = [
    "vision",
    "mission",
    "idp_objective_70",
    "idp_objective_20",
    "idp_objective_10",
    "idp_priority_objective",
    "idp_priority_activities",
    "idp_priority_procedures",
    "idp_priority_success",
  ];

  let type: SuggestionType;
  let currentText: string;
  try {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body", hint: "Send JSON with at least: { \"type\": \"vision\" }" }, 400);
    }
    let body: Record<string, unknown> = {};
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      body = raw as Record<string, unknown>;
    } else if (typeof raw === "string") {
      try {
        body = (JSON.parse(raw) as Record<string, unknown>) || {};
      } catch (_) {
        return jsonResponse({ error: "Body is string but not valid JSON", hint: "Send: {\"type\":\"vision\",\"currentText\":\"\"}" }, 400);
      }
    }
    const bodyInner =
      typeof body.body === "string"
        ? (() => {
            try {
              return (JSON.parse(body.body as string) as Record<string, unknown>) || {};
            } catch {
              return {};
            }
          })()
        : (body.body as Record<string, unknown> | undefined) ?? {};
    const typeRaw =
      body.type ?? bodyInner.type ?? (body.payload as Record<string, unknown> | undefined)?.type ?? (body.data as Record<string, unknown> | undefined)?.type;
    const receivedType = typeof typeRaw === "string" ? typeRaw.trim() : String(typeRaw ?? "").trim();
    if (!receivedType || !allowed.includes(receivedType as SuggestionType)) {
      return jsonResponse(
        {
          error: "Invalid type",
          hint: "Expected one of: " + allowed.join(", "),
          received: receivedType || "(empty or not a string)",
          example: { type: "vision", currentText: "" },
          keysReceived: Object.keys(body),
        },
        400
      );
    }
    type = receivedType as SuggestionType;
    const textRaw =
      body.currentText ?? bodyInner.currentText ?? (body.payload as Record<string, unknown> | undefined)?.currentText ?? (body.data as Record<string, unknown> | undefined)?.currentText;
    currentText = typeof textRaw === "string" ? textRaw : "";
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON body", details: String(e) }, 400);
  }

  const { system, user } = getPrompt(type, currentText);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 300,
        temperature: 0.6,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMessage = errText;
      try {
        const errJson = JSON.parse(errText);
        errMessage = errJson?.error?.message ?? errJson?.message ?? errText;
      } catch (_) {}
      const code = res.status;
      if (code === 401) errMessage = "مفتاح OpenAI غير صحيح أو منتهٍ. تحقق من OPENAI_API_KEY في Supabase → Edge Functions → Secrets.";
      else if (code === 429) errMessage = "تجاوز حد الطلبات من OpenAI. حاول لاحقاً أو راجع استخدامك في platform.openai.com.";
      else if (code === 404 || errMessage.includes("model")) errMessage = "النموذج غير متاح. تأكد من صلاحية حسابك واسم النموذج (مثلاً gpt-4o-mini).";
      return jsonResponse(
        { error: "OpenAI request failed", status: code, message: errMessage, details: errText.slice(0, 500) },
        502
      );
    }

    const data = await res.json();
    const content =
      data?.choices?.[0]?.message?.content?.trim() ||
      data?.choices?.[0]?.text?.trim() ||
      "";
    if (!content) {
      return jsonResponse({ error: "Empty response from OpenAI" }, 502);
    }

    return jsonResponse({ text: content }, 200);
  } catch (e) {
    return jsonResponse({ error: "Server error", details: String(e) }, 500);
  }
});
