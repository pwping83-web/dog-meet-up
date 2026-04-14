import { useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { CARE_INTRO_PHOTO_MAX, uploadCareIntroPhoto } from '../../lib/careIntroPhotoUpload';

function looksLikeImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  if (!file.name.includes('.')) return false;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'bmp'].includes(ext);
}

function storageErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  if (err instanceof Error) return err.message;
  return '사진 업로드에 실패했어요.';
}

type CareIntroPhotoPickerProps = {
  userId: string;
  urls: string[];
  onUrlsChange: (next: string[]) => void;
  disabled?: boolean;
  /** 짧은 안내 (선택) */
  hint?: string;
};

export function CareIntroPhotoPicker({ userId, urls, onUrlsChange, disabled, hint }: CareIntroPhotoPickerProps) {
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const files = input.files;
    if (!files?.length || disabled) return;
    const room = CARE_INTRO_PHOTO_MAX - urls.length;
    if (room <= 0) return;
    /* value 초기화는 File 복사 뒤에: 일부 모바일(Safari)에서 먼저 비우면 FileList가 비어 0장처럼 동작함 */
    const list = Array.from(files).slice(0, room);
    input.value = '';
    setBusy(true);
    try {
      const next: string[] = [...urls];
      let uploaded = 0;
      for (const file of list) {
        if (!looksLikeImageFile(file)) continue;
        if (file.size > 6 * 1024 * 1024) {
          alert('사진 한 장은 6MB 이하로 올려 주세요.');
          continue;
        }
        const url = await uploadCareIntroPhoto(userId, file);
        next.push(url);
        uploaded += 1;
      }
      onUrlsChange(next.slice(0, CARE_INTRO_PHOTO_MAX));
      if (uploaded === 0 && list.length > 0) {
        alert('선택한 파일을 사진으로 인식하지 못했어요. JPG·PNG로 저장한 뒤 다시 선택하거나, 다른 앨범에서 골라 주세요.');
      }
    } catch (err) {
      alert(storageErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = (idx: number) => {
    onUrlsChange(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="mt-3">
      <p className="text-xs font-extrabold text-slate-700">사진 ({urls.length}/{CARE_INTRO_PHOTO_MAX})</p>
      {hint ? <p className="mt-0.5 text-[11px] font-medium text-slate-500">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={`${u}-${i}`} className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <ImageWithFallback src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => remove(i)}
              className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white shadow-sm disabled:opacity-50"
              aria-label="사진 삭제"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {urls.length < CARE_INTRO_PHOTO_MAX && (
          <label
            className={`flex h-[4.5rem] w-[4.5rem] shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50/50 ${
              disabled || busy ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            {busy ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : (
              <>
                <Camera className="h-5 w-5" aria-hidden />
                <span className="mt-0.5 text-[10px] font-extrabold">추가</span>
              </>
            )}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(ev) => void onPick(ev)} disabled={disabled || busy} />
          </label>
        )}
      </div>
    </div>
  );
}
