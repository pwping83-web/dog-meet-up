-- Solapi 커스텀 전화 OTP: 코드 저장 + 전화번호 계정 매핑
create extension if not exists pgcrypto;

create table if not exists public.phone_auth_otps (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempt_count integer not null default 0 check (attempt_count >= 0 and attempt_count <= 10),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_phone_auth_otps_lookup
  on public.phone_auth_otps (phone_e164, created_at desc);

create table if not exists public.phone_auth_accounts (
  phone_e164 text primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  login_email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.phone_auth_accounts_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_phone_auth_accounts_touch on public.phone_auth_accounts;
create trigger trg_phone_auth_accounts_touch
before update on public.phone_auth_accounts
for each row execute procedure public.phone_auth_accounts_touch_updated_at();

alter table public.phone_auth_otps enable row level security;
alter table public.phone_auth_accounts enable row level security;

-- 클라이언트 직접 접근 차단 (Edge service role 전용)
revoke all on public.phone_auth_otps from anon, authenticated;
revoke all on public.phone_auth_accounts from anon, authenticated;

grant select, insert, update, delete on public.phone_auth_otps to service_role;
grant select, insert, update, delete on public.phone_auth_accounts to service_role;
