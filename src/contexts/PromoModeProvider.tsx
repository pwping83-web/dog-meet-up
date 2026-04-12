import { useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { setDbPromoOverride } from '../lib/promoFlags';

/** 마운트 시 `app_settings`를 읽어 프로모션 여부를 전역에 반영합니다. */
export function PromoModeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('is_promo_mode')
          .eq('id', 'app')
          .maybeSingle();
        if (cancelled) return;
        if (error || data == null) {
          setDbPromoOverride(null);
        } else {
          setDbPromoOverride(Boolean(data.is_promo_mode));
        }
      } catch {
        if (!cancelled) setDbPromoOverride(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return children;
}
