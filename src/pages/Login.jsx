import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Activity, Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { api, isTokenValid, session } from '../lib/api';
import { useTheme } from '../lib/hooks';
import { Aurora, BrandMark } from '../components/Layout';
import { Alert, Button, Field, IconButton, IconChip, inputCls } from '../components/ui';

const POINTS = [
  { icon: Building2, text: 'Register and manage hospital admins', tone: 'var(--sa-accent)' },
  { icon: Activity, text: 'Live appointment activity across the network', tone: 'var(--sa-accent-2)' },
  { icon: ShieldCheck, text: 'Activate, deactivate and reset access in one place', tone: 'var(--sa-violet)' },
];

export default function Login() {
  useTheme(); // applies the saved theme on this standalone page
  const navigate = useNavigate();
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    try {
      if (sessionStorage.getItem('sa-expired')) {
        sessionStorage.removeItem('sa-expired');
        return 'Your session expired. Please sign in again.';
      }
    } catch { /* ignore */ }
    return '';
  });

  if (isTokenValid()) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api('admin/signin', { loginField: loginField.trim(), password });
      const { token, role, password: _omit, ...user } = res.data || {};
      // signin also accepts hospital logins — this panel is superadmin only.
      if (role !== 'admin') {
        setError('This panel is for super admins. Hospital accounts sign in to the hospital panel.');
        return;
      }
      session.save(token, user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? 'That email/mobile and password don’t match.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-12 px-5 py-10 sm:px-[6vw] xl:px-24">
      <Aurora />

      <section className="hidden lg:block max-w-[560px]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-accent-ink bg-accent/10 border border-accent/30 mb-5.5">
          <Sparkles size={14} /> Queueless Control Center
        </div>
        <h1 className="text-[clamp(34px,4.4vw,54px)] font-extrabold tracking-[-0.045em] leading-[1.04]">
          Every hospital.<br />
          <span className="text-brand">One clear view.</span>
        </h1>
        <p className="text-base text-ink-2 mt-4.5 mb-7.5 max-w-[470px]">
          Onboard hospitals, manage their admin access and see appointments across the whole network as they happen.
        </p>
        <div className="grid gap-3.5">
          {POINTS.map(({ icon, text, tone }) => (
            <div key={text} className="flex items-center gap-3.5 font-semibold text-ink-2" style={{ '--tone': tone }}>
              <IconChip icon={icon} size="sm" />
              {text}
            </div>
          ))}
        </div>
      </section>

      <div className="glass rounded-[22px] w-full max-w-[440px] justify-self-center p-6.5 sm:p-8.5">
        <BrandMark className="mb-5" />
        <h2 className="text-2xl font-extrabold">Welcome back</h2>
        <p className="text-ink-2 mt-1">Sign in with your super admin account.</p>

        <form onSubmit={submit} noValidate className="flex flex-col gap-4 mt-6">
          {error && <Alert>{error}</Alert>}
          <Field label="Email or mobile number">
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
              <input
                className={`${inputCls} pl-10`}
                autoComplete="username"
                placeholder="admin@queueless.com"
                value={loginField}
                onChange={(e) => setLoginField(e.target.value)}
                autoFocus
              />
            </div>
          </Field>
          <Field label="Password">
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
              <input
                className={`${inputCls} pl-10 pr-12`}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <IconButton
                icon={show ? EyeOff : Eye}
                label={show ? 'Hide password' : 'Show password'}
                size="sm"
                plain
                type="button"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
                onClick={() => setShow((s) => !s)}
              />
            </div>
          </Field>
          <Button variant="primary" type="submit" loading={loading} disabled={!loginField || !password} className="h-11.5 mt-1.5">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
