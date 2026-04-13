import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** 카카오·기타 OAuth가 넣는 메타 키가 제각각이라 순서대로 시도 */
export function displayNameFromUser(user: User): string {
  const m = user.user_metadata ?? {};
  const candidates = [
    m.nickname,
    m.name,
    m.full_name,
    m.preferred_username,
    m.user_name,
    m.display_name,
  ];
  for (const v of candidates) {
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 80);
  }
  const fromEmail = user.email?.split('@')[0]?.trim();
  if (fromEmail) return fromEmail.slice(0, 80);
  return '댕댕이';
}

/**
 * `auth.users`와 별도의 `public.profiles` 행을 맞춥니다.
 * DB에 `on_auth_user_created` 트리거가 없거나 실패해도 로그인 직후 앱이 동작하도록 보강합니다.
 */
export async function ensurePublicProfile(user: User | null): Promise<void> {
  if (!user) return;
  const { data: existing, error: existingError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('id', user.id)
    .maybeSingle();

  if (existingError) {
    console.warn('[댕댕마켓] profiles 조회 실패:', existingError.message);
    return;
  }

  // 사용자가 프로필 수정에서 저장한 닉네임은 로그인 시 덮어쓰지 않습니다.
  if (existing?.name && existing.name.trim().length > 0) return;

  const name = displayNameFromUser(user);
  const { error } = await supabase.from('profiles').upsert({ id: user.id, name }, { onConflict: 'id' });
  if (error) {
    console.warn('[댕댕마켓] profiles 초기 동기화 실패(대시보드에 profiles 테이블·RLS 확인):', error.message);
  }
}
