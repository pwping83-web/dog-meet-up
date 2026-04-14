/** Supabase `auth.users` / `profiles.id` 형식(하이픈 UUID)인지 느슨하게 검사 */
export function isAuthUserUuid(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  const s = id.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
