import { Navigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAppAdmin } from '../../lib/appAdmin';
import { AdminPage } from './AdminPage';

export function AdminGatePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-slate-600">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" aria-hidden />
        <p className="text-sm font-bold">확인 중…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }

  if (!isAppAdmin(user)) {
    return <Navigate to="/explore" replace />;
  }

  return <AdminPage />;
}
