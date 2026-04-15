export function compactMeetupEstimatedCostLabel(category?: string | null, estimatedCost?: string | null): string {
  const raw = (estimatedCost ?? '').trim();
  if (!raw) return '';

  const cat = (category ?? '').trim();
  const isCare = cat === '돌봄' || raw.includes('돌봄') || raw.includes('픽업') || raw.includes('희망');
  if (!isCare) return raw;

  const hasSitter = raw.includes('댕집사 희망');
  const hasGuard = raw.includes('보호맘 희망');
  const hasBoth = raw.includes('모두 가능') || (hasSitter && hasGuard);
  const hasPickup = raw.includes('픽업');

  const target = hasBoth ? '모두 가능' : hasSitter ? '댕집사 희망' : hasGuard ? '보호맘 희망' : '';
  if (target && hasPickup) return `돌봄 · ${target} · 픽업`;
  if (target) return `돌봄 · ${target}`;
  if (hasPickup) return '돌봄 · 픽업';
  return '돌봄';
}

