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

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const t = raw.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const inner = fence ? fence[1]! : t;
  try {
    return JSON.parse(inner.trim()) as Record<string, unknown>;
  } catch {
    const s = inner.indexOf("{");
    const e = inner.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(inner.slice(s, e + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Groq 콘솔에서 발급 (gsk_…). 있으면 Gemini보다 우선 사용(테스트·무료 티어에 유리한 경우 많음). */
const GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"] as const;

/** Google AI Studio (AIza…). Secret: GEMINI_API_KEY */
const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"] as const;

async function groqChatOnce(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  apiKey: string,
): Promise<string> {
  const cap = Math.min(Math.max(maxTokens, 64), 8192);
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.55,
      max_tokens: cap,
    }),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Groq HTTP ${res.status} (${model}): ${raw.slice(0, 280)}`);
  }
  const data = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("빈 응답");
  return text.trim();
}

async function groqChat(system: string, user: string, maxTokens: number, apiKey: string): Promise<string> {
  let lastErr = "";
  for (const model of GROQ_MODELS) {
    try {
      return await groqChatOnce(model, system, user, maxTokens, apiKey);
    } catch (e) {
      lastErr = (e as Error).message;
      const retry = /400|404|model_decommissioned|decommissioned|not found|invalid model/i.test(lastErr);
      if (!retry) throw e;
    }
  }
  throw new Error(lastErr || "Groq 호출 실패");
}

async function llmChat(system: string, user: string, maxTokens: number): Promise<string> {
  const groqKey = Deno.env.get("GROQ_API_KEY")?.trim();
  if (groqKey) {
    return groqChat(system, user, maxTokens, groqKey);
  }
  return geminiChat(system, user, maxTokens);
}

async function geminiChatOnce(
  model: string,
  system: string,
  user: string,
  maxOutputTokens: number,
  apiKey: string,
): Promise<string> {
  const cap = Math.min(Math.max(maxOutputTokens, 128), 8192);
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${
      encodeURIComponent(apiKey)
    }`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: cap,
      },
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`Gemini HTTP ${res.status} (${model}): ${rawText.slice(0, 280)}`);
  }

  let data: {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    error?: { message?: string; code?: number; status?: string };
  };
  try {
    data = JSON.parse(rawText) as typeof data;
  } catch {
    throw new Error(`Gemini 응답 파싱 실패: ${rawText.slice(0, 160)}`);
  }

  if (data.error?.message) {
    throw new Error(`Gemini API (${model}): ${data.error.message}`);
  }

  const parts = data.candidates?.[0]?.content?.parts;
  const text =
    parts?.map((p) => p.text).filter((x): x is string => typeof x === "string").join("") ?? "";
  if (!text.trim()) throw new Error("빈 응답");
  return text.trim();
}

async function geminiChat(system: string, user: string, maxOutputTokens: number): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY")?.trim();
  if (!key) throw new Error("NO_KEY");

  let lastErr = "";
  for (const model of GEMINI_MODELS) {
    try {
      return await geminiChatOnce(model, system, user, maxOutputTokens, key);
    } catch (e) {
      lastErr = (e as Error).message;
      const retry = /404|NOT_FOUND|not found|is not found|not supported for generatecontent/i.test(
        lastErr,
      );
      if (!retry) throw e;
    }
  }
  throw new Error(lastErr || "Gemini 호출 실패");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POST only" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return jsonResponse({ ok: false, error: "로그인이 필요합니다." });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!supabaseUrl || !supabaseAnon) {
    return jsonResponse(
      { ok: false, error: "서버 설정 오류(SUPABASE_URL / SUPABASE_ANON_KEY). Edge 기본 시크릿을 확인하세요." },
    );
  }
  const clientApikey = req.headers.get("apikey")?.trim() || supabaseAnon;
  const supabaseAuth = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader, apikey: clientApikey } },
  });
  const { data: authData, error: authErr } = await supabaseAuth.auth.getUser();
  if (authErr || !authData.user) {
    return jsonResponse({
      ok: false,
      error: `세션이 유효하지 않습니다. 다시 로그인해 주세요. (${authErr?.message ?? "no user"})`,
    });
  }

  let task: string;
  let payload: Record<string, unknown>;
  try {
    const b = (await req.json()) as { task?: string; payload?: Record<string, unknown> };
    task = typeof b.task === "string" ? b.task : "";
    payload = b.payload && typeof b.payload === "object" ? b.payload : {};
  } catch {
    return jsonResponse({ ok: false, error: "JSON 파싱 실패" }, 400);
  }

  if (!task) {
    return jsonResponse({ ok: false, error: "task 없음" }, 400);
  }

  try {
    switch (task) {
      case "meetup_draft": {
        const kind = String(payload.kind ?? "moija");
        const hints = String(payload.hints ?? "").slice(0, 800);
        const currentCategory = String(payload.currentCategory ?? "").trim();
        const moija = "공원·장소 모임, 산책·놀이, 카페·체험, 훈련·사회화";
        const mannaja = "1:1 만남, 교배, 실종";
        const allowed = kind === "mannaja" ? mannaja : kind === "dolbom" ? "돌봄" : moija;
        const sys =
          `너는 한국 반려견 커뮤니티 '댕댕마켓' 글 작성 도우미야. 반드시 JSON만 출력해. 키: title, category, description (문자열). category는 다음 중 정확히 하나: ${allowed}. ` +
          `말투는 친근한 존댓말. description은 2~5문장. 제목은 28자 이내 권장.`;
        const user = `글 유형: ${kind}. 사용자 메모/키워드:\n${hints || "(비어 있음)"}\n` +
          (currentCategory ? `선호 주제(가능하면 맞출 것): ${currentCategory}\n` : "");
        const raw = await llmChat(sys, user, 700);
        const obj = extractJsonObject(raw);
        if (!obj?.title || !obj?.description) {
          return jsonResponse({ ok: true, text: raw, fields: {} });
        }
        return jsonResponse({
          ok: true,
          text: raw,
          fields: {
            title: String(obj.title).slice(0, 120),
            category: String(obj.category ?? "").slice(0, 80),
            description: String(obj.description).slice(0, 4000),
          },
        });
      }

      case "guard_intro": {
        const keywords = String(payload.keywords ?? "").slice(0, 500);
        const regionSi = String(payload.regionSi ?? "").trim();
        const regionGu = String(payload.regionGu ?? "").trim();
        const sys =
          "너는 인증 보호맘 프로필 소개글 작성 도우미야. 한국어 존댓말. 과장·의료·법적 확약은 피하고, 돌봄 경력·환경·견종 크기·산책·예방접종 확인 등을 담은 4~8문단. 출력은 본문만.";
        const user = `지역: ${regionSi} ${regionGu}\n키워드/메모:\n${keywords || "(없음)"}`;
        const text = await llmChat(sys, user, 900);
        return jsonResponse({ ok: true, text });
      }

      case "search_parse": {
        const q = String(payload.query ?? "").slice(0, 200);
        const sys =
          '반드시 JSON만: {"suggestedSearch":"검색창에 넣을 한 줄","chips":["칩1","칩2"]} chips는 0~4개 한국어.';
        const raw = await llmChat(sys, `사용자 입력: ${q}`, 300);
        const obj = extractJsonObject(raw);
        const suggestedSearch = typeof obj?.suggestedSearch === "string" ? obj.suggestedSearch : q;
        const chips = Array.isArray(obj?.chips)
          ? (obj.chips as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 4)
          : [];
        return jsonResponse({
          ok: true,
          text: raw,
          fields: { suggestedSearch: suggestedSearch.slice(0, 120), chips },
        });
      }

      case "chat_reply": {
        const transcript = String(payload.transcript ?? "").slice(0, 2000);
        const peerName = String(payload.peerName ?? "상대").slice(0, 40);
        const sys =
          "너는 반려견 산책·모임 채팅 도우미야. 한 줄~세 줄 짧은 답장 초안만. 존댓말. 연락처·주소 과다 요구 금지.";
        const user = `상대 닉네임: ${peerName}\n최근 대화:\n${transcript}`;
        const text = await llmChat(sys, user, 350);
        return jsonResponse({ ok: true, text });
      }

      case "mbti_expand": {
        const name = String(payload.name ?? "").slice(0, 80);
        const typeKey = String(payload.typeKey ?? "").slice(0, 40);
        const desc = String(payload.description ?? "").slice(0, 500);
        const sys =
          "강아지 성향(MBTI 유사) 결과에 대한 부드러운 해설을 한국어로 5~10문장. 과학적 단정 금지, '참고로' 톤.";
        const user = `유형 키: ${typeKey}\n이름: ${name}\n기본 설명: ${desc}`;
        const text = await llmChat(sys, user, 600);
        return jsonResponse({ ok: true, text });
      }

      case "join_summarize": {
        const rawItems = payload.items;
        const items = Array.isArray(rawItems) ? rawItems.slice(0, 12) : [];
        const lines = items.map((it, i) => {
          const o = it as Record<string, unknown>;
          const n = String(o.name ?? "").slice(0, 40);
          const m = String(o.message ?? "").slice(0, 300);
          const c = String(o.cost ?? "").slice(0, 40);
          return `${i + 1}. ${n} — ${c}\n   메시지: ${m}`;
        });
        const sys =
          "모임 주최자용 참여 신청 요약. 한국어 불릿 4~10줄. 민감정보 반복·외부 유출 조언 금지.";
        const user = lines.join("\n\n") || "(신청 없음)";
        const text = await llmChat(sys, user, 700);
        return jsonResponse({ ok: true, text });
      }

      case "admin_ops_hint": {
        const sys =
          "반려견 돌봄 플랫폼 운영자에게 짧은 체크리스트(한국어). 인증·RLS·결제·CS. 6~12줄 불릿, 기술명은 짧게.";
        const user = String(payload.topic ?? "guard_mom_certify_listing").slice(0, 200);
        const text = await llmChat(sys, `주제 키: ${user}`, 500);
        return jsonResponse({ ok: true, text });
      }

      case "owner_weekly_plan": {
        type MeetBrief = { id: string; title: string; category?: string; district?: string; estimatedCost?: string };
        type DogBrief = { id: string; name: string; breed: string; gender: string; age?: string | number | null };

        const rawMeetups = payload.candidateMeetups;
        const rawDogs = payload.candidateDogs;
        const meetups: MeetBrief[] = Array.isArray(rawMeetups)
          ? (rawMeetups as unknown[]).filter((x): x is MeetBrief =>
            Boolean(x && typeof x === "object" && typeof (x as MeetBrief).id === "string")
          )
          : [];
        const dogs: DogBrief[] = Array.isArray(rawDogs)
          ? (rawDogs as unknown[]).filter((x): x is DogBrief =>
            Boolean(x && typeof x === "object" && typeof (x as DogBrief).id === "string")
          )
          : [];

        const bundle = {
          today: String(payload.today ?? "").slice(0, 24),
          userDistrict: String(payload.userDistrict ?? "").slice(0, 80),
          myDogs: payload.myDogs,
          myPosts: payload.myPosts,
          candidateMeetups: meetups.map((m, i) => ({
            i,
            id: m.id,
            title: String(m.title ?? "").slice(0, 120),
            category: String(m.category ?? "").slice(0, 60),
            district: String(m.district ?? "").slice(0, 40),
            schedule: String(m.estimatedCost ?? "").slice(0, 80),
          })),
          candidateDogs: dogs.map((d, i) => ({
            i,
            id: d.id,
            name: String(d.name ?? "").slice(0, 40),
            breed: String(d.breed ?? "").slice(0, 40),
            gender: String(d.gender ?? "").slice(0, 8),
          })),
        };
        const userJson = JSON.stringify(bundle).slice(0, 14_000);

        const sys =
          `너는 댕댕마켓 반려견 앱의 "이번 주 할 일" 코치야. 입력은 JSON 한 덩어리이며, 후보 모임·댕친은 i가 인덱스야.\n` +
          `반드시 아래 스키마의 JSON만 출력해. 마크다운·코드펜스 금지.\n` +
          `{"intro":"1문장 우선, 최대 2문장. 문장마다 ~45자 이하, 전체 ~120자 이하. 격려+이번 주 한 줄 요약만, 존댓말","steps":[{"type":"join_meetup","meetupIndex":0,"line":"짧은 한 줄 권유"},{"type":"say_hi","dogIndex":0,"line":"짧은 한 줄"},{"type":"free_tip","line":"짧은 한 줄"}]}\n` +
          `규칙:\n` +
          `- 긴 문단·나열 금지. 카드 UI용 초짧은 카피만.\n` +
          `- steps의 line은 각 36자 이하, 행동 한 가지만.\n` +
          `- steps는 2~5개.\n` +
          `- type은 "join_meetup" | "say_hi" | "free_tip" 만.\n` +
          `- join_meetup은 candidateMeetups가 비어 있으면 쓰지 마. meetupIndex는 배열 길이 안의 정수만.\n` +
          `- say_hi는 candidateDogs가 비어 있으면 쓰지 마. dogIndex는 배열 길이 안의 정수만.\n` +
          `- 내가 올린 글이 있으면 비슷한 글만 또 쓰라고 하지 말고, 모임 참여·댕친 인사·산책/사회화 등 다음 행동을 제안해.\n` +
          `- 환각 금지: 인덱스·id를 새로 만들지 마.`;

        const raw = await llmChat(sys, userJson, 1000);
        const obj = extractJsonObject(raw);
        const intro = typeof obj?.intro === "string" ? obj.intro.trim().slice(0, 200) : "";
        const stepsRaw = Array.isArray(obj?.steps) ? obj.steps : [];

        const weeklyItems: Array<
          | { kind: "meetup"; meetupId: string; label: string; detail?: string }
          | { kind: "dog"; dogId: string; label: string; detail?: string }
          | { kind: "tip"; label: string; detail?: string }
        > = [];

        for (const s of stepsRaw.slice(0, 6)) {
          if (!s || typeof s !== "object") continue;
          const st = s as Record<string, unknown>;
          const line = String(st.line ?? "").trim().slice(0, 80);
          if (!line) continue;
          const typ = String(st.type ?? "");

          if (typ === "join_meetup" && meetups.length > 0) {
            const idx = typeof st.meetupIndex === "number" ? Math.floor(st.meetupIndex) : -1;
            if (idx >= 0 && idx < meetups.length) {
              const m = meetups[idx]!;
              weeklyItems.push({
                kind: "meetup",
                meetupId: m.id,
                label: line,
                detail: String(m.title ?? "").slice(0, 120),
              });
            }
          } else if (typ === "say_hi" && dogs.length > 0) {
            const idx = typeof st.dogIndex === "number" ? Math.floor(st.dogIndex) : -1;
            if (idx >= 0 && idx < dogs.length) {
              const d = dogs[idx]!;
              weeklyItems.push({
                kind: "dog",
                dogId: d.id,
                label: line,
                detail: `${d.name} · ${d.breed}`.slice(0, 80),
              });
            }
          } else if (typ === "free_tip") {
            weeklyItems.push({ kind: "tip", label: line });
          }
        }

        const textBody =
          intro +
          (weeklyItems.length
            ? "\n\n" + weeklyItems.map((w, n) => `${n + 1}. ${w.label}${w.detail ? ` (${w.detail})` : ""}`).join("\n")
            : "");

        return jsonResponse({
          ok: true,
          text: textBody || raw.slice(0, 2000),
          fields: {
            weeklyIntro: intro || undefined,
            weeklyItems: weeklyItems.length ? weeklyItems : undefined,
          },
        });
      }

      default:
        return jsonResponse({ ok: false, error: `알 수 없는 task: ${task}` }, 400);
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "NO_KEY") {
      return jsonResponse({
        ok: false,
        error:
          "GROQ_API_KEY 또는 GEMINI_API_KEY가 없습니다. Supabase → Edge Functions → Secrets에 하나 이상 등록하세요. (테스트는 Groq 키만 넣어도 됩니다)",
      });
    }
    const quotaLike =
      /Groq HTTP 429|Gemini HTTP 429/i.test(msg) ||
      /RESOURCE_EXHAUSTED|resource_exhausted|quota|rate limit|Too Many Requests|429/i.test(msg) ||
      /insufficient_quota|exceeded your current quota|billing_hard_cap/i.test(msg);
    if (quotaLike) {
      // HTTP 200으로 내려야 supabase-js invoke가 body를 data로 넘깁니다(비-2xx면 메시지가 흐려짐).
      const groqHit = /Groq|groq\.com/i.test(msg);
      const geminiHit = /Gemini|RESOURCE_EXHAUSTED|generativelanguage/i.test(msg);
      let errOut = "ai토큰? 이 떨어졌습니다 충전해 주세요";
      if (groqHit) {
        errOut = "Groq 무료 한도에 걸렸어요. 잠시 후 다시 시도하거나 console.groq.com 에서 확인해 주세요.";
      } else if (geminiHit) {
        errOut =
          "Gemini 무료 한도에 걸렸어요. 1~2분 뒤 다시 시도하거나 Google AI Studio에서 사용량을 확인해 주세요.";
      }
      return jsonResponse({ ok: false, error: errOut });
    }
    // HTTP 200 + ok:false → supabase-js가 body를 넘겨 alert에 원인이 보임(500이면 메시지가 잘림).
    return jsonResponse({ ok: false, error: msg.slice(0, 900) });
  }
});
