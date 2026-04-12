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

export async function invokeDaengAiAssist(
  task: DaengAiTask,
  payload: Record<string, unknown>,
): Promise<DaengAiAssistResult> {
  const { data, error } = await supabase.functions.invoke('daeng-ai-assist', {
    body: { task, payload },
  });

  if (error) {
    return { ok: false, error: error.message || 'Edge Function 호출 실패' };
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
