import { useMemo, useRef, useState } from 'react';
import { exploreDogCardImageFallbackChain, virtualDogPhotoForSeed } from '../data/virtualDogPhotos';

type ExploreDogCardImageProps = {
  dogId: string;
  /** `resolveExploreDogPhotoUrl` / `sanitizeDogProfileForPublicDisplay` 결과 */
  src: string;
  alt: string;
  className?: string;
};

/**
 * 탐색·우리 동네 댕친 카드: 1차 URL 실패 시 Unsplash CDN·Pixabay 시드 URL을 순서대로 시도합니다.
 * (`source.unsplash.com` 는 서비스 종료로 미사용)
 */
export function ExploreDogCardImage({ dogId, src, alt, className }: ExploreDogCardImageProps) {
  const chain = useMemo(() => {
    const rest = [...exploreDogCardImageFallbackChain(dogId)];
    const guaranteed = virtualDogPhotoForSeed(`explore-card-guaranteed-${dogId}`);
    const out: string[] = [];
    for (const u of [src, ...rest, guaranteed]) {
      if (u && !out.includes(u)) out.push(u);
    }
    return out.length > 0 ? out : [guaranteed];
  }, [dogId, src]);

  const [index, setIndex] = useState(0);
  const errorOnLast = useRef(false);
  const active = chain[Math.min(index, chain.length - 1)] ?? chain[0];

  return (
    <img
      key={`${dogId}-${index}`}
      src={active}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (errorOnLast.current) return;
        setIndex((i) => {
          if (i + 1 < chain.length) return i + 1;
          errorOnLast.current = true;
          return i;
        });
      }}
    />
  );
}
