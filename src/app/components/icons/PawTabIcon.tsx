/** 하단 탭 등 — 댕집사·반려견 메뉴용 (수리마켓 렌치 대체) */
export function PawTabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <ellipse cx="9" cy="7" rx="2" ry="2.5" />
      <ellipse cx="15" cy="7" rx="2" ry="2.5" />
      <ellipse cx="6.5" cy="11.5" rx="1.6" ry="2" />
      <ellipse cx="17.5" cy="11.5" rx="1.6" ry="2" />
      <path d="M12 13c-2.6 0-4.6 1.7-5.1 4.3-.2 1.1.3 2.2 1.6 2.5.9.2 1.7-.1 2.1-.9.3.7 1 1.1 1.8.9 1.1-.2 1.8-1.2 1.5-2.5C12.6 14.7 10.6 13 12 13z" />
    </svg>
  );
}
