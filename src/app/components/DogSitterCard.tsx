import { Link } from 'react-router';
import { MapPin, Star, ShieldCheck } from 'lucide-react';
import { DogSitter } from '../types';

interface DogSitterCardProps {
  dogSitter: DogSitter;
}

export function DogSitterCard({ dogSitter }: DogSitterCardProps) {
  return (
    <Link
      to={`/sitter/${dogSitter.id}`}
      className="block bg-white border border-slate-100 rounded-3xl p-5 hover:shadow-md hover:border-orange-100 transition-all duration-200 active:scale-[0.98] w-full group"
      style={{ minWidth: '280px' }}
    >
      <div className="flex gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-yellow-50 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white">
          <span className="text-orange-600 text-xl" style={{ fontWeight: 800 }}>
            {dogSitter.name.charAt(0)}
          </span>
        </div>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="text-slate-800 break-words text-base group-hover:text-orange-600 transition-colors" style={{ fontWeight: 800 }}>
              {dogSitter.name}
            </h3>
            <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 whitespace-nowrap" style={{ fontWeight: 700 }}>
              <ShieldCheck className="w-3 h-3" />
              경력 {dogSitter.experience}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-sm bg-amber-50/50 px-2 py-0.5 rounded-lg border border-amber-100/50">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
              <span className="text-amber-600" style={{ fontWeight: 700 }}>{dogSitter.rating}</span>
              <span className="text-amber-600/60 text-xs" style={{ fontWeight: 500 }}>({dogSitter.reviewCount})</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-slate-400" style={{ fontWeight: 500 }}>
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{dogSitter.district}</span>
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