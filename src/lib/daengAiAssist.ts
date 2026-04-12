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
  if (
    lower.includes('failed to send a request to the edge function') ||
    lower.includes('edge function') && lower.includes('failed')
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
