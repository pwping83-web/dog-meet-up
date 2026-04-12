import { useState, type ReactNode } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { invokeDaengAiAssist, type DaengAiAssistResult, type DaengAiTask } from '../../lib/daengAiAssist';

type Props = {
  task: DaengAiTask;
  payload: Record<string, unknown>;
  onDone: (r: DaengAiAssistResult) => void;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  /** false면 비로그인도 호출 시도(Edge가 JWT 검사 시 실패할 수 있음) */
  requireAuth?: boolean;
};

export function AiDoumiButton({
  task,
  payload,
  onDone,
  children,
  className = '',
  disabled = false,
  requireAuth = true,
}: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (disabled || busy) return;
    if (requireAuth && !user) {
      onDone({ ok: false, error: '로그인 후 AI 도우미를 사용할 수 있어요.' });
      return;
    }
    setBusy(true);
    try {
      const r = await invokeDaengAiAssist(task, payload);
      onDone(r);
    } catch (e) {
      onDone({ ok: false, error: (e as Error)?.message ?? '알 수 없는 오류' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-3 py-2 text-xs font-extrabold text-violet-900 shadow-sm transition-all hover:from-violet-100 hover:to-fuchsia-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden /> : <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      <span>{children ?? 'AI 도우미'}</span>
    </button>
  );
}
