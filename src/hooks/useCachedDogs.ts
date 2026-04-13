import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type CachedDogRow = Record<string, unknown> & {
  id: string;
  owner_id?: string | null;
  owner_avatar_url?: string | null;
};

let globalDogsCache: CachedDogRow[] | null = null;
let globalCacheError: string | null = null;

/** 동시에 여러 컴포넌트가 붙어도 네트워크 1회만 */
let inflight: Promise<{ dogs: CachedDogRow[]; error: string | null }> | null = null;

const FETCH_LIMIT = 100;

function normalizeText(v: unknown): string {
  return typeof v === 'string' ? v.trim().toLowerCase() : '';
}

function dedupeDogs(rows: CachedDogRow[]): CachedDogRow[] {
  const bySignature = new Map<string, CachedDogRow>();
  for (const row of rows) {
    const id = normalizeText(row.id);
    const ownerId = normalizeText(row.owner_id);
    const name = normalizeText(row.name);
    const breed = normalizeText(row.breed);
    const gender = normalizeText(row.gender);
    const age = typeof row.age === 'number' || typeof row.age === 'string' ? String(row.age).trim() : '';
    const createdAt = normalizeText(row.created_at);

    // 1순위: 고유 id 기준 중복 제거
    const signatureById = `id:${id}`;
    if (id && bySignature.has(signatureById)) continue;
    if (id) {
      bySignature.set(signatureById, row);
      continue;
    }

    // 2순위: id가 비어 있거나 비정상일 때 프로필 시그니처로 중복 제거
    const profileSignature = `profile:${ownerId}|${name}|${breed}|${gender}|${age}`;
    const prev = bySignature.get(profileSignature);
    if (!prev) {
      bySignature.set(profileSignature, row);
      continue;
    }

    // 같은 시그니처면 created_at이 최신인 행을 유지
    const prevTs = Date.parse(normalizeText(prev.created_at));
    const nextTs = Date.parse(createdAt);
    if (!Number.isNaN(nextTs) && (Number.isNaN(prevTs) || nextTs > prevTs)) {
      bySignature.set(profileSignature, row);
    }
  }
  return [...bySignature.values()];
}

async function fetchMergedDogs(): Promise<{ dogs: CachedDogRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from('dog_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(FETCH_LIMIT);
  if (error) {
    return { dogs: [], error: error.message };
  }
  const rows = dedupeDogs((data || []) as CachedDogRow[]);
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

function getInflight(): Promise<{ dogs: CachedDogRow[]; error: string | null }> {
  if (!inflight) {
    inflight = fetchMergedDogs().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export type UseCachedDogsOptions = {
  enabled?: boolean;
  displayLimit?: number;
};

/**
 * 인메모리 전역 캐시 + 백그라운드 재검증(SWR 느낌).
 * 캐시가 있으면 즉시 표시(loading false) 후 조용히 네트워크로 갱신합니다.
 */
export function useCachedDogs(options?: UseCachedDogsOptions): {
  dogs: CachedDogRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const enabled = options?.enabled ?? true;
  const displayLimit = options?.displayLimit;

  const slice = useCallback(
    (rows: CachedDogRow[]) =>
      displayLimit != null && displayLimit > 0 ? rows.slice(0, displayLimit) : rows,
    [displayLimit],
  );

  const [dogs, setDogs] = useState<CachedDogRow[]>(() => (globalDogsCache ? slice(globalDogsCache) : []));
  const [loading, setLoading] = useState<boolean>(() => Boolean(enabled && !globalDogsCache));
  const [error, setError] = useState<string | null>(() => (globalDogsCache ? globalCacheError : null));

  useEffect(() => {
    if (!enabled) {
      setDogs([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const apply = (rows: CachedDogRow[], err: string | null) => {
      if (cancelled) return;
      globalDogsCache = rows;
      globalCacheError = err;
      setDogs(slice(rows));
      setError(err);
    };

    const run = async () => {
      if (globalDogsCache !== null) {
        setDogs(slice(globalDogsCache));
        setError(globalCacheError);
        setLoading(false);
        try {
          const r = await getInflight();
          if (cancelled) return;
          apply(r.dogs, r.error);
        } catch {
          if (!cancelled) setError('불러오기에 실패했습니다.');
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const r = await getInflight();
        if (cancelled) return;
        apply(r.dogs, r.error);
      } catch {
        if (!cancelled) {
          apply([], '불러오기에 실패했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, slice]);

  const refetch = useCallback(async () => {
    globalDogsCache = null;
    globalCacheError = null;
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetchMergedDogs();
      globalDogsCache = r.dogs;
      globalCacheError = r.error;
      setDogs(slice(r.dogs));
      setError(r.error);
    } catch {
      globalDogsCache = null;
      globalCacheError = '불러오기에 실패했습니다.';
      setDogs([]);
      setError('불러오기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [enabled, slice]);

  return { dogs, loading, error, refetch };
}
