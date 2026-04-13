import { Link } from 'react-router';
import { MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Meetup } from '../../types';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  displayPublicDolbomMeetupDescription,
  displayPublicDolbomMeetupTitle,
  meetupCoverImageUrl,
  virtualDogPhotoForSeed,
} from '../../data/virtualDogPhotos';

export type CareNeedListProps = {
  filteredCareNeedMeetups: Meetup[];
  getJoinCount: (meetupId: string) => number;
};

export function CareNeedList({ filteredCareNeedMeetups, getJoinCount }: CareNeedListProps) {
  return (
    <div className="space-y-3">
      {filteredCareNeedMeetups.map((meetup) => {
        const joinCount = getJoinCount(meetup.id);
        return (
          <Link
            key={meetup.id}
            to={`/meetup/${meetup.id}`}
            className="block overflow-hidden rounded-3xl border border-slate-100 bg-white transition-all hover:border-orange-100 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex gap-4 p-4">
              <div className="flex h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100">
                <ImageWithFallback
                  src={meetupCoverImageUrl(meetup)}
                  fallbackSrc={virtualDogPhotoForSeed(`sitters-dolbom-thumb-fallback-${meetup.id}`)}
                  alt={displayPublicDolbomMeetupTitle(meetup)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-600">돌봄 맡기기 글</p>
                <h3 className="mb-1 line-clamp-1 text-base text-slate-800" style={{ fontWeight: 800 }}>
                  {displayPublicDolbomMeetupTitle(meetup)}
                </h3>
                <p className="mb-2 line-clamp-2 text-sm text-slate-500" style={{ fontWeight: 500 }}>
                  {displayPublicDolbomMeetupDescription(meetup)}
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
      {filteredCareNeedMeetups.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-slate-700">맞는 돌봄 글이 없어요</p>
          <p className="mt-2 text-xs font-medium text-slate-500">
            검색어를 바꾸거나, 글 올리기에서 돌봄·맡기기 글을 올려 보세요.
          </p>
          <Link
            to="/create-meetup?kind=dolbom"
            className="mt-4 inline-block rounded-2xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white shadow-md shadow-orange-500/20 active:scale-[0.98]"
          >
            돌봄 글 올리기
          </Link>
        </div>
      )}
    </div>
  );
}
