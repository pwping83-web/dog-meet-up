import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { Home } from 'lucide-react';

/** 라우트 트리에서 처리되지 않은 오류 시 표시 (예: 런타임 ReferenceError) */
export function RouteErrorPage() {
  const error = useRouteError();
  let title = '문제가 발생했어요';
  let message = '잠시 후 다시 시도해 주세요.';

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? '페이지를 찾을 수 없어요' : `오류 ${error.status}`;
    message = error.statusText || message;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <p className="text-lg font-extrabold text-slate-800">{title}</p>
      <p className="max-w-md text-sm font-medium text-slate-600 break-words">{message}</p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-3 text-sm font-bold text-white shadow-md"
      >
        <Home className="h-5 w-5" />
        홈으로
      </Link>
    </div>
  );
}
