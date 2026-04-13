import { mockMeetups } from '../app/data/mockData';
import { supabase } from './supabase';
import { getMergedMeetups, readUserMeetups } from './userMeetupsStore';

export type OwnerWeeklyDogBrief = { id: string; name: string; breed: string; gender: string; age: string | number | null };

export type OwnerWeeklyMeetupBrief = {
  id: string;
  title: string;
  category: string;
  district: string;
  estimatedCost?: string;
};

/** Edge `owner_weekly_plan` + 프론트 검증용 동일 구조 */
export type OwnerWeeklyAiPayload = {
  today: string;
  userDistrict: string;
  myDogs: OwnerWeeklyDogBrief[];
  myPosts: OwnerWeeklyMeetupBrief[];
  candidateMeetups: OwnerWeeklyMeetupBrief[];
  candidateDogs: OwnerWeeklyDogBrief[];
};

function normBreed(b: string): string {
  return b.replace(/\s+/g, '').toLowerCase();
}

function pickCandidateDogs(
  rows: Array<{ id: string; name: string; breed: string; gender: string; age: number | null }>,
  my: OwnerWeeklyDogBrief[],
  limit: number,
): OwnerWeeklyDogBrief[] {
  if (rows.length === 0 || my.length === 0) {
    return rows.slice(0, limit).map((r) => ({
      id: r.id,
      name: r.name,
      breed: r.breed,
      gender: r.gender,
      age: r.age,
    }));
  }
  const primary = my[0]!;
  const myBreed = normBreed(primary.breed);
  const wantOpposite =
    primary.gender === '여아' ? '남아' : primary.gender === '남아' ? '여아' : '';

  const breedMatch = (a: string, b: string): boolean => {
    const x = normBreed(a);
    const y = normBreed(b);
    if (!x || !y) return false;
    return x.includes(y) || y.includes(x);
  };

  const scored = rows.map((r) => {
    let score = 0;
    if (breedMatch(primary.breed, r.breed)) score += 50;
    if (wantOpposite && r.gender === wantOpposite) score += 30;
    if (myBreed && normBreed(r.breed) === myBreed) score += 20;
    return { r, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ r }) => ({
    id: r.id,
    name: r.name,
    breed: r.breed,
    gender: r.gender,
    age: r.age,
  }));
}

export async function buildOwnerWeeklyAiPayload(
  userId: string,
  userDistrict: string,
): Promise<{ ok: true; payload: OwnerWeeklyAiPayload } | { ok: false; error: string }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: dogRows, error: dogErr } = await supabase
    .from('dog_profiles')
    .select('id, name, breed, gender, age')
    .eq('owner_id', userId);

  if (dogErr) {
    return { ok: false, error: `강아지 프로필을 불러오지 못했어요: ${dogErr.message}` };
  }

  const myDogs: OwnerWeeklyDogBrief[] = (dogRows ?? []).map((r) => ({
    id: r.id,
    name: typeof r.name === 'string' ? r.name : '',
    breed: typeof r.breed === 'string' ? r.breed : '',
    gender: r.gender === '여아' ? '여아' : '남아',
    age: r.age ?? null,
  }));

  const myPostsRaw = readUserMeetups().filter((m) => m.userId === userId);
  const myPosts: OwnerWeeklyMeetupBrief[] = myPostsRaw.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    district: m.district,
    estimatedCost: m.estimatedCost,
  }));

  const merged = getMergedMeetups(mockMeetups);
  const districtNeedle = userDistrict.replace(/구$/, '').trim();
  const others = merged.filter((m) => m.userId !== userId && m.category !== '돌봄');
  const sorted = [...others].sort((a, b) => {
    const aNear = districtNeedle && a.district.includes(districtNeedle) ? 1 : 0;
    const bNear = districtNeedle && b.district.includes(districtNeedle) ? 1 : 0;
    if (bNear !== aNear) return bNear - aNear;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const candidateMeetups: OwnerWeeklyMeetupBrief[] = sorted.slice(0, 18).map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    district: m.district,
    estimatedCost: m.estimatedCost,
  }));

  const { data: otherDogs, error: odErr } = await supabase
    .from('dog_profiles')
    .select('id, name, breed, gender, age')
    .neq('owner_id', userId)
    .order('created_at', { ascending: false })
    .limit(80);

  if (odErr) {
    return { ok: false, error: `다른 댕친 프로필을 불러오지 못했어요: ${odErr.message}` };
  }

  const candidateDogs = pickCandidateDogs(
    (otherDogs ?? []) as Array<{
      id: string;
      name: string;
      breed: string;
      gender: string;
      age: number | null;
    }>,
    myDogs,
    14,
  );

  return {
    ok: true,
    payload: {
      today,
      userDistrict: userDistrict || '(미설정)',
      myDogs,
      myPosts,
      candidateMeetups,
      candidateDogs,
    },
  };
}
