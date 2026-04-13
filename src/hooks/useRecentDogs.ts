import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type RecentDogRow = Record<string, unknown> & {
  id: string;
  owner_id?: string | null;
  owner_avatar_url?: string | null;
};

type CacheEntry = { dogs: RecentDogRow[]; error: string | null };

let cached: CacheEntry | null = null;
let inflight: Promise<void> | null = null;

const FETCH_LIMIT = 100;

async function fetchMergedDogs(): Promise<CacheEntry> {
  const { data, error } = await supabase
    .from('dog_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(FETCH_LIMIT);
  if (error) {
    return { dogs: [], error: error.message };
  }
  const rows = (data || []) as RecentDogRow[];
  const ownerIds = [...new Set(rows.map((r) => r.owner_id).filter((id): id is string => Boolean(id)))];
  if (ownerIds.length === 0) {
    return { dogs: rows, error: null };
  }
  const { data: profs, error: profErr } = await supabase.from('profiles').select('id, avatar_url').in('id', ownerIds);
  if (profErr || !profs?.length) {
    return { dogs: rows, error: profErr?.message ?? null };
  }
  const avatarByUserId = Object.fromEntries(
    profs.map((p: { id: string; avatar_url: string | null }) => [p.id, p.avatar_url]),
  );
  const merged = rows.map((r) => ({
    ...r,
    owner_avatar_url: (avatarByUserId[r.owner_id as string] as string | null | undefined) ?? null,
  }));
  return { dogs: merged, error: null };
}

export type UseRecentDogsOptions = {
  /** false이면 요청·상태 유지 안 함 (탐색 탭만 강아지 목록 켤 때 등) */
  enabled?: boolean;
  /** 캐시 전체 중 앞에서만 쓸 때(랜딩 피드 등) */
  displayLimit?: number;
};

/**
 * dog_profiles + profiles.avatar_url 병합 결과를 메모리에 한 번 캐시합니다.
 * (SWR/React Query 없이 탭 이동 시 깜빡임 완화)
 */
export function useRecentDogs(options?: UseRecentDogsOptions): {
  dogs: RecentDogRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const enabled = options?.enabled ?? true;
  const displayLimit = options?.displayLimit;

  const slice = useCallback(
    (rows: RecentDogRow[]) =>
      displayLimit != null && displayLimit > 0 ? rows.slice(0, displayLimit) : rows,
    [displayLimit],
  );

  const [dogs, setDogs] = useState<RecentDogRow[]>(() => (cached ? slice(cached.dogs) : []));
  const [loading, setLoading] = useState<boolean>(() => enabled && !cached);
  const [error, setError] = useState<string | null>(() => (cached ? cached.error : null));

  const runFetch = useCallback(async () => {
    if (!enabled) {
      setDogs([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (cached) {
      setDogs(slice(cached.dogs));
      setError(cached.error);
      setLoading(false);
      return;
    }
    if (inflight) {
      setLoading(true);
      await inflight;
      if (cached) {
        setDogs(slice(cached.dogs));
        setError(cached.error);
      }
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    inflight = (async () => {
      try {
        cached = await fetchMergedDogs();
      } finally {
        inflight = null;
      }
    })();
    await inflight;
    if (cached) {
      setDogs(slice(cached.dogs));
      setError(cached.error);
    }
    setLoading(false);
  }, [enabled, slice]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  const refetch = useCallback(async () => {
    cached = null;
    await runFetch();
  }, [runFetch]);

  return { dogs, loading, error, refetch };
}
