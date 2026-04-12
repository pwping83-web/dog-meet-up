import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  ArrowLeft,
  BellRing,
  Camera,
  LocateFixed,
  X,
  Trash2,
  Home,
  CarFront,
  PawPrint,
  MapPin,
} from 'lucide-react';
import { RegionSelector } from '../components/RegionSelector';
import { useAuth } from '../../contexts/AuthContext';
import { useUserLocation } from '../../contexts/UserLocationContext';
import { setAuthReturnPath } from '../components/AuthReturnRedirect';
import { supabase } from '../../lib/supabase';
import { startStripeCheckout } from '../../lib/billing';
import { isPromoFreeListings } from '../../lib/promoFlags';
import { getBreedingLeakInNonBreedingPost } from '../utils/breedingContentGuard';
import type { Meetup } from '../types';
import type { User } from '@supabase/supabase-js';
import { appendUserMeetup } from '../../lib/userMeetupsStore';

const MOIJA_CATEGORIES = [
  { name: '공원·장소 모임', emoji: '🌳' },
  { name: '산책·놀이', emoji: '🐕' },
  { name: '카페·체험', emoji: '☕' },
  { name: '훈련·사회화', emoji: '🎓' },
] as const;

const MANNAJA_CATEGORIES = [
  { name: '1:1 만남', emoji: '💬' },
  { name: '교배', emoji: '💕' },
  { name: '실종', emoji: '🚨' },
] as const;

const moijaNames = MOIJA_CATEGORIES.map((c) => c.name);
const mannajaNames = MANNAJA_CATEGORIES.map((c) => c.name);

const BREEDING_DRAFT_KEY = 'daeng-breeding-draft';

function meetupAuthorDisplayName(u: User): string {
  const m = u.user_metadata ?? {};
  for (const key of ['nickname', 'name', 'full_name'] as const) {
    const v = m[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  const local = u.email?.split('@')[0]?.trim();
  if (local) return local.length > 12 ? `${local.slice(0, 12)}…` : local;
  return '댕댕이 집사';
}

type WriteKind = 'moija' | 'mannaja' | 'dolbom';

function parseKind(raw: string | null): WriteKind | null {
  if (raw === 'moija' || raw === 'mannaja' || raw === 'dolbom') return raw;
  return null;
}

export function CreateRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { applyGpsLocation, locationBasedEnabled } = useUserLocation();
  const kind = parseKind(searchParams.get('kind'));

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    city: '',
    district: '',
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  /** 맡기기 글: 보호맘이 주인 집까지 픽업해 주길 희망 */
  const [wantDaengPickup, setWantDaengPickup] = useState(false);
  const [breedingListingUntil, setBreedingListingUntil] = useState<string | null>(null);
  const [breedingEntLoadFailed, setBreedingEntLoadFailed] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [regionGpsBusy, setRegionGpsBusy] = useState(false);
  const draftRestoredRef = useRef(false);
  const breedingPaidHandledRef = useRef(false);

  useEffect(() => {
    if (kind !== 'dolbom') setWantDaengPickup(false);
  }, [kind]);

  useEffect(() => {
    if (kind !== 'mannaja') breedingPaidHandledRef.current = false;
  }, [kind]);

  useEffect(() => {
    if (!user || kind !== 'mannaja') {
      setBreedingListingUntil(null);
      setBreedingEntLoadFailed(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('breeding_listing_until')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setBreedingEntLoadFailed(true);
        setBreedingListingUntil(null);
      } else {
        setBreedingEntLoadFailed(false);
        setBreedingListingUntil(data?.breeding_listing_until ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, kind]);

  useEffect(() => {
    if (searchParams.get('paid') !== 'breeding' || !user || breedingPaidHandledRef.current) return;
    breedingPaidHandledRef.current = true;
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('user_entitlements')
        .select('breeding_listing_until')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!error) setBreedingListingUntil(data?.breeding_listing_until ?? null);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.delete('paid');
          return p;
        },
        { replace: true },
      );
      alert('결제가 완료되었어요. 작성 내용을 확인한 뒤 「올리기」를 눌러 주세요 💕');
    })();
    return () => {
      cancelled = true;
    };
  }, [user, searchParams, setSearchParams]);

  useEffect(() => {
    if (kind !== 'mannaja' || draftRestoredRef.current) return;
    try {
      const raw = sessionStorage.getItem(BREEDING_DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      if (d?.category !== '교배') return;
      setFormData((prev) => ({
        ...prev,
        category: '교배',
        title: typeof d.title === 'string' ? d.title : prev.title,
        description: typeof d.description === 'string' ? d.description : prev.description,
        city: typeof d.city === 'string' ? d.city : prev.city,
        district: typeof d.district === 'string' ? d.district : prev.district,
      }));
      draftRestoredRef.current = true;
    } catch {
      /* ignore */
    }
  }, [kind]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAuthReturnPath(`${location.pathname}${location.search}`);
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate, location.pathname, location.search]);

  /** kind URL과 폼 category 동기화 */
  useEffect(() => {
    if (kind === 'dolbom') {
      setFormData((prev) => (prev.category === '돌봄' ? prev : { ...prev, category: '돌봄' }));
    } else if (kind === 'moija') {
      setFormData((prev) => {
        if (moijaNames.includes(prev.category)) return prev;
        if (prev.category === '') return prev;
        return { ...prev, category: '' };
      });
    } else if (kind === 'mannaja') {
      setFormData((prev) => {
        if (mannajaNames.includes(prev.category)) return prev;
        if (prev.category === '') return prev;
        return { ...prev, category: '' };
      });
    }
  }, [kind]);

  const goPicker = () => {
    setSearchParams({}, { replace: true });
  };

  const pickKind = (k: WriteKind) => {
    setFormData((prev) => ({
      ...prev,
      category: k === 'dolbom' ? '돌봄' : '',
    }));
    setSearchParams({ kind: k }, { replace: true });
  };

  const applyGpsToFormRegion = useCallback(async () => {
    if (!locationBasedEnabled) {
      alert('내댕댕에서 「위치 기반」을 켜 주신 뒤 다시 시도해 주세요.');
      return;
    }
    setRegionGpsBusy(true);
    try {
      const snap = await applyGpsLocation();
      setFormData((prev) => ({
        ...prev,
        city: snap.city,
        district: snap.district,
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : '위치를 확인할 수 없어요.');
    } finally {
      setRegionGpsBusy(false);
    }
  }, [applyGpsLocation, locationBasedEnabled]);

  const renderCategoryGrid = (
    items: readonly { name: string; emoji: string }[],
    colsClass: string,
  ) => (
    <div className={`grid gap-2 ${colsClass}`}>
      {items.map((cat) => (
        <button
          key={cat.name}
          type="button"
          onClick={() => setFormData({ ...formData, category: cat.name })}
          className={`rounded-2xl py-4 text-center shadow-sm transition-all ${
            formData.category === cat.name
              ? 'scale-[1.02] bg-orange-500 text-white shadow-md shadow-orange-500/20'
              : 'border border-slate-100 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="mb-1 text-2xl">{cat.emoji}</div>
          <div
            className={`px-1 text-xs font-bold leading-tight ${
              formData.category === cat.name ? 'text-white' : 'text-slate-700'
            }`}
          >
            {cat.name}
          </div>
        </button>
      ))}
    </div>
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setPreviewImages([...previewImages, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setPreviewImages(previewImages.filter((_, i) => i !== index));
  };

  const categoryOk =
    kind === 'dolbom'
      ? formData.category === '돌봄'
      : kind === 'moija'
        ? moijaNames.includes(formData.category)
        : kind === 'mannaja'
          ? mannajaNames.includes(formData.category)
          : false;

  /** 교배 주제가 아닐 때 제목·본문에 교배·번식 표현이 있으면 올리기 차단 */
  const breedingLeakLabel = useMemo(() => {
    if (!kind) return null;
    if (kind === 'mannaja' && formData.category === '교배') return null;
    if (kind === 'moija' || kind === 'dolbom' || kind === 'mannaja') {
      return getBreedingLeakInNonBreedingPost(formData.title, formData.description);
    }
    return null;
  }, [kind, formData.category, formData.title, formData.description]);

  const breedingListingActive =
    isPromoFreeListings() ||
    (breedingListingUntil != null &&
      !Number.isNaN(Date.parse(breedingListingUntil)) &&
      new Date(breedingListingUntil) > new Date());

  const saveBreedingDraft = () => {
    try {
      sessionStorage.setItem(
        BREEDING_DRAFT_KEY,
        JSON.stringify({
          category: '교배',
          title: formData.title,
          description: formData.description,
          city: formData.city,
          district: formData.district,
        }),
      );
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !kind) return;
    if (!categoryOk) {
      alert(
        kind === 'dolbom'
          ? '돌봄·맡기기 글을 이어서 작성해 주세요 🦴'
          : '주제를 하나 골라 주세요 🐾',
      );
      return;
    }

    if (breedingLeakLabel) {
      alert(
        `다른 주제에는 ${breedingLeakLabel} 표현을 쓸 수 없어요.\n` +
          (isPromoFreeListings()
            ? '만나자 → 교배를 골라 작성해 주세요.'
            : '만나자 → 교배를 골라 작성·결제해 주세요.'),
      );
      return;
    }

    const isBreedingPost = kind === 'mannaja' && formData.category === '교배';

    if (isBreedingPost && !breedingListingActive) {
      setSubmitBusy(true);
      try {
        saveBreedingDraft();
        await startStripeCheckout('breeding_post_listing_7d', {
          successPath: '/create-meetup?kind=mannaja&paid=breeding',
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : '결제를 시작할 수 없습니다.');
      } finally {
        setSubmitBusy(false);
      }
      return;
    }

    if (!formData.city.trim() || !formData.district.trim()) {
      alert('시·구(동네)를 선택해 주세요.');
      return;
    }

    const locationLabel = `${formData.city.trim()} ${formData.district.trim()}`;
    const estimatedCostLabel =
      kind === 'dolbom'
        ? wantDaengPickup
          ? '돌봄·맡기기 · 댕댕 픽업 희망'
          : '돌봄·맡기기'
        : kind === 'moija'
          ? `모이자 · ${formData.category}`
          : `만나자 · ${formData.category}`;

    const newMeetup: Meetup = {
      id: `local-${crypto.randomUUID()}`,
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      location: locationLabel,
      district: formData.district.trim(),
      images: [...previewImages],
      estimatedCost: estimatedCostLabel,
      status: 'pending',
      createdAt: new Date(),
      userId: user.id,
      userName: meetupAuthorDisplayName(user),
    };

    if (
      formData.category === '교배' &&
      breedingListingUntil &&
      breedingListingActive &&
      !isPromoFreeListings()
    ) {
      newMeetup.listingVisibleUntil = breedingListingUntil;
    }

    appendUserMeetup(newMeetup);

    if (kind === 'dolbom') {
      const pickupNote = wantDaengPickup ? '\n댕댕 픽업 희망으로 함께 표시돼요.' : '';
      alert(
        `🦴 돌봄·맡기기 글이 올라갔어요!\n동네 댕친·인증 돌봄(방문·맡기기)에게도 보여요.${pickupNote}`,
      );
    } else if (isBreedingPost) {
      try {
        sessionStorage.removeItem(BREEDING_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      alert(
        isPromoFreeListings()
          ? '교배 글이 올라갔어요. 지금은 한시 무료로 피드에도 보여요. 1:1·실종은 무료예요.'
          : '교배 글이 올라갔어요. 결제한 7일 동안 피드에 보여요. 1:1·실종은 무료예요.',
      );
    } else {
      alert('🐾 모이자·만나자 글이 올라갔어요!\n동네 댕친들이 함께할 거예요');
    }
    navigate('/explore');
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm font-medium text-slate-500">
        {authLoading ? '잠시만요…' : '로그인 페이지로 이동 중…'}
      </div>
    );
  }

  /** ① 유형 선택 */
  if (!kind) {
    return (
      <div className="min-h-screen bg-white pb-24">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="-ml-2 rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="닫기"
            >
              <X className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">글 올리기</h1>
            <div className="w-6" />
          </div>
        </div>

        <div className="mx-auto max-w-screen-md px-4 py-8">
          <p className="mb-6 text-center text-sm font-semibold text-slate-500">
            어떤 글을 쓸지 먼저 골라 주세요
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => pickKind('moija')}
              className="rounded-3xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 text-left shadow-sm transition-all active:scale-[0.99]"
            >
              <p className="text-lg font-extrabold text-slate-900">모이자</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                공원·카페 등 장소·일정 정하고 여럿이 모이는 글
              </p>
            </button>
            <button
              type="button"
              onClick={() => pickKind('mannaja')}
              className="rounded-3xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 text-left shadow-sm transition-all active:scale-[0.99]"
            >
              <p className="text-lg font-extrabold text-slate-900">만나자</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                1:1 친구 찾기·교배·실종 같은 맞춤 글
              </p>
            </button>
            <button
              type="button"
              onClick={() => pickKind('dolbom')}
              className="rounded-3xl border-2 border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 text-left shadow-sm transition-all active:scale-[0.99]"
            >
              <p className="text-lg font-extrabold text-slate-900">돌봄 · 맡기기</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                맡기기(돌봄 집)·방문 돌봄(주인 집) 등이 필요할 때 올리는 글이에요
              </p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const headerTitle =
    kind === 'moija' ? '모이자 글' : kind === 'mannaja' ? '만나자 글' : '돌봄 · 맡기기';

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-md items-center justify-between px-4">
          <button
            type="button"
            onClick={goPicker}
            className="-ml-2 rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100"
            aria-label="유형 다시 고르기"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">{headerTitle}</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            {kind === 'dolbom' ? (
              <BellRing className="h-14 w-14 text-sky-600" strokeWidth={1.6} aria-hidden />
            ) : (
              <span className="text-5xl" aria-hidden>
                🐾
              </span>
            )}
          </div>
          {kind === 'moija' && (
            <>
              <h2 className="mb-2 text-xl font-extrabold text-slate-900">여럿이 모이는 글</h2>
              <p className="text-sm font-medium text-slate-500">
                공원·카페에서 몇 시에 모일지 정하고 올려 주세요
              </p>
            </>
          )}
          {kind === 'mannaja' && (
            <>
              <h2 className="mb-2 text-xl font-extrabold text-slate-900">맞춤 글</h2>
              <p className="text-sm font-medium text-slate-500">1:1 만남·교배·실종 중 골라 주세요</p>
            </>
          )}
          {kind === 'dolbom' && (
            <>
              <h2 className="mb-3 text-xl font-extrabold text-slate-900">필요한 돌봄을 적어 주세요</h2>
              <div className="space-y-2.5 text-left">
                <div className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/90 px-3 py-2.5">
                  <Home className="mt-0.5 h-6 w-6 shrink-0 text-sky-600" aria-hidden />
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">댕집사</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">이웃이 우리 집에 와서 돌봐 줘요.</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2.5">
                  <div className="mt-0.5 flex shrink-0 gap-0.5" aria-hidden>
                    <Home className="h-4 w-4 text-amber-600" />
                    <CarFront className="h-4 w-4 text-amber-600" />
                    <PawPrint className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">보호맘</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      맡기기 → 필요하면 픽업 → 끝나면 집으로. 보호맘 집 기준으로 서로 맞추면 돼요 ~~
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
                  <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-slate-500" aria-hidden />
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">맡길 동네</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      아래에서 시·구 골라 주세요. 출장지·부모님 집이면 그쪽으로요.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {kind === 'moija' && (
            <div>
              <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-orange-600">
                주제
              </p>
              {renderCategoryGrid(MOIJA_CATEGORIES, 'grid-cols-2')}
            </div>
          )}

          {kind === 'mannaja' && (
            <div>
              <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                주제
              </p>
              {renderCategoryGrid(MANNAJA_CATEGORIES, 'grid-cols-3')}
            </div>
          )}

          {kind === 'mannaja' && formData.category === '교배' && (
            <div className="rounded-2xl border border-pink-200 bg-pink-50/90 px-3 py-3 text-xs font-semibold leading-relaxed text-pink-950">
              <p className="font-extrabold">
                {isPromoFreeListings()
                  ? '교배 글 · 한시 무료(목록·피드)'
                  : '교배 글 · 유료 7일(목록·피드)'}
              </p>
              <p className="mt-1.5">
                견종·성별·나이, 상대 조건, 접종·건강, 연락 방법을 짧게 적어 주세요.
              </p>
              <p className="mt-1.5">
                {isPromoFreeListings() ? (
                  <>지금은 무료예요. 나중엔 유료로 바뀔 수 있어요. 1:1·실종 글은 무료예요.</>
                ) : (
                  <>
                    <strong className="font-extrabold">결제(또는 남은 노출)</strong>이 있어야 올라가요. 1:1·실종 글은
                    무료예요.
                  </>
                )}
              </p>
              {!isPromoFreeListings() && breedingListingActive && breedingListingUntil && (
                <p className="mt-2 font-bold text-pink-900">
                  이번 노출권 만료:{' '}
                  {format(new Date(breedingListingUntil), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                </p>
              )}
              {!breedingListingActive && (
                <p className="mt-2">
                  <Link to="/billing" className="font-extrabold text-pink-700 underline underline-offset-2">
                    인증 돌봄·결제
                  </Link>
                  에서 7일 노출을 살 수 있어요.
                </p>
              )}
              {breedingEntLoadFailed && (
                <p className="mt-2 text-[11px] font-medium text-amber-900">
                  노출 권한을 불러오지 못했어요. DB 마이그레이션(breeding_listing_until)을 확인해 주세요.
                </p>
              )}
            </div>
          )}

          {kind === 'dolbom' && (
            <div className="overflow-hidden rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-sky-50/40 p-4 shadow-sm ring-1 ring-sky-100/90">
              <div className="flex gap-3.5">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  aria-hidden
                >
                  <LocateFixed className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-[13px] font-medium leading-[1.65] tracking-tight text-slate-700">
                    이 글은{' '}
                    <span className="font-extrabold text-slate-900">홈·목록</span>에서{' '}
                    <span className="whitespace-nowrap rounded-md bg-sky-100 px-2 py-0.5 text-[12px] font-extrabold text-sky-900">
                      돌봄·맡기기
                    </span>
                    로 모여 보여요.
                  </p>
                  <p className="text-[13px] font-medium leading-[1.65] tracking-tight text-slate-700">
                    아래에서 고른{' '}
                    <span className="font-extrabold text-slate-900">시·구</span>가{' '}
                    이 글의 <span className="font-extrabold text-sky-800">맡길 지역</span>이에요.
                  </p>
                  <ul className="space-y-2.5 border-t border-sky-100 pt-3 text-left text-[12px] leading-[1.6] text-slate-600">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-200 text-[11px] font-black text-sky-900">
                        ①
                      </span>
                      <span>
                        지금 계신 곳이 곧 맡길 곳이면
                        <br />
                        <span className="font-semibold text-slate-800">「지금 위치로 찾기」</span>만 눌러 주세요.
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-200 text-[11px] font-black text-sky-900">
                        ②
                      </span>
                      <span>
                        맡길 동네가 다르면
                        <br />
                        <span className="font-semibold text-slate-800">「수기로 맡길 지역 선택」</span>에서 시·구를 골라
                        주세요.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {kind === 'dolbom' && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
              <input
                type="checkbox"
                checked={wantDaengPickup}
                onChange={(e) => setWantDaengPickup(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>
                <span className="block text-sm font-extrabold text-slate-900">댕댕 픽업 희망</span>
                <span className="mt-0.5 block text-xs font-medium leading-relaxed text-slate-600">
                  보호맘이 우리 집까지 와서 아이 모셔 가 주길 바랄 때 체크~~ 일정은 채팅으로 맞춰요.
                </span>
              </span>
            </label>
          )}

          <div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={
                kind === 'dolbom'
                  ? '예: 주말 부산 출장이라 부산에서 맡기기 구해요 / 집은 강남이에요 🦴'
                  : kind === 'mannaja' && formData.category === '교배'
                    ? '예: 포메 여아입니다 · 흰색 포메 남아 사진 보내주세요 💕'
                    : '예: 주말 오전 한강에서 산책 같이 해요 🐕'
              }
              className="w-full rounded-2xl border-2 border-slate-200 px-5 py-4 text-base font-medium transition-all placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <div>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={
                kind === 'dolbom'
                  ? '기간, 견종·체중, 산책·배변, 예방접종 여부와 함께 맡기는 장소(내 집 / 엄마 집 / 출장지 등)도 적어 주세요 🐶'
                  : kind === 'mannaja' && formData.category === '교배'
                    ? '견종·성별·나이, 건강·혈통·접종, 희망 상대 조건, 사진 교환 여부, 연락처(채팅·전화) 등 적어 주세요 🐶'
                    : '몇 시에 어디서 만날지, 견종·성향 등 자유롭게 적어 주세요 🐶'
              }
              rows={4}
              className="w-full resize-none rounded-2xl border-2 border-slate-200 px-5 py-4 text-base font-medium transition-all placeholder:text-slate-400 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <div>
            {previewImages.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`미리보기 ${index + 1}`}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {previewImages.length < 5 && (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 transition-all hover:border-orange-500 hover:bg-orange-50/30 hover:text-orange-600 active:scale-[0.98]">
                  <Camera className="mb-2 h-8 w-8" />
                  <span className="text-sm font-bold">사진 추가 ({previewImages.length}/5)</span>
                </div>
              </label>
            )}
          </div>

          <div className="space-y-2">
            <p className="px-1 text-xs font-extrabold uppercase tracking-wide text-slate-500">
              {kind === 'dolbom' ? '맡길 지역(시·구)' : '모이는 동네'}
            </p>
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div>
                <p className="mb-2 text-[11px] font-bold text-slate-600">
                  {kind === 'dolbom'
                    ? '① 지금 계신 곳(GPS)으로 시·구 맞추기'
                    : '① 현재 위치로 시·구 맞추기'}
                </p>
                <button
                  type="button"
                  disabled={regionGpsBusy}
                  onClick={() => void applyGpsToFormRegion()}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3 text-sm font-extrabold text-white shadow-md transition-opacity active:scale-[0.99] disabled:opacity-50"
                >
                  <LocateFixed className="h-5 w-5 shrink-0" aria-hidden />
                  {regionGpsBusy ? '위치 확인 중…' : '지금 위치로 찾기'}
                </button>
                {kind === 'dolbom' && (
                  <p className="mt-2 text-[10px] font-medium leading-relaxed text-slate-500">
                    ①과 같아요. 지금 위치 = 맡길 곳일 때만 쓰면 돼요.
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-[11px] font-bold text-slate-600">
                  {kind === 'dolbom' ? '② 수기로 맡길 지역 선택' : '② 직접 선택'}
                </p>
                <RegionSelector
                  selectedCity={formData.city}
                  selectedDistrict={formData.district}
                  onCityChange={(city) => setFormData({ ...formData, city })}
                  onDistrictChange={(district) => setFormData({ ...formData, district })}
                  placeholder={kind === 'dolbom' ? '맡길 지역(시·구)을 선택해 주세요' : undefined}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-center text-sm font-bold text-orange-950">
            🐾 가까운 동네 댕친에게 먼저 보여요
          </div>

          {breedingLeakLabel && (
            <div
              role="alert"
              className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-950"
            >
              이 주제에는 <span className="font-extrabold">{breedingLeakLabel}</span>를 쓸 수 없어요.{' '}
              <strong className="font-extrabold">만나자 → 교배</strong>에서 작성해 주세요.
            </div>
          )}

          <button
            type="submit"
            disabled={!categoryOk || submitBusy || Boolean(breedingLeakLabel)}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-5 text-lg font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-50"
          >
            {kind === 'dolbom'
              ? '돌봄 · 맡기기 🚀'
              : kind === 'mannaja' && formData.category === '교배' && !breedingListingActive
                ? '결제 후 올리기'
                : '올리기 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
