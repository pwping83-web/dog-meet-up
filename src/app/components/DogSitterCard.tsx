import { Link } from 'react-router';
import { MapPin, Star, ShieldCheck } from 'lucide-react';
import { formatDistrictWithDong } from '../data/regions';
import { resolveDogSitterPortraitUrl, virtualDogPhotoForSeed } from '../data/virtualDogPhotos';
import { DogSitter } from '../types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface DogSitterCardProps {
  dogSitter: DogSitter;
  distanceLabel?: string;
  distanceBadgeClassName?: string;
  showUltraNear?: boolean;
}

export function DogSitterCard({
  dogSitter,
  distanceLabel,
  distanceBadgeClassName,
  showUltraNear,
}: DogSitterCardProps) {
  const profilePhoto = resolveDogSitterPortraitUrl(dogSitter);

  return (
    <Link
      to={`/sitter/${dogSitter.id}`}
      className="block bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-md hover:border-orange-100 transition-all duration-200 active:scale-[0.98] w-full group"
      style={{ minWidth: '280px' }}
    >
      <div className="flex gap-4 mb-4">
        <div className="flex h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-white bg-gradient-to-br from-orange-100 to-yellow-50 shadow-inner">
          <ImageWithFallback
            src={profilePhoto}
            fallbackSrc={virtualDogPhotoForSeed(`mock-sitter-fallback-${dogSitter.id}`)}
            alt={dogSitter.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <h3 className="break-words text-base text-slate-800 transition-colors group-hover:text-orange-600" style={{ fontWeight: 800 }}>
                {dogSitter.name}
              </h3>
              <span className="flex items-center gap-0.5 whitespace-nowrap rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] text-orange-600" style={{ fontWeight: 700 }}>
                <ShieldCheck className="h-3 w-3" />
                경력 {dogSitter.experience}
              </span>
            </div>
            {distanceLabel ? (
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-extrabold shadow-sm ${
                    distanceBadgeClassName ?? 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {distanceLabel}
                </span>
                {showUltraNear ? (
                  <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-extrabold text-orange-600">
                    초근거리!
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-sm bg-amber-50/50 px-2 py-0.5 rounded-lg border border-amber-100/50">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span className="text-amber-600" style={{ fontWeight: 700 }}>{dogSitter.rating}</span>
              <span className="text-amber-600/60 text-xs" style={{ fontWeight: 500 }}>({dogSitter.reviewCount})</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-slate-400" style={{ fontWeight: 500 }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">
                {formatDistrictWithDong(dogSitter.district, dogSitter.dong)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4 line-clamp-2 break-words leading-relaxed" style={{ fontWeight: 500 }}>
        {dogSitter.description}
      </p>

      <div className="flex flex-wrap gap-2">
        {dogSitter.specialties.map((specialty) => (
          <span
            key={specialty}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-100 text-slate-500 rounded-xl whitespace-nowrap group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-100 transition-colors"
            style={{ fontWeight: 700 }}
          >
            {specialty}
          </span>
        ))}
      </div>
    </Link>
  );
}

// Backward compatibility
export { DogSitterCard as RepairerCard };