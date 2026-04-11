import { Smartphone } from 'lucide-react';

export function MobileOnlyGate() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50 px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg ring-1 ring-orange-100">
        <Smartphone className="h-10 w-10 text-orange-500" aria-hidden />
      </div>
      <h1 className="text-xl font-black tracking-tight text-slate-900">스마트폰에서 이용해 주세요</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
        댕댕마켓은 모바일 화면에 맞춰 설계되어 있습니다. 휴대폰 브라우저나 홈 화면에 추가한 앱으로 접속해 주세요.
      </p>
    </div>
  );
}
