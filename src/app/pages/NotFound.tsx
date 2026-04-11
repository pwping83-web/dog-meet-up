import { Link } from 'react-router';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/30 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 404 아이콘 */}
        <div className="mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
            <span className="text-6xl">🔍</span>
          </div>
        </div>

        {/* 404 텍스트 */}
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 mb-4">
          404
        </h1>
        <p className="text-slate-600 font-bold text-lg mb-2">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-slate-500 font-medium mb-8">
          요청하신 페이지가 존재하지 않거나<br />
          이동되었을 수 있습니다
        </p>
        
        {/* 홈 버튼 */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-[0.98]"
        >
          <Home className="w-5 h-5" />
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}