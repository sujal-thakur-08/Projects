import { BookMarked, FilePenLine, Home, LayoutDashboard, Settings, User2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
    isActive ? 'bg-slate-950 text-white dark:bg-sand dark:text-ink-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5',
  ].join(' ');

export function SidebarNav() {
  return (
    <aside className="glass-panel sticky top-24 h-fit rounded-[1.75rem] p-4">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Dashboard</div>
      <nav className="space-y-2">
        <NavLink to="/dashboard" className={itemClass} end>
          <LayoutDashboard className="h-4 w-4" /> My Posts
        </NavLink>
        <NavLink to="/dashboard/write" className={itemClass}>
          <FilePenLine className="h-4 w-4" /> Write New
        </NavLink>
        <NavLink to="/dashboard/bookmarks" className={itemClass}>
          <BookMarked className="h-4 w-4" /> Bookmarks
        </NavLink>
        <NavLink to="/dashboard/profile" className={itemClass}>
          <User2 className="h-4 w-4" /> Profile
        </NavLink>
        <NavLink to="/dashboard/settings" className={itemClass}>
          <Settings className="h-4 w-4" /> Settings
        </NavLink>
        <NavLink to="/" className={itemClass}>
          <Home className="h-4 w-4" /> Home
        </NavLink>
      </nav>
    </aside>
  );
}