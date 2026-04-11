import { Link } from 'react-router';
import { MapPin, Clock, Users, Zap, ChevronRight } from 'lucide-react';
import { Meetup } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface MeetupCardProps {
  meetup: Meetup;
  joinCount?: number;
  userDistrict?: string;
}

export function MeetupCard({ meetup, joinCount = 0, userDistrict }: MeetupCardProps) {
  const timeAgo = formatDistanceToNow(meetup.createdAt, {
    addSuffix: true,
    locale: ko,
  });

  const statusText = {
    pending: '모집중',
    'in-progress': '모임 진행중',
    completed: '모임 완료',
  };

  const statusColor = {
    pending: 'bg-orange-50 text-orange-600',
    'in-progress': 'bg-emerald-50 text-emerald-600',
    completed: 'bg-slate-50 text-slate-500',
  }[meetup.status];

  return (
    <Link
      to={`/meetup/${meetup.id}`}
      className="block bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-md hover:border-orange-100 transition-all duration-200 active:scale-[0.98] w-full group"
      style={{ minWidth: '280px' }}
    >
      {/* 이미지 영역 */}
      {meetup.images && meetup.images.length > 0 ? (
        <div className="relative aspect-[4/3] bg-slate-100 max-h-48 overflow-hidden">
          <img
            src={meetup.images[0]}
            alt={meetup.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className={`text-xs px-2.5 py-1 rounded-lg backdrop-blur-md bg-white/90 shadow-sm ${meetup.status === 'pending' ? 'text-orange-600' : meetup.status === 'in-progress' ? 'text-emerald-600' : 'text-slate-600'}`} style={{ fontWeight: 700 }}>
              {statusText[meetup.status]}
            </span>
          </div>
          {userDistrict && meetup.district !== userDistrict && (
            <div className="absolute top-3 right-3">
              <div className="bg-black/40 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm" style={{ fontWeight: 700 }}>
                <MapPin className="w-3 h-3" />
                {meetup.district}
              </div>
            </div>
          )}
          {userDistrict && meetup.district === userDistrict && (
            <div className="absolute top-3 right-3">
              <div className="bg-orange-600/90 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm" style={{ fontWeight: 700 }}>
                <Zap className="w-3 h-3 fill-white" />
                우리 동네
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden" />
      )}

      <div className="p-5">
        <div className="flex items-start justify-between mb-2 gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {(!meetup.images || meetup.images.length === 0) && (
                <span className={`text-[10px] px-2 py-1 rounded-md whitespace-nowrap ${statusColor}`} style={{ fontWeight: 700 }}>
                  {statusText[meetup.status]}
                </span>
              )}
              <span className="text-xs text-slate-400 whitespace-nowrap" style={{ fontWeight: 700 }}>{meetup.category}</span>
            </div>
            <h3 className="text-slate-800 mb-1.5 break-words text-base leading-tight group-hover:text-orange-600 transition-colors" style={{ fontWeight: 800 }}>
              {meetup.title}
            </h3>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-4 line-clamp-2 break-words leading-relaxed" style={{ fontWeight: 500 }}>
          {meetup.description}
        </p>

        {meetup.status === 'pending' && joinCount > 0 && (
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl px-4 py-3 mb-4 group-hover:bg-orange-50 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-white p-1.5 rounded-xl shadow-sm border border-orange-50">
                  <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                </div>
                <span className="text-sm text-orange-900 break-words tracking-tight" style={{ fontWeight: 700 }}>
                  {joinCount}명이 참여 신청했어요
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-300 flex-shrink-0" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap" style={{ fontWeight: 500 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{meetup.district}</span>
            </div>
            <div className="flex items-center gap-1 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{timeAgo}</span>
            </div>
          </div>
          {meetup.estimatedCost && (
            <span className="text-orange-600 whitespace-nowrap text-sm bg-orange-50 px-2.5 py-1 rounded-lg" style={{ fontWeight: 800 }}>
              {meetup.estimatedCost}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Backward compatibility
export { MeetupCard as RepairRequestCard };