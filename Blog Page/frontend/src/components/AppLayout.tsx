import { Link, NavLink, Outlet } from 'react-router-dom';
import { Search, Sparkles, PenSquare, LayoutDashboard } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-2xl px-4 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-slate-950 text-white dark:bg-sand dark:text-ink-950'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5',
  ].join(' ');

export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white shadow-glass dark:bg-sand dark:text-ink-950">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">PulseWrite</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">AI-powered blog platform</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <NavLink to="/search" className={navLinkClass}>
              Discover
            </NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                {user.role === 'admin' ? (
                  <NavLink to="/admin" className={navLinkClass}>
                    Admin
                  </NavLink>
                ) : null}
                <button type="button" onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 pb-4 md:hidden sm:px-6 lg:px-8">
          <ThemeToggle />
          <Link to="/search" className="btn-secondary whitespace-nowrap">
            Discover
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" className="btn-secondary whitespace-nowrap">
                Dashboard
              </Link>
              {user.role === 'admin' ? (
                <Link to="/admin" className="btn-secondary whitespace-nowrap">
                  Admin
                </Link>
              ) : null}
              <button type="button" onClick={logout} className="btn-secondary whitespace-nowrap">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary whitespace-nowrap">
                Login
              </Link>
              <Link to="/register" className="btn-primary whitespace-nowrap">
                Join
              </Link>
            </>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}