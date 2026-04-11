// src/app/components/FloatingButton.tsx 전체 교체
import { Link } from 'react-router';
import { Plus } from 'lucide-react';

interface FloatingButtonProps {
  to: string;
  children: React.ReactNode;
}

export function FloatingButton({ to, children }: FloatingButtonProps) {
  return (
    <Link
      to={to}
      className="fixed bottom-24 right-6 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl px-5 py-4 shadow-[0_8px_30px_rgba(249,115,22,0.3)] hover:shadow-[0_10px_40px_rgba(249,115,22,0.4)] transition-all duration-300 active:scale-95 flex items-center gap-2 font-bold z-40"
    >
      <Plus className="w-5 h-5" />
      <span className="text-sm tracking-wide">{children}</span>
    </Link>
  );
}