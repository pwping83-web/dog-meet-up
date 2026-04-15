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

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomPassword(): string {
  return `${crypto.randomUUID().replace(/-/g, "")}${Math.random().toString(36).slice(2, 10)}`;
}

function emailFromPhone(phoneE164: string): string {
  const d = phoneE164.replace(/\D/g, "");
  return `phone_${d}@phone.daeng.local`;
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
  let code = "";
  try {
    const body = (await req.json()) as { phone?: unknown; code?: unknown };
    phoneRaw = typeof body.phone === "string" ? body.phone : "";
    code = typeof body.code === "string" ? body.code.trim() : "";
  } catch {
    return jsonResponse({ ok: false, error: "JSON 파싱 실패" }, 400);
  }

  const phoneE164 = normalizeE164Phone(phoneRaw);
  if (!phoneE164) {
    return jsonResponse({ ok: false, error: "휴대폰 번호 형식을 확인해 주세요." }, 400);
  }
  if (!/^\d{6}$/.test(code)) {
    return jsonResponse({ ok: false, error: "인증번호 6자리를 입력해 주세요." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRole);
  const { data: otpRow, error: otpErr } = await admin
    .from("phone_auth_otps")
    .select("id, code_hash, expires_at, attempt_count, consumed_at")
    .eq("phone_e164", phoneE164)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (otpErr) {
    return jsonResponse({ ok: false, error: otpErr.message }, 500);
  }
  if (!otpRow) {
    return jsonResponse({ ok: false, error: "먼저 인증번호를 요청해 주세요." }, 400);
  }
  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return jsonResponse({ ok: false, error: "인증번호가 만료되었어요. 다시 요청해 주세요." }, 400);
  }
  if (Number(otpRow.attempt_count ?? 0) >= 5) {
    return jsonResponse({ ok: false, error: "인증 시도가 너무 많아요. 새 인증번호를 받아 주세요." }, 429);
  }

  const pepper = Deno.env.get("PHONE_OTP_PEPPER")?.trim() || serviceRole.slice(0, 32);
  const expectedHash = await sha256Hex(`${phoneE164}|${code}|${pepper}`);
  if (expectedHash !== otpRow.code_hash) {
    await admin
      .from("phone_auth_otps")
      .update({ attempt_count: Number(otpRow.attempt_count ?? 0) + 1 })
      .eq("id", otpRow.id);
    return jsonResponse({ ok: false, error: "인증번호를 확인해 주세요." }, 400);
  }

  await admin.from("phone_auth_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otpRow.id);

  let loginEmail = "";
  let userId = "";
  const { data: accountRow } = await admin
    .from("phone_auth_accounts")
    .select("phone_e164, user_id, login_email")
    .eq("phone_e164", phoneE164)
    .maybeSingle();

  if (accountRow?.user_id && accountRow.login_email) {
    loginEmail = String(accountRow.login_email);
    userId = String(accountRow.user_id);
  } else {
    loginEmail = emailFromPhone(phoneE164);
    const createPassword = randomPassword();
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: loginEmail,
      password: createPassword,
      email_confirm: true,
      user_metadata: {
        phone_e164: phoneE164,
      },
    });
    if (createErr || !created.user) {
      return jsonResponse({ ok: false, error: `계정 생성 실패: ${createErr?.message ?? "unknown"}` }, 500);
    }
    userId = created.user.id;
    const { error: mapErr } = await admin.from("phone_auth_accounts").insert({
      phone_e164: phoneE164,
      user_id: userId,
      login_email: loginEmail,
    });
    if (mapErr) {
      return jsonResponse({ ok: false, error: `전화번호 매핑 저장 실패: ${mapErr.message}` }, 500);
    }
  }

  const loginPassword = randomPassword();
  const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
    password: loginPassword,
    user_metadata: { phone_e164: phoneE164 },
  });
  if (updateErr) {
    return jsonResponse({ ok: false, error: `로그인 토큰 생성 실패: ${updateErr.message}` }, 500);
  }

  return jsonResponse({
    ok: true,
    loginEmail,
    loginPassword,
  });
});
