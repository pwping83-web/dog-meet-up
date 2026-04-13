import { Link } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Meetup } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { meetupCoverImageUrl, virtualDogPhotoForSeed } from '../../data/virtualDogPhotos';

export type MoijaMannajaTab = 'moija' | 'mannaja';

export type MoijaMannajaListProps = {
  topTab: MoijaMannajaTab;
  meetupCategoryChips: readonly string[];
  category: string;
  onCategoryChange: (cat: string) => void;
  filteredMeetups: Meetup[];
  getJoinCount: (meetupId: string) => number;
};

export function MoijaMannajaList({
  topTab,
  meetupCategoryChips,
  category,
  onCategoryChange,
  filteredMeetups,
  getJoinCount,
}: MoijaMannajaListProps) {
  return (
    <>
      <p className="mb-3 rounded-2xl border border-orange-100 bg-orange-50/80 px-3 py-2.5 text-xs font-semibold leading-relaxed text-orange-950">
        {topTab === 'moija' ? (
          <>
            <strong className="font-extrabold">모이자</strong>는 공원·카페 등 장소·일정 잡고 여럿이 모이는 글만 보여요.
          </>
        ) : (
          <>
            <strong className="font-extrabold">만나자</strong>는 1:1·교배·실종 글만 보여요. 교배글은 지금 무료 노출!
          </>
        )}
      </p>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {meetupCategoryChips.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition-all ${
              category === cat
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
            style={{ fontWeight: 700 }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredMeetups.map((meetup) => {
          const joinCount = getJoinCount(meetup.id);
          return (
            <Link
              key={meetup.id}
              to={`/meetup/${meetup.id}`}
              className="block overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all hover:border-orange-100 hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex gap-4 p-4">
                <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-yellow-100">
                  <ImageWithFallback
                    src={meetupCoverImageUrl(meetup)}
                    fallbackSrc={virtualDogPhotoForSeed(`sitters-moija-thumb-fallback-${meetup.id}`)}
                    alt={meetup.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 line-clamp-1 text-base text-slate-800" style={{ fontWeight: 800 }}>
                    {meetup.title}
                  </h3>
                  <p className="mb-2 line-clamp-2 text-sm text-slate-500" style={{ fontWeight: 500 }}>
                    {meetup.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400" style={{ fontWeight: 700 }}>
                      <span>{meetup.district}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(meetup.createdAt), { locale: ko })} 전</span>
                    </div>
                    {joinCount > 0 && (
                      <div className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-orange-600">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="text-xs" style={{ fontWeight: 700 }}>
                          {joinCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
