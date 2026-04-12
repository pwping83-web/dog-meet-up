import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Camera, X, Trash2 } from 'lucide-react';
import { RegionSelector } from '../components/RegionSelector';
import { useAuth } from '../../contexts/AuthContext';
import { setAuthReturnPath } from '../components/AuthReturnRedirect';

export function CreateRequestPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    city: '',
    district: '',
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAuthReturnPath('/create-meetup');
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const moijaCategories = [
    { name: '공원·장소 모임', emoji: '🌳' },
    { name: '산책·놀이', emoji: '🐕' },
    { name: '카페·체험', emoji: '☕' },
    { name: '훈련·사회화', emoji: '🎓' },
  ] as const;

  const mannajaCategories = [
    { name: '1:1 만남', emoji: '💬' },
    { name: '교배', emoji: '💕' },
    { name: '실종', emoji: '🚨' },
  ] as const;

  const allCategoryNames = [...moijaCategories.map((c) => c.name), ...mannajaCategories.map((c) => c.name)];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.category || !allCategoryNames.includes(formData.category)) {
      alert('모이자 또는 만나자 주제를 하나 골라 주세요 🐾');
      return;
    }
    alert('🐾 모이자·만나자 글이 올라갔어요!\n동네 댕친들이 함께할 거예요');
    navigate('/explore');
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm font-medium text-slate-500">
        {authLoading ? '잠시만요…' : '로그인 페이지로 이동 중…'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-screen-md mx-auto">
          <button type="button" onClick={() => navigate('/explore')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors" aria-label="닫기">
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">모이자 · 만나자 🐾</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="px-4 py-8 max-w-screen-md mx-auto">
        {/* 메인 메시지 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="mb-3 text-2xl font-extrabold text-slate-900">모이자 / 만나자 골라 올려요</h2>
          <p className="text-base font-medium text-slate-500">
            <strong className="text-slate-700">모이자</strong>는 공원·일정 정하고 여럿이 모이는 글,{' '}
            <strong className="text-slate-700">만나자</strong>는 1:1·교배·실종 글이에요. 맡기기는 내댕댕·인증 돌봄을
            이용해 주세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-5">
            <div>
              <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-orange-600">
                모이자
              </p>
              <p className="mb-2 px-1 text-xs font-semibold text-slate-500">
                어디 공원·카페에서, 몇 시에 모일지 정하고 여럿이 오는 글
              </p>
              {renderCategoryGrid(moijaCategories, 'grid-cols-2')}
            </div>
            <div>
              <p className="mb-2 px-1 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                만나자
              </p>
              <p className="mb-2 px-1 text-xs font-semibold text-slate-500">
                견종 맞춤 1:1 만남·교배·실종 안내 글
              </p>
              {renderCategoryGrid(mannajaCategories, 'grid-cols-3')}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 주말 오전 한강에서 산책 같이 해요 🐕"
              className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          {/* 상세 설명 */}
          <div>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="몇 시에 어디서 만날지, 견종·성향 등 자유롭게 적어 주세요 🐶"
              rows={4}
              className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none font-medium placeholder:text-slate-400"
            />
          </div>

          {/* 사진 첨부 */}
          <div>
            {/* 이미지 미리보기 */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {previewImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image}
                      alt={`미리보기 ${index + 1}`}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 업로드 버튼 */}
            {previewImages.length < 5 && (
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-500 hover:bg-orange-50/30 transition-all cursor-pointer active:scale-[0.98]">
                  <Camera className="w-8 h-8 mb-2" />
                  <span className="text-sm font-bold">
                    사진 추가 ({previewImages.length}/5)
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* 동네 선택 */}
          <div>
            <RegionSelector
              selectedCity={formData.city}
              selectedDistrict={formData.district}
              onCityChange={(city) => setFormData({ ...formData, city })}
              onDistrictChange={(district) => setFormData({ ...formData, district })}
            />
          </div>

          {/* 안내 */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4 text-center text-sm font-bold text-orange-950">
            🐾 가까운 동네 댕친에게 먼저 보여요
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!formData.category || !allCategoryNames.includes(formData.category)}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 py-5 text-lg font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 active:scale-[0.98] disabled:opacity-50"
          >
            올리기 · 모이자 / 만나자 🚀
          </button>
        </form>
      </div>
    </div>
  );
}