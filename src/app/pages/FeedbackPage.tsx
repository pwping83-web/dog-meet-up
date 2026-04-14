import { Navigate } from 'react-router';

/** 예전 주소(/feedback) 호환 — 고객센터 「개선·의견」 탭으로 이동 */
export function FeedbackPage() {
  return <Navigate to="/customer-service#feedback" replace />;
}
