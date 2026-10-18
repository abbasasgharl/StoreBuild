import { Link, useLocation } from 'react-router-dom';

export function PublicHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-[#E5E7EB] px-6 lg:px-12 flex items-center justify-between">
      {/* Zone 1: Single text element wordmark */}
      <Link
        to="/"
        className="font-display text-lg font-extrabold tracking-tight text-[#111827] whitespace-nowrap shrink-0"
      >
        StoreBuild
      </Link>

      {/* Zone 2: 5 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
        <a
          href="/#how-it-works"
          className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          How It Works
        </a>
        <Link
          to="/pricing"
          className={`hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
            location.pathname === '/pricing' ? 'text-[#111827] font-semibold' : ''
          }`}
        >
          Pricing
        </Link>
        <a
          href="/#features"
          className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          Features
        </a>
        <Link
          to="/app/dashboard"
          className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          Seller Console
        </Link>
        <Link
          to="/admin"
          className="hover:text-[#111827] hover:underline underline-offset-4 transition-colors whitespace-nowrap"
        >
          Admin
        </Link>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="px-4 py-2 text-sm font-medium text-[#111827] hover:bg-[#F8FAFC] rounded-[10px] transition-colors whitespace-nowrap shrink-0"
        >
          Sign In
        </Link>
        <Link
          to="/create-store"
          className="px-4 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[10px] shadow-xs transition-colors whitespace-nowrap shrink-0"
        >
          Create Your Store
        </Link>
      </div>
    </header>
  );
}
