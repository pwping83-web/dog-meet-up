import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Camera, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { dogMbtiResults, DogMbtiType } from '../data/dogMbtiData';

const CREATE_DOG_DRAFT_KEY = 'daeng-create-dog-draft-v1';
const DRAFT_VERSION = 1;

type DogFormDraft = {
  v: number;
  name: string;
  breed: string;
  age: string;
  gender: string;
  /** JPEG data URL — 다시 등록 화면으로 올 때 복원 */
  photoDataUrl: string | null;
  /** 이미 Storage에 올린 사진 URL(미리보기 복원용) */
  photoPublicUrl: string | null;
};

function draftHasMeaningfulFields(d: DogFormDraft): boolean {
  if (d.photoDataUrl) return true;
  if (d.photoPublicUrl?.trim()) return true;
  return Boolean(d.name.trim() || d.breed.trim() || d.age.trim());
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const header = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const mimeMatch = /data:([^;]+)/.exec(header);
  const mime = mimeMatch?.[1] || 'image/jpeg';
  const bin = atob(b64.replace(/\s/g, ''));
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

/** sessionStorage 용량 초과를 줄이기 위해 가로 최대 px로 JPEG data URL 생성 */
function fileToResizedJpegDataUrl(file: File, maxW = 960, quality = 0.86): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxW) {
        height = (height * maxW) / width;
        width = maxW;
      }
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(width));
      c.height = Math.max(1, Math.round(height));
      const ctx = c.getContext('2d');
      if (!ctx) {
        reject(new Error('canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image-load'));
    };
    img.src = url;
  });
}

function readDraft(): DogFormDraft | null {
  try {
    const raw = localStorage.getItem(CREATE_DOG_DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<DogFormDraft>;
    if (d.v !== DRAFT_VERSION) return null;
    const draft: DogFormDraft = {
      v: DRAFT_VERSION,
      name: typeof d.name === 'string' ? d.name : '',
      breed: typeof d.breed === 'string' ? d.breed : '',
      age: typeof d.age === 'string' ? d.age : '',
      gender: typeof d.gender === 'string' && d.gender ? d.gender : '남아',
      photoDataUrl: typeof d.photoDataUrl === 'string' && d.photoDataUrl.startsWith('data:') ? d.photoDataUrl : null,
      photoPublicUrl:
        typeof d.photoPublicUrl === 'string' && /^https?:\/\//i.test(d.photoPublicUrl.trim())
          ? d.photoPublicUrl.trim()
          : null,
    };
    if (!draftHasMeaningfulFields(draft)) return null;
    return draft;
  } catch {
    return null;
  }
}

function writeDraft(draft: DogFormDraft) {
  try {
    localStorage.setItem(CREATE_DOG_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn('[댕댕이 등록] 초안 저장 실패(용량 초과 등):', e);
    try {
      localStorage.setItem(
        CREATE_DOG_DRAFT_KEY,
        JSON.stringify({ ...draft, photoDataUrl: null, photoPublicUrl: null }),
      );
    } catch {
      /* ignore */
    }
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(CREATE_DOG_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

export function DogCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mbtiType, setMbtiType] = useState<DogMbtiType | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    gender: '남아',
  });

  // MBTI 결과 로드
  useEffect(() => {
    const savedMbti = localStorage.getItem('dogMbtiType') as DogMbtiType | null;
    if (savedMbti) {
      setMbtiType(savedMbti);
    }
  }, []);

  // 초안(localStorage) 또는 DB 최근 등록 행으로 복원 — 빈 초안만 있으면 무시
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const d = readDraft();
      if (d && draftHasMeaningfulFields(d)) {
        if (!cancelled) {
          setFormData({
            name: d.name,
            breed: d.breed,
            age: d.age,
            gender: d.gender,
          });
          if (d.photoDataUrl) {
            setPreviewUrl(d.photoDataUrl);
            setImageFile(null);
          } else if (d.photoPublicUrl) {
            setPreviewUrl(d.photoPublicUrl);
            setImageFile(null);
          }
        }
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !cancelled) {
          const { data: row } = await supabase
            .from('dog_profiles')
            .select('name, breed, age, gender, photo_url')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (row && !cancelled) {
            setFormData({
              name: typeof row.name === 'string' ? row.name : '',
              breed: typeof row.breed === 'string' ? row.breed : '',
              age: row.age != null && Number.isFinite(Number(row.age)) ? String(row.age) : '',
              gender: row.gender === '여아' ? '여아' : '남아',
            });
            const pu = typeof row.photo_url === 'string' ? row.photo_url.trim() : '';
            if (pu) {
              setPreviewUrl(pu);
              setImageFile(null);
            }
          }
        }
      }
      if (!cancelled) setDraftHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistDraft = useCallback(() => {
    if (!draftHydrated) return;
    const photoDataUrl = previewUrl?.startsWith('data:') ? previewUrl : null;
    const photoPublicUrl =
      previewUrl && /^https?:\/\//i.test(previewUrl.trim()) ? previewUrl.trim() : null;
    const { name, breed, age, gender } = formData;
    if (!name.trim() && !breed.trim() && !age.trim() && !photoDataUrl && !photoPublicUrl) {
      clearDraft();
      return;
    }
    writeDraft({
      v: DRAFT_VERSION,
      name,
      breed,
      age,
      gender,
      photoDataUrl,
      photoPublicUrl,
    });
  }, [draftHydrated, formData.name, formData.breed, formData.age, formData.gender, previewUrl]);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      if (file) alert('이미지 파일만 선택할 수 있어요.');
      return;
    }
    try {
      const dataUrl = await fileToResizedJpegDataUrl(file);
      setImageFile(null);
      setPreviewUrl(dataUrl);
    } catch {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearPhoto = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setPreviewUrl(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      let publicUrl = '';

      let uploadBody: Blob | File | null = null;
      if (imageFile) {
        uploadBody = imageFile;
      } else if (previewUrl?.startsWith('data:')) {
        uploadBody = dataUrlToBlob(previewUrl);
      } else if (previewUrl && /^https?:\/\//i.test(previewUrl.trim())) {
        publicUrl = previewUrl.trim();
      }

      if (uploadBody) {
        const ext = uploadBody instanceof File && uploadBody.name.includes('.') ? uploadBody.name.split('.').pop() : 'jpg';
        const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(String(ext).toLowerCase())
          ? String(ext).toLowerCase()
          : 'jpg';
        const fileName = `${Math.random().toString(36).slice(2)}.${safeExt}`;
        const filePath = `profiles/${fileName}`;
        const fileForUpload =
          uploadBody instanceof File
            ? uploadBody
            : new File([uploadBody], `draft.${safeExt === 'jpeg' ? 'jpg' : safeExt}`, {
                type: uploadBody.type || 'image/jpeg',
              });

        const { error: uploadError } = await supabase.storage.from('dog-photos').upload(filePath, fileForUpload);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('dog-photos').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('로그인 후 등록할 수 있어요.');
      }

      const { data: existingDog, error: existingDogError } = await supabase
        .from('dog_profiles')
        .select('id')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingDogError) throw existingDogError;

      const payload = {
        owner_id: user.id,
        name: formData.name,
        breed: formData.breed,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        photo_url: publicUrl,
        city: '서울',
        district: '강남구',
      };

      const dbError = existingDog
        ? (
            await supabase
              .from('dog_profiles')
              .update(payload)
              .eq('id', existingDog.id)
          ).error
        : (
            await supabase
              .from('dog_profiles')
              .insert([payload])
          ).error;

      if (dbError) throw dbError;

      clearDraft();
      alert('🐶 우리 댕댕이가 성공적으로 등록되었습니다!');
      navigate('/explore');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert('등록 중 오류 발생: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-orange-50 bg-white px-4">
        <button type="button" onClick={() => navigate('/explore')} className="-ml-2 p-2 text-slate-400">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="mr-8 flex-1 text-center font-black text-slate-800">우리 댕댕이 등록하기 🐶</h1>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-screen-md space-y-8 p-6">
        <div className="flex justify-center">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(k) => {
              if (k.key === 'Enter' || k.key === ' ') {
                k.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="relative flex h-40 w-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[3rem] border-4 border-dashed border-orange-200 bg-orange-50 text-orange-400"
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} className="h-full w-full object-cover" alt="미리보기" />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"
                  aria-label="사진 지우기"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Camera className="mb-2 h-10 w-10" />
                <span className="text-xs font-black">🐕 댕댕이 사진 추가</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {mbtiType && (
            <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="text-4xl">{dogMbtiResults[mbtiType].emoji}</div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{dogMbtiResults[mbtiType].name}</h3>
                  <p className="text-sm font-bold text-orange-600">{mbtiType.toUpperCase()} 타입</p>
                </div>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-slate-600">{dogMbtiResults[mbtiType].description}</p>
              <button
                type="button"
                onClick={() => navigate('/dog-mbti-test')}
                className="text-sm font-bold text-orange-600 hover:underline"
              >
                다시 테스트하기 →
              </button>
            </div>
          )}

          {!mbtiType && (
            <div className="rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50 p-6 text-center">
              <div className="mb-3 text-4xl">🐕</div>
              <h3 className="mb-2 text-lg font-black text-slate-900">강아지 성격 테스트</h3>
              <p className="mb-4 text-sm text-slate-600">
                우리 강아지에게 맞는 친구를 찾으려면
                <br />
                먼저 성격 테스트를 해보세요!
              </p>
              <button
                type="button"
                onClick={() => navigate('/dog-mbti-test')}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95"
              >
                성격 테스트 하러가기 🎯
              </button>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">이름</label>
            <input
              required
              type="text"
              className="h-14 w-full rounded-2xl border-2 border-transparent bg-slate-50 px-5 font-bold outline-none transition-all focus:border-orange-400"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">견종</label>
            <input
              required
              type="text"
              className="h-14 w-full rounded-2xl border-2 border-transparent bg-slate-50 px-5 font-bold outline-none transition-all focus:border-orange-400"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">나이</label>
              <input
                required
                type="number"
                className="h-14 w-full rounded-2xl border-2 border-transparent bg-slate-50 px-5 font-bold outline-none transition-all focus:border-orange-400"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-black text-slate-700">성별</label>
              <div className="flex h-14 rounded-2xl bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: '남아' })}
                  className={`flex-1 rounded-xl text-sm font-black ${formData.gender === '남아' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
                >
                  남아
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: '여아' })}
                  className={`flex-1 rounded-xl text-sm font-black ${formData.gender === '여아' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}
                >
                  여아
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="flex h-16 w-full items-center justify-center rounded-[2rem] bg-orange-500 text-lg font-black text-white shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:bg-slate-200"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : '우리 아이 등록하기 🐾'}
        </button>
      </form>
    </div>
  );
}
