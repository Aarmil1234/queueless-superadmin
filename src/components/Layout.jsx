import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, CalendarClock, LayoutDashboard, LogOut, Menu, Moon, Plus, Stethoscope, Sun, Users,
} from 'lucide-react';
import { session } from '../lib/api';
import { useTheme } from '../lib/hooks';
import { Avatar, Button, IconButton, cx } from './ui';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/hospitals', label: 'Hospitals', icon: Building2 },
  { to: '/appointments', label: 'Appointments', icon: CalendarClock },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/patients', label: 'Patients', icon: Users },
];

const TITLES = [
  [/^\/$/, 'Overview'],
  [/^\/hospitals\/[^/]+/, 'Hospital profile'],
  [/^\/hospitals/, 'Hospitals'],
  [/^\/appointments/, 'Appointments'],
  [/^\/doctors/, 'Doctors'],
  [/^\/patients/, 'Patients'],
];

// The round Q logo (transparent PNG, same artwork as the favicon).
export function BrandMark({ className = '' }) {
  return <img src="/logo-q.png" alt="" className={cx('size-9 shrink-0', className)} />;
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = session.user || {};
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] || 'Queueless';

  useEffect(() => setOpen(false), [pathname]);

  const logout = () => {
    session.clear();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {open && <div className="fixed inset-0 z-35 bg-overlay lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cx(
          'flex flex-col gap-1 px-3 py-4 z-40 bg-glass border-r border-glass-border',
          // mobile: off-canvas drawer
          'fixed left-0 top-0 h-screen w-[248px] transition-transform duration-200',
          open ? 'translate-x-0 shadow-glass' : '-translate-x-full',
          // desktop: sticky column
          'lg:sticky lg:top-0 lg:w-auto lg:translate-x-0 lg:shadow-none'
        )}
      >
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-line">
          <BrandMark />
          <div>
            <div className="font-bold text-[15px] tracking-tight">Queueless</div>
            <div className="text-[11px] text-ink-3 font-medium">Super admin</div>
          </div>
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 px-3 pt-2 pb-1.5">Menu</div>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors',
                isActive ? 'text-accent-ink bg-accent/10 font-semibold' : 'text-ink-2 hover:bg-hover hover:text-ink'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="mt-auto flex flex-col gap-2.5">
          <Button variant="primary" icon={Plus} onClick={() => navigate('/hospitals?register=1')}>
            Register hospital
          </Button>
          <div className="flex items-center gap-2.5 p-2 rounded-lg border border-line">
            <Avatar name={user.fullName || 'Super Admin'} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{user.fullName || 'Super Admin'}</div>
              <div className="text-xs text-ink-3 truncate">{user.email || 'Platform owner'}</div>
            </div>
            <IconButton icon={LogOut} label="Sign out" size="sm" plain onClick={logout} />
          </div>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 h-16 px-4 lg:px-8 bg-glass border-b border-glass-border">
          <IconButton icon={Menu} label="Open menu" className="lg:hidden" onClick={() => setOpen(true)} />
          <div className="text-base font-semibold">{title}</div>
          <div className="flex-1" />
          <IconButton
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          />
        </header>
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
