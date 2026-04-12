import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

async function openaiChat(system: string, user: string, maxTokens: number): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY")?.trim();
  if (!key) throw new Error("NO_KEY");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.55,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI HTTP ${res.status}: ${t.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("빈 응답");
  return text.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "POST only" }, 405);
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
        const raw = await openaiChat(sys, user, 700);
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
        const text = await openaiChat(sys, user, 900);
        return jsonResponse({ ok: true, text });
      }

      case "search_parse": {
        const q = String(payload.query ?? "").slice(0, 200);
        const sys =
          '반드시 JSON만: {"suggestedSearch":"검색창에 넣을 한 줄","chips":["칩1","칩2"]} chips는 0~4개 한국어.';
        const raw = await openaiChat(sys, `사용자 입력: ${q}`, 300);
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
        const text = await openaiChat(sys, user, 350);
        return jsonResponse({ ok: true, text });
      }

      case "mbti_expand": {
        const name = String(payload.name ?? "").slice(0, 80);
        const typeKey = String(payload.typeKey ?? "").slice(0, 40);
        const desc = String(payload.description ?? "").slice(0, 500);
        const sys =
          "강아지 성향(MBTI 유사) 결과에 대한 부드러운 해설을 한국어로 5~10문장. 과학적 단정 금지, '참고로' 톤.";
        const user = `유형 키: ${typeKey}\n이름: ${name}\n기본 설명: ${desc}`;
        const text = await openaiChat(sys, user, 600);
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
        const text = await openaiChat(sys, user, 700);
        return jsonResponse({ ok: true, text });
      }

      case "admin_ops_hint": {
        const sys =
          "반려견 돌봄 플랫폼 운영자에게 짧은 체크리스트(한국어). 인증·RLS·결제·CS. 6~12줄 불릿, 기술명은 짧게.";
        const user = String(payload.topic ?? "guard_mom_certify_listing").slice(0, 200);
        const text = await openaiChat(sys, `주제 키: ${user}`, 500);
        return jsonResponse({ ok: true, text });
      }

      default:
        return jsonResponse({ ok: false, error: `알 수 없는 task: ${task}` }, 400);
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "NO_KEY") {
      return jsonResponse(
        {
          ok: false,
          error:
            "OPENAI_API_KEY가 없습니다. Supabase Dashboard → Project Settings → Edge Functions → Secrets에 OPENAI_API_KEY를 등록하세요.",
        },
        503,
      );
    }
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
