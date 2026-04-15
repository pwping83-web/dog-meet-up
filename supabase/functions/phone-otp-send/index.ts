import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeE164Phone(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("+")) {
    const m = t.match(/^\+82(10|11|16|17|18|19)\d{7,8}$/);
    return m ? t : null;
  }
  const d = t.replace(/\D/g, "");
  if (d.startsWith("82")) {
    const rest = d.slice(2);
    if (/^(10|11|16|17|18|19)\d{7,8}$/.test(rest)) return `+82${rest}`;
  }
  if (/^01(0|1|6|7|8|9)\d{7,8}$/.test(d)) return `+82${d.slice(1)}`;
  return null;
}

function e164ToDomestic(phoneE164: string): string {
  const d = phoneE164.replace(/\D/g, "");
  if (d.startsWith("82")) return `0${d.slice(2)}`;
  return d;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendSolapiSms(to: string, text: string) {
  const apiKey = Deno.env.get("SOLAPI_API_KEY")?.trim();
  const apiSecret = Deno.env.get("SOLAPI_API_SECRET")?.trim();
  const from = Deno.env.get("SOLAPI_FROM")?.trim();
  if (!apiKey || !apiSecret || !from) {
    throw new Error("SOLAPI_API_KEY / SOLAPI_API_SECRET / SOLAPI_FROM 시크릿을 확인해 주세요.");
  }

  const date = new Date().toISOString();
  const salt = crypto.randomUUID().replace(/-/g, "");
  const signature = await hmacSha256Hex(apiSecret, date + salt);
  const authorization =
    `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: JSON.stringify({
      message: {
        to,
        from,
        text,
      },
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`SOLAPI 전송 실패(${res.status}): ${raw.slice(0, 260)}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POST only" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !supabaseAnon || !serviceRole) {
    return jsonResponse({ ok: false, error: "Supabase 시크릿 구성이 부족합니다." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const clientApikey = req.headers.get("apikey")?.trim() || supabaseAnon;
  const authClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader, apikey: clientApikey } },
  });
  const { data: authData, error: authErr } = await authClient.auth.getUser();
  if (authErr || !authData.user) {
    return jsonResponse({ ok: false, error: "로그인이 필요합니다." }, 401);
  }

  let phoneRaw = "";
  try {
    const body = (await req.json()) as { phone?: unknown };
    phoneRaw = typeof body.phone === "string" ? body.phone : "";
  } catch {
    return jsonResponse({ ok: false, error: "JSON 파싱 실패" }, 400);
  }

  const phoneE164 = normalizeE164Phone(phoneRaw);
  if (!phoneE164) {
    return jsonResponse({ ok: false, error: "휴대폰 번호 형식을 확인해 주세요." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRole);
  const { data: latest } = await admin
    .from("phone_auth_otps")
    .select("created_at")
    .eq("phone_e164", phoneE164)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.created_at) {
    const elapsed = Date.now() - new Date(latest.created_at).getTime();
    if (elapsed < 20_000) {
      return jsonResponse({ ok: false, error: "잠시 후 다시 요청해 주세요. (20초 간격)" }, 429);
    }
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const pepper = Deno.env.get("PHONE_OTP_PEPPER")?.trim() || serviceRole.slice(0, 32);
  const codeHash = await sha256Hex(`${phoneE164}|${code}|${pepper}`);
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();

  const { error: otpErr } = await admin.from("phone_auth_otps").insert({
    phone_e164: phoneE164,
    code_hash: codeHash,
    expires_at: expiresAt,
  });
  if (otpErr) {
    return jsonResponse({ ok: false, error: `OTP 저장 실패: ${otpErr.message}` }, 500);
  }

  try {
    const domestic = e164ToDomestic(phoneE164);
    const text = `[댕댕마켓] 인증번호 ${code} (5분 유효)\n본인이 아니면 무시해 주세요.`;
    await sendSolapiSms(domestic, text);
  } catch (e) {
    return jsonResponse({ ok: false, error: (e as Error).message }, 500);
  }

  return jsonResponse({ ok: true });
});
