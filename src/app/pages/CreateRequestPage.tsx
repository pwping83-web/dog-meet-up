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
    alert('🐾 모임이 등록되었습니다!\n동네 댕친들이 곧 찾아올 거예요');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between h-14 px-4 max-w-screen-md mx-auto">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-slate-800 text-lg">모임 만들기 🐾</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="px-4 py-8 max-w-screen-md mx-auto">
        {/* 메인 메시지 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐾</div>
          <h2 className="text-2xl font-extrabold mb-3 text-slate-900">
            어떤 모임을 만들까요?
          </h2>
          <p className="text-slate-500 text-base font-medium">
            우리 동네 댕친들이 함께해요 🐕
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <p className="text-sm font-bold text-slate-700 mb-3 px-1">
              어떤 모임인가요? 🐾
            </p>
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
              placeholder="예: 🐕 주말 아침 한강공원 산책 모임"
              className="w-full px-5 py-4 border-2 border-slate-200 rounded-2xl text-base focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          {/* 상세 설명 */}
          <div>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="모임 내용을 자유롭게 적어주세요 🐶"
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
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-sm text-orange-700 text-center font-bold">
            🐾 가까운 댕친들에게 먼저 공유돼요
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-5 rounded-2xl text-lg font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
          >
            모임 만들기 🚀
          </button>
        </form>
      </div>
    </div>
  );
}