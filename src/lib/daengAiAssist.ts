import { supabase } from './supabase';

export type DaengAiTask =
  | 'meetup_draft'
  | 'guard_intro'
  | 'search_parse'
  | 'chat_reply'
  | 'mbti_expand'
  | 'join_summarize'
  | 'admin_ops_hint';

export type DaengAiFields = {
  title?: string;
  category?: string;
  description?: string;
  suggestedSearch?: string;
  chips?: string[];
};

export type DaengAiAssistResult =
  | { ok: true; text: string; fields?: DaengAiFields }
  | { ok: false; error: string };

function explainEdgeInvokeFailure(raw: string): string {
  const m = raw.trim();
  const lower = m.toLowerCase();
  if (lower.includes('non-2xx')) {
    return (
      `${m}\n\n` +
      '【의미】Supabase Edge Function이 2xx가 아닌 HTTP 상태(404·401·500·503 등)로 응답했습니다. CORS만 고쳐서는 안 될 수 있어요.\n\n' +
      '【확인 순서】\n' +
      '1) Dashboard → Edge Functions → 목록에 daeng-ai-assist 가 있는지 (없으면 미배포)\n' +
      '2) Edge Functions Secrets에 OPENAI_API_KEY 등록 여부\n' +
      '3) Edge Functions → Logs에서 방금 요청의 status·메시지 확인\n' +
      '4) 앱에서 로그아웃 후 다시 로그인(JWT 문제 시 401)\n\n' +
      '배포: npx supabase functions deploy daeng-ai-assist --use-api (또는 GitHub Actions).'
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
      '· Dashboard → Edge Functions → Secrets에 `OPENAI_API_KEY` 등록\n' +
      '· 로그인한 상태에서만 호출됩니다(`verify_jwt = true`).'
    );
  }
  return m;
}

export async function invokeDaengAiAssist(
  task: DaengAiTask,
  payload: Record<string, unknown>,
): Promise<DaengAiAssistResult> {
  const { data, error } = await supabase.functions.invoke('daeng-ai-assist', {
    body: { task, payload },
  });

  if (error) {
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
    return { ok: false, error: d.error || 'AI 도우미 처리 실패' };
  }

  return { ok: true, text: typeof d.text === 'string' ? d.text : '', fields: d.fields };
}
