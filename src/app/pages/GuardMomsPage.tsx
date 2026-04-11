import { Navigate } from 'react-router';

/** 예전 「인증 보호맘 란」 경로 — 유료 돌봄 탭으로 통합됨 */
export function GuardMomsPage() {
  return <Navigate to="/sitters?care=guard" replace />;
}
