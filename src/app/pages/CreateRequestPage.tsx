import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera, X, Trash2 } from 'lucide-react';
import { RegionSelector } from '../components/RegionSelector';

export function CreateRequestPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    city: '',
    district: '',
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const categories = [
    { name: '산책', emoji: '🐕' },
    { name: '훈련', emoji: '🎓' },
    { name: '사회화', emoji: '🐾' },
    { name: '놀이', emoji: '⚽' },
    { name: '미용', emoji: '✂️' },
    { name: '기타', emoji: '💭' },
  ];

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
    alert('🐾 모이자·만나자 글이 올라갔어요!\n동네 댕친들이 함께할 거예요');
    navigate('/explore');
  };

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
          <h2 className="mb-3 text-2xl font-extrabold text-slate-900">어디서, 언제 모일까요?</h2>
          <p className="text-base font-medium text-slate-500">
            만나서 산책·놀이할 댕친을 부르는 글이에요 (유료 맡기기는 댕집사·보호맘 탭)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <p className="mb-3 px-1 text-sm font-bold text-slate-700">주제 골라요 🐾</p>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.name })}
                  className={`py-5 rounded-2xl text-center transition-all shadow-sm ${
                    formData.category === cat.name
                      ? 'bg-orange-500 text-white scale-105 shadow-md shadow-orange-500/20'
                      : 'bg-slate-50 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-3xl mb-1">{cat.emoji}</div>
                  <div className={`text-sm font-bold ${
                    formData.category === cat.name ? 'text-white' : 'text-slate-700'
                  }`}>
                    {cat.name}
                  </div>
                </button>
              ))}
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
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 text-center text-sm font-bold text-violet-900">
            🐾 가까운 동네 댕친에게 먼저 보여요
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-5 rounded-2xl text-lg font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
          >
            올리기 · 모이자 🚀
          </button>
        </form>
      </div>
    </div>
  );
}