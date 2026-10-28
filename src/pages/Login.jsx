import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Activity, Building2, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { api, isTokenValid, session } from '../lib/api';
import { useTheme } from '../lib/hooks';
import { BrandMark } from '../components/Layout';
import { Alert, Button, Field, IconButton, inputCls } from '../components/ui';

const POINTS = [
  { icon: Building2, text: 'Register and manage hospital admins' },
  { icon: Activity, text: 'Live appointment activity across the network' },
  { icon: ShieldCheck, text: 'Activate, deactivate and reset access in one place' },
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
        setError('Invalid credentials');
        // setError('This panel is for super admins. Hospital accounts sign in to the hospital panel.');
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
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Brand panel: logo navy with a soft glow of the logo blue. */}
      <section className="hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white bg-[#0b2738] bg-[radial-gradient(circle_at_100%_0%,rgb(53_203_242/0.22),transparent_55%)]">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10" />
          <span className="text-lg font-bold tracking-tight">Queueless</span>
        </div>
        <div className="max-w-[480px]">
          <h1 className="text-[clamp(30px,3.2vw,42px)] font-bold tracking-tight leading-[1.15]">
            Every hospital. <span className="text-[#35cbf2]">One clear view.</span>
          </h1>
          <p className="text-[15px] text-white/70 mt-4 mb-8 leading-relaxed">
            Onboard hospitals, manage their admin access and see appointments across the whole network as they happen.
          </p>
          <div className="grid gap-3.5">
            {POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/85">
                <span className="size-9 rounded-lg grid place-items-center bg-white/8 text-[#35cbf2]"><Icon size={17} /></span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/45">Super admin control panel</p>
      </section>

      <div className="grid place-items-center px-5 py-10">
      <div className="glass rounded-xl w-full max-w-[420px] p-6.5 sm:p-8">
        <BrandMark className="mb-5 lg:hidden" />
        <h2 className="text-2xl font-bold">Welcome back</h2>
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
          <Button variant="primary" type="submit" loading={loading} disabled={!loginField || !password} className="h-11 mt-1.5">
            Sign in
          </Button>
        </form>
      </div>
      </div>
    </div>
  );
}
