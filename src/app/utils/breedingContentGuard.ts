/**
 * 무료·다른 주제 글에 교배·번식 성격 표현이 섞이는 것을 막기 위한 자동 검사.
 * (서버 LLM 없이 규칙·패턴으로 동작 — 운영에서 API로 교체 가능)
 */

/** 공백·제로폭 등 제거해 '교 배' → '교배' 우회를 줄임 */
export function compactForBreedingScan(text: string): string {
  return text.replace(/[\s\u200b-\u200d\ufeff\u00a0·ㆍ]+/g, '');
}

type Pattern = { re: RegExp; label: string };

const PATTERNS: Pattern[] = [
  { re: /교\s*배/, label: '「교배」' },
  { re: /번\s*식/, label: '「번식」' },
  { re: /임\s*신/, label: '「임신」' },
  { re: /발\s*정\s*기?/, label: '「발정·발정기」' },
  { re: /씨\s*놓/, label: '「씨 놓기」' },
  { re: /교\s*미/, label: '「교미」' },
  { re: /짝\s*(짓|맞추)/, label: '「짝짓기·짝맞추기」' },
];

const COMPACT_SUBSTRINGS: { s: string; label: string }[] = [
  { s: '교배', label: '「교배」' },
  { s: '번식', label: '「번식」' },
  { s: '혈통서', label: '「혈통서」' },
  { s: '혈통인증', label: '「혈통인증」' },
  { s: '임신', label: '「임신」' },
  { s: '발정기', label: '「발정기」' },
  { s: '발정', label: '「발정」' },
  { s: '씨놓', label: '「씨 놓기」' },
  { s: '교미', label: '「교미」' },
  { s: '짝짓기', label: '「짝짓기」' },
  { s: '짝맞추', label: '「짝맞추기」' },
];

/**
 * 주제가 「교배」가 아닌 글에 부적합한 표현이 있으면 첫 매칭 라벨 반환.
 * title·description 합쳐서 검사.
 */
export function getBreedingLeakInNonBreedingPost(title: string, description: string): string | null {
  const combined = `${title}\n${description}`;
  if (!combined.trim()) return null;

  for (const { re, label } of PATTERNS) {
    re.lastIndex = 0;
    if (re.test(combined)) return label;
  }

  const c = compactForBreedingScan(combined);
  for (const { s, label } of COMPACT_SUBSTRINGS) {
    if (c.includes(s)) return label;
  }

  return null;
}

/** 상세·신고용: 글이 교배 주제가 아닌데 번식 성격으로 보이는지 */
export function shouldSuggestBreedingMislabelReport(
  category: string,
  title: string,
  description: string,
): boolean {
  if (category === '교배') return false;
  return getBreedingLeakInNonBreedingPost(title, description) != null;
}
