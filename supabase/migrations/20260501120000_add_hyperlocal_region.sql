-- 하이퍼로컬 1단계: 지역 컬럼 + 복합 인덱스
-- - 목록 쿼리 WHERE 최우선 축: region_si, region_gu
-- - 초기 데이터 호환: district/location 기반 백필

alter table public.meetups
  add column if not exists region_si text,
  add column if not exists region_gu text;

alter table public.profiles
  add column if not exists region_si text,
  add column if not exists region_gu text;

-- 기존 데이터 백필
update public.meetups
set
  region_gu = coalesce(nullif(trim(region_gu), ''), nullif(trim(district), '')),
  region_si = coalesce(
    nullif(trim(region_si), ''),
    case
      when nullif(trim(location), '') is null then null
      else
        case split_part(trim(location), ' ', 1)
          when '서울특별시' then '서울'
          when '서울시' then '서울'
          when '경기도' then '경기'
          when '인천광역시' then '인천'
          when '부산광역시' then '부산'
          when '대구광역시' then '대구'
          when '광주광역시' then '광주'
          when '대전광역시' then '대전'
          when '울산광역시' then '울산'
          when '세종특별자치시' then '세종'
          else split_part(trim(location), ' ', 1)
        end
    end
  )
where coalesce(region_si, region_gu) is null
   or trim(coalesce(region_si, '')) = ''
   or trim(coalesce(region_gu, '')) = '';

-- 목록/피드(최신순) 복합 인덱스
create index if not exists idx_meetups_region_gu_created_at
  on public.meetups (region_gu, created_at desc);

create index if not exists idx_meetups_region_si_gu_created_at
  on public.meetups (region_si, region_gu, created_at desc);

create index if not exists idx_profiles_region_si_gu
  on public.profiles (region_si, region_gu);

create index if not exists idx_certified_guard_moms_region_gu_created_at
  on public.certified_guard_moms (region_gu, created_at desc);

create index if not exists idx_certified_guard_moms_region_si_gu_visible
  on public.certified_guard_moms (region_si, region_gu, listing_visible_until desc);

