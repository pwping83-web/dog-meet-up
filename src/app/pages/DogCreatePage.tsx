import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Camera, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { dogMbtiResults, DogMbtiType, getAgeGroup } from '../data/dogMbtiData';

export function DogCreatePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mbtiType, setMbtiType] = useState<DogMbtiType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    gender: '남아'
  });

  // MBTI 결과 로드
  useEffect(() => {
    const savedMbti = localStorage.getItem('dogMbtiType') as DogMbtiType | null;
    if (savedMbti) {
      setMbtiType(savedMbti);
    }
  }, []);

  // 사진 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // 미리보기 생성
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let publicUrl = '';

      // 1. 사진이 있다면 Supabase Storage에 업로드
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('dog-photos')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // 업로드된 사진의 공개 URL 가져오기
        const { data } = supabase.storage.from('dog-photos').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      }

      // 2. DB에 정보 저장 (사진 URL 포함)
      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase
        .from('dog_profiles')
        .insert([
          {
            owner_id: user?.id,
            name: formData.name,
            breed: formData.breed,
            age: parseInt(formData.age),
            gender: formData.gender,
            photo_url: publicUrl, // 업로드된 사진 링크 저장
            city: '서울',
            district: '강남구'
          }
        ]);

      if (dbError) throw dbError;

      alert('🐶 우리 댕댕이가 성공적으로 등록되었습니다!');
      navigate('/explore');
    } catch (error: any) {
      alert('등록 중 오류 발생: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-10">
      <header className="h-16 flex items-center px-4 border-b border-orange-50 sticky top-0 bg-white z-50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400"><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="flex-1 text-center font-black text-slate-800 mr-8">우리 댕댕이 등록하기 🐶</h1>
      </header>

      <form onSubmit={handleSubmit} className="p-6 max-w-screen-md mx-auto space-y-8">
        {/* 사진 업로드 및 미리보기 */}
        <div className="flex justify-center">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-40 h-40 bg-orange-50 rounded-[3rem] border-4 border-dashed border-orange-200 flex flex-col items-center justify-center text-orange-400 overflow-hidden cursor-pointer"
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} className="w-full h-full object-cover" alt="미리보기" />
                <button 
                  onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); setImageFile(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Camera className="w-10 h-10 mb-2" />
                <span className="text-xs font-black">🐕 댕댕이 사진 추가</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* MBTI 정보 표시 */}
          {mbtiType && (
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-3xl p-6 border-2 border-orange-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-4xl">{dogMbtiResults[mbtiType].emoji}</div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{dogMbtiResults[mbtiType].name}</h3>
                  <p className="text-sm font-bold text-orange-600">{mbtiType.toUpperCase()} 타입</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                {dogMbtiResults[mbtiType].description}
              </p>
              <button
                type="button"
                onClick={() => navigate('/dog-mbti-test')}
                className="text-sm font-bold text-orange-600 hover:underline"
              >
                다시 테스트하기 →
              </button>
            </div>
          )}

          {/* MBTI 없으면 테스트 안내 */}
          {!mbtiType && (
            <div className="bg-orange-50 rounded-3xl p-6 border-2 border-dashed border-orange-200 text-center">
              <div className="text-4xl mb-3">🐕</div>
              <h3 className="font-black text-lg text-slate-900 mb-2">강아지 성격 테스트</h3>
              <p className="text-sm text-slate-600 mb-4">
                우리 강아지에게 맞는 친구를 찾으려면<br />
                먼저 성격 테스트를 해보세요!
              </p>
              <button
                type="button"
                onClick={() => navigate('/dog-mbti-test')}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
              >
                성격 테스트 하러가기 🎯
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">이름</label>
            <input required type="text" className="w-full bg-slate-50 rounded-2xl h-14 px-5 font-bold outline-none border-2 border-transparent focus:border-orange-400 transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">견종</label>
            <input required type="text" className="w-full bg-slate-50 rounded-2xl h-14 px-5 font-bold outline-none border-2 border-transparent focus:border-orange-400 transition-all" value={formData.breed} onChange={(e) => setFormData({...formData, breed: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">나이</label>
              <input required type="number" className="w-full bg-slate-50 rounded-2xl h-14 px-5 font-bold outline-none border-2 border-transparent focus:border-orange-400 transition-all" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">성별</label>
              <div className="flex bg-slate-50 rounded-2xl p-1 h-14">
                <button type="button" onClick={() => setFormData({...formData, gender: '남아'})} className={`flex-1 rounded-xl font-black text-sm ${formData.gender === '남아' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>남아</button>
                <button type="button" onClick={() => setFormData({...formData, gender: '여아'})} className={`flex-1 rounded-xl font-black text-sm ${formData.gender === '여아' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-400'}`}>여아</button>
              </div>
            </div>
          </div>
        </div>

        <button disabled={loading} type="submit" className="w-full bg-orange-500 text-white h-16 rounded-[2rem] font-black text-lg shadow-lg shadow-orange-200 active:scale-95 disabled:bg-slate-200 flex items-center justify-center">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '우리 아이 등록하기 🐾'}
        </button>
      </form>
    </div>
  );
}