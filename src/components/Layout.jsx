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

// Slow-drifting color fields behind the glass, plus a faint dot grid.
export function Aurora() {
  const blob = 'absolute rounded-full blur-[90px] animate-drift';
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <span className={cx(blob, 'w-[46vw] h-[46vw] -left-[10vw] -top-[14vw] bg-(--sa-blob-1)')} />
      <span className={cx(blob, 'w-[52vw] h-[52vw] -right-[16vw] top-[10vh] bg-(--sa-blob-2) [animation-delay:-8s]')} />
      <span className={cx(blob, 'w-[38vw] h-[38vw] left-[28vw] -bottom-[20vw] bg-(--sa-blob-3) [animation-delay:-16s]')} />
      <div className="absolute inset-0 bg-dots" />
    </div>
  );
}

export function BrandMark({ className = '' }) {
  return (
    <div className={cx('size-10 rounded-[13px] grid place-items-center bg-brand text-white shrink-0 shadow-[0_8px_24px_-6px_rgb(45_212_191/0.55)]', className)}>
      <Plus size={22} strokeWidth={3} />
    </div>
  );
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
    <div className="min-h-screen lg:grid lg:grid-cols-[268px_minmax(0,1fr)]">
      <Aurora />
      {open && <div className="fixed inset-0 z-35 bg-overlay lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cx(
          'rounded-[22px] flex flex-col gap-1.5 px-4 py-5.5 z-40',
          // mobile: off-canvas drawer
          'fixed left-0 top-0 m-3 h-[calc(100vh-24px)] w-[268px] glass-solid transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-[calc(100%+24px)]',
          // desktop: sticky glass column
          'lg:sticky lg:self-start lg:top-4 lg:m-0 lg:ml-4 lg:my-4 lg:h-[calc(100vh-32px)] lg:w-auto lg:translate-x-0 lg:glass'
        )}
      >
        <div className="flex items-center gap-3 px-2 pt-1 pb-5.5">
          <BrandMark />
          <div>
            <div className="font-extrabold text-base tracking-tight">Queueless</div>
            <div className="text-[11px] text-ink-3 font-semibold tracking-[0.08em] uppercase">Control Center</div>
          </div>
        </div>

        <div className="text-[10.5px] font-bold tracking-[0.12em] uppercase text-ink-3 px-3 pt-3.5 pb-1.5">Workspace</div>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-[13px] font-semibold transition',
                isActive ? 'text-ink bg-glass-strong shadow-glass-sm' : 'text-ink-2 hover:bg-hover hover:text-ink'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-5.5 rounded-r bg-brand" />}
                <Icon size={19} className={isActive ? 'text-accent' : ''} />
                {label}
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-auto flex flex-col gap-2.5">
          <Button variant="primary" icon={Plus} onClick={() => navigate('/hospitals?register=1')}>
            Register hospital
          </Button>
          <div className="flex items-center gap-2.5 p-2.5 rounded-[15px] bg-hover">
            <Avatar name={user.fullName || 'Super Admin'} />
            <div className="min-w-0 flex-1">
              <div className="font-bold truncate">{user.fullName || 'Super Admin'}</div>
              <div className="text-xs text-ink-3 truncate">{user.email || 'Platform owner'}</div>
            </div>
            <IconButton icon={LogOut} label="Sign out" size="sm" plain onClick={logout} />
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 pt-3 pb-8 lg:px-7 lg:pt-4 lg:pb-10">
        <header className="glass sticky top-3 lg:top-4 z-30 flex items-center gap-3.5 rounded-[18px] py-3 pr-3.5 pl-3 lg:pl-5.5 mb-6.5">
          <IconButton icon={Menu} label="Open menu" className="lg:hidden" onClick={() => setOpen(true)} />
          <div>
            <div className="hidden sm:block text-xs text-ink-3 font-semibold">Super admin</div>
            <div className="text-[17px] font-extrabold">{title}</div>
          </div>
          <div className="flex-1" />
          <IconButton
            icon={theme === 'dark' ? Sun : Moon}
            label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          />
        </header>
        <Outlet />
      </main>
    </div>
  );
}
