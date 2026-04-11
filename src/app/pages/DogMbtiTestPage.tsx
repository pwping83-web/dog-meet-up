import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { mbtiQuestions, dogMbtiResults, calculateMbti, DogMbtiType } from '../data/dogMbtiData';

export function DogMbtiTestPage() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<DogMbtiType, number>>({
    shy: 0,
    active: 0,
    senior: 0,
    social: 0,
    independent: 0,
    curious: 0,
    gentle: 0,
    playful: 0,
  });
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const progress = ((currentQuestion + 1) / mbtiQuestions.length) * 100;
  const question = mbtiQuestions[currentQuestion];

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    const option = question.options[optionIndex];
    
    // 점수 업데이트
    const newScores = { ...scores };
    Object.entries(option.scores).forEach(([type, score]) => {
      newScores[type as DogMbtiType] += score || 0;
    });
    setScores(newScores);

    // 다음 질문으로 이동
    setTimeout(() => {
      if (currentQuestion < mbtiQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
    }, 500);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(null);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setScores({
      shy: 0,
      active: 0,
      senior: 0,
      social: 0,
      independent: 0,
      curious: 0,
      gentle: 0,
      playful: 0,
    });
    setShowResult(false);
    setSelectedOption(null);
  };

  const mbtiType = calculateMbti(scores);
  const result = dogMbtiResults[mbtiType];

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50">
        {/* 헤더 */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-50">
          <div className="flex items-center h-14 px-4 max-w-screen-md mx-auto">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="ml-2 font-bold text-slate-800 text-lg">강아지 MBTI 결과 🐾</span>
          </div>
        </header>

        <div className="px-4 py-8 max-w-screen-md mx-auto pb-24">
          {/* 결과 카드 */}
          <div className="bg-white rounded-3xl p-8 shadow-xl mb-6 text-center">
            <div className="text-8xl mb-6 animate-bounce">{result.emoji}</div>
            <h2 className="text-3xl font-black mb-3 text-slate-900">{result.name}</h2>
            <div className={`inline-block px-6 py-2 rounded-full text-sm font-bold mb-6 ${result.color}`}>
              {result.type.toUpperCase()}
            </div>
            <p className="text-slate-600 leading-relaxed mb-6 text-base">
              {result.description}
            </p>
          </div>

          {/* 성격 특징 */}
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <h3 className="font-black text-lg mb-4 text-slate-900">✨ 성격 특징</h3>
            <div className="flex flex-wrap gap-2">
              {result.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold border border-orange-100"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* 추천 활동 */}
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <h3 className="font-black text-lg mb-4 text-slate-900">🎯 추천 활동</h3>
            <div className="space-y-2">
              {result.activities.map((activity) => (
                <div key={activity} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <span className="text-orange-500">•</span>
                  <span className="text-slate-700 font-medium">{activity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 잘 맞는 친구 */}
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <h3 className="font-black text-lg mb-4 text-slate-900">💕 잘 맞는 친구</h3>
            <div className="flex flex-wrap gap-3">
              {result.bestMatch.map((matchType) => {
                const matchResult = dogMbtiResults[matchType];
                return (
                  <div key={matchType} className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-100">
                    <span className="text-2xl">{matchResult.emoji}</span>
                    <span className="font-bold text-slate-800">{matchResult.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <button
              onClick={() => {
                // MBTI 타입을 로컬스토리지에 저장
                localStorage.setItem('dogMbtiType', mbtiType);
                navigate('/create-dog');
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-5 rounded-2xl text-lg font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all active:scale-[0.98]"
            >
              프로필 만들고 댕친 찾기 🐾
            </button>
            <button
              onClick={handleRestart}
              className="w-full bg-white border-2 border-orange-200 text-orange-600 py-5 rounded-2xl text-lg font-bold hover:bg-orange-50 transition-all active:scale-[0.98]"
            >
              다시 테스트하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-50">
      {/* 헤더 */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-orange-100 z-50">
        <div className="flex items-center h-14 px-4 max-w-screen-md mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="ml-2 font-bold text-slate-800 text-lg">강아지 MBTI 테스트 🐾</span>
        </div>
      </header>

      {/* 진행바 */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-screen-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600">
              질문 {currentQuestion + 1} / {mbtiQuestions.length}
            </span>
            <span className="text-sm font-bold text-orange-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-8 max-w-screen-md mx-auto">
        {/* 질문 카드 */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-8 text-center">
          <div className="text-6xl mb-6">🐕</div>
          <h2 className="text-2xl font-black mb-4 text-slate-900 leading-tight">
            {question.question}
          </h2>
          <p className="text-slate-500 font-medium">우리 강아지에게 가장 가까운 것을 선택해주세요</p>
        </div>

        {/* 선택지 */}
        <div className="space-y-4 mb-8">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={`w-full p-6 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                selectedOption === index
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 border-orange-500 text-white shadow-lg'
                  : 'bg-white border-orange-100 hover:border-orange-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0">{option.emoji}</div>
                <div className="flex-1 text-left">
                  <p className={`font-bold text-lg ${selectedOption === index ? 'text-white' : 'text-slate-800'}`}>
                    {option.text}
                  </p>
                </div>
                {selectedOption === index && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 이전 버튼 */}
        {currentQuestion > 0 && (
          <button
            onClick={handlePrevious}
            className="w-full flex items-center justify-center gap-2 py-4 text-slate-600 font-bold hover:bg-white rounded-2xl transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            이전 질문
          </button>
        )}
      </div>
    </div>
  );
}
