import { supabase } from './supabase';

export type DaengAiTask =
  | 'meetup_draft'
  | 'guard_intro'
  | 'search_parse'
  | 'chat_reply'
  | 'mbti_expand'
  | 'join_summarize'
  | 'admin_ops_hint'
  | 'owner_weekly_plan';

export type DaengAiWeeklyItem =
  | { kind: 'meetup'; meetupId: string; label: string; detail?: string }
  | { kind: 'dog'; dogId: string; label: string; detail?: string }
  | { kind: 'tip'; label: string; detail?: string };

export type DaengAiFields = {
  title?: string;
  category?: string;
  description?: string;
  suggestedSearch?: string;
  chips?: string[];
  /** owner_weekly_plan */
  weeklyIntro?: string;
  weeklyItems?: DaengAiWeeklyItem[];
};

export type DaengAiAssistResult =
  | { ok: true; text: string; fields?: DaengAiFields }
  | { ok: false; error: string };

const OPENAI_STYLE_QUOTA_MESSAGE = 'ai토큰? 이 떨어졌습니다 충전해 주세요';
const GEMINI_STYLE_QUOTA_MESSAGE =
  'Gemini 무료 한도에 걸렸어요. 1~2분 뒤 다시 시도하거나 Google AI Studio에서 사용량을 확인해 주세요.';
const GROQ_STYLE_QUOTA_MESSAGE =
  'Groq 무료 한도에 걸렸어요. 잠시 후 다시 시도하거나 console.groq.com 에서 확인해 주세요.';

/** 한자 제거: CJK Unified Ideographs + Extension A + Compatibility Ideographs */
function stripHanChars(input: string): string {
  return input
    .replace(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** AI가 자주 내는 조사+「해」 붙여쓰기 보정. '이해' 등 단어는 건드리지 않음. */
function fixWeeklyParticleSpacing(input: string): string {
  const s = input
    .replace(/에해/g, '에 해')
    .replace(/와해/g, '와 해')
    .replace(/을해/g, '을 해')
    .replace(/를해/g, '를 해')
    .replace(/에서해/g, '에서 해')
    .replace(/으로해/g, '으로 해')
    .replace(/로해/g, '로 해')
    .replace(/은해/g, '은 해')
    .replace(/는해/g, '는 해')
    .replace(/(?<!이)가해/g, '가 해');
  return s.replace(/[ \t]{2,}/g, ' ').trim();
}

function sanitizeAiFields(fields?: DaengAiFields): DaengAiFields | undefined {
  if (!fields) return fields;
  const next: DaengAiFields = { ...fields };
  if (typeof next.title === 'string') next.title = stripHanChars(next.title);
  if (typeof next.category === 'string') next.category = stripHanChars(next.category);
  if (typeof next.description === 'string') next.description = stripHanChars(next.description);
  if (typeof next.suggestedSearch === 'string') next.suggestedSearch = stripHanChars(next.suggestedSearch);
  if (Array.isArray(next.chips)) {
    next.chips = next.chips.map((c) => stripHanChars(String(c)));
  }
  if (typeof next.weeklyIntro === 'string') {
    next.weeklyIntro = fixWeeklyParticleSpacing(stripHanChars(next.weeklyIntro));
  }
  if (Array.isArray(next.weeklyItems)) {
    next.weeklyItems = next.weeklyItems.map((item) => ({
      ...item,
      label: fixWeeklyParticleSpacing(stripHanChars(item.label)),
      detail:
        typeof item.detail === 'string' ? fixWeeklyParticleSpacing(stripHanChars(item.detail)) : item.detail,
    }));
  }
  return next;
}

function isLikelyModelQuotaMessage(text: string): boolean {
  const l = text.toLowerCase();
  return (
    l.includes("429") ||
    l.includes("quota") ||
    l.includes("insufficient_quota") ||
    l.includes("rate_limit") ||
    l.includes("rate limit") ||
    l.includes("billing_hard_cap") ||
    l.includes("exceeded your current quota") ||
    l.includes("resource_exhausted") ||
    l.includes("gemini http") ||
    l.includes("generativelanguage") ||
    l.includes("groq http") ||
    l.includes("groq.com")
  );
}

function quotaUserMessageForText(text: string): string {
  const l = text.toLowerCase();
  if (l.includes("groq") || l.includes("groq.com")) {
    return GROQ_STYLE_QUOTA_MESSAGE;
  }
  if (l.includes("gemini") || l.includes("resource_exhausted") || l.includes("generativelanguage")) {
    return GEMINI_STYLE_QUOTA_MESSAGE;
  }
  return OPENAI_STYLE_QUOTA_MESSAGE;
}

function explainEdgeInvokeFailure(raw: string): string {
  const m = raw.trim();
  const lower = m.toLowerCase();
  if (lower.includes('non-2xx')) {
    return (
      `${m}\n\n` +
      '【의미】Supabase Edge Function이 2xx가 아닌 HTTP 상태(404·401·500·503 등)로 응답했습니다.\n\n' +
      '【401 Unauthorized 인 경우】세션 JWT가 거절된 것입니다(함수 내부 검증 또는 게이트).\n' +
      '· 로그아웃 후 다시 로그인, 또는 시크릿 창에서 재시도\n' +
      '· 배포 사이트 환경변수의 VITE_SUPABASE_URL·VITE_SUPABASE_ANON_KEY가 이 프로젝트 것과 같은지 확인\n\n' +
      '【그 외】\n' +
      '1) Edge Functions 목록에 daeng-ai-assist 배포 여부\n' +
      '2) Secrets에 GROQ_API_KEY 또는 GEMINI_API_KEY\n' +
      '3) Edge Functions → Logs\n\n' +
      '배포: npx supabase functions deploy daeng-ai-assist --use-api'
    );
  }
  if (
    lower.includes('failed to send a request to the edge function') ||
    (lower.includes('edge function') && lower.includes('failed'))
  ) {
    return (
      `${m}\n\n` +
      '【조치】Supabase 프로젝트에 `daeng-ai-assist` 함수가 배포돼 있는지 확인하세요.\n' +
      '· CLI: `npx supabase functions deploy daeng-ai-assist`\n' +
      '· Dashboard → Edge Functions → Secrets에 `GROQ_API_KEY`(또는 `GEMINI_API_KEY`) 등록\n' +
      '· 로그인한 상태에서만 호출됩니다(함수에서 세션 검증).'
    );
  }
  return m;
}

export async function invokeDaengAiAssist(
  task: DaengAiTask,
  payload: Record<string, unknown>,
): Promise<DaengAiAssistResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, error: '로그인 후 AI 도우미를 사용할 수 있어요.' };
  }

  let { data: sessionData } = await supabase.auth.getSession();
  let session = sessionData.session;
  if (!session?.access_token) {
    return { ok: false, error: '세션을 찾을 수 없어요. 다시 로그인해 주세요.' };
  }

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (expiresAtMs < Date.now() + 120_000) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError || !refreshed.session?.access_token) {
      return {
        ok: false,
        error: '세션이 곧 만료됐거나 갱신에 실패했어요. 다시 로그인한 뒤 시도해 주세요.',
      };
    }
    session = refreshed.session;
  }

  const { data, error } = await supabase.functions.invoke('daeng-ai-assist', {
    body: { task, payload },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    const raw = `${error.message || ''} ${typeof data === 'string' ? data : JSON.stringify(data ?? '')}`;
    if (isLikelyModelQuotaMessage(raw)) {
      return { ok: false, error: quotaUserMessageForText(raw) };
    }
    return {
      ok: false,
      error: explainEdgeInvokeFailure(error.message || 'Edge Function 호출 실패'),
    };
  }

  const d = data as {
    ok?: boolean;
    text?: string;
    fields?: DaengAiFields;
    error?: string;
  };

  if (!d || typeof d.ok !== 'boolean') {
    return { ok: false, error: '응답 형식이 올바르지 않아요.' };
  }

  if (!d.ok) {
    const errText = stripHanChars(d.error || '');
    if (isLikelyModelQuotaMessage(errText)) {
      return { ok: false, error: quotaUserMessageForText(errText) };
    }
    return { ok: false, error: errText || 'AI 도우미 처리 실패' };
  }

  return {
    ok: true,
    text: typeof d.text === 'string' ? stripHanChars(d.text) : '',
    fields: sanitizeAiFields(d.fields),
  };
}
