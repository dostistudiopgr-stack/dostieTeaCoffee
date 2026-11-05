import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Leaf } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePublicSettings } from '../../hooks/usePublicSettings';

// ─── Shared input class helper ────────────────────────────────────────────────

const inputCls = (hasErr: boolean) => [
  'w-full rounded-xl border text-sm text-[#292D28] bg-white',
  'pl-10 pr-4 py-2.5',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:ring-2',
  hasErr
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
].join(' ');

// ─── Page ─────────────────────────────────────────────────────────────────────

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const { store } = usePublicSettings();
  const navigate                   = useNavigate();
  const [searchParams]             = useSearchParams();
  const from                       = searchParams.get('from') ?? '/';

  // Redirect if already logged in — use Navigate component, not navigate()

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [remember,    setRemember]    = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [formError,   setFormError]   = useState('');
  const [loading,     setLoading]     = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password)     e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const result = await login({ email: email.trim(), password });
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setFormError(result.error ?? 'Login failed. Please try again.');
    }
  };

  if (isAuthenticated) return <Navigate to={from} replace />;

  return (
    <div
      className="min-h-screen bg-[var(--brand-background)] flex"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* ── Left decorative panel (desktop only) ─────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--brand-dark)] flex-col items-center
                      justify-center gap-8 p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full
                        border border-white/5 pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full
                        border border-white/5 pointer-events-none" aria-hidden="true" />

        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--brand-accent)] flex items-center justify-center">
            <Leaf size={32} className="text-[var(--brand-dark)]" aria-hidden="true" />
          </div>
          <h2
            className="text-3xl font-semibold text-white leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Welcome Back to<br />
            <span className="text-[var(--brand-accent)] italic">{store.name}</span>
          </h2>
          <p className="text-white/65 text-sm leading-relaxed">
            Sign in to track your orders, manage your addresses and enjoy
            a seamless shopping experience.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-[2px] w-10 bg-[var(--brand-accent)]/40 rounded-full" />
            <span className="text-xs text-[var(--brand-accent)] font-medium">
              {store.tagline}
            </span>
            <span className="h-[2px] w-10 bg-[var(--brand-accent)]/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 mb-8 lg:hidden">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center">
              <Leaf size={24} className="text-white" aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--brand-accent)]">
              {store.name}
            </p>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-semibold text-[#292D28] mb-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Sign In
          </h1>
          <p className="text-sm text-[#73786F] mb-6">
            New customer?{' '}
            <Link to="/register" className="text-[var(--brand-primary)] font-semibold hover:underline
                                            focus-visible:outline-none focus-visible:ring-2
                                            focus-visible:ring-[var(--brand-accent)] rounded">
              Create an account
            </Link>
          </p>

          {/* Form-level error */}
          {formError && (
            <div role="alert"
                 className="flex items-center gap-2 bg-red-50 border border-red-200
                            rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
              <AlertCircle size={15} aria-hidden="true" />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-sm font-medium text-[#292D28]">
                Email Address<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  className={inputCls(!!errors.email)}
                />
              </div>
              {errors.email && (
                <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} aria-hidden="true" />{errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-medium text-[#292D28]">
                  Password<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </label>
                <Link to="/forgot-password"
                      className="text-xs text-[var(--brand-primary)] hover:underline font-medium
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-[var(--brand-accent)] rounded">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                  placeholder="Your password"
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  className={inputCls(!!errors.password)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73786F]
                             hover:text-[#292D28] transition-colors focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={11} aria-hidden="true" />{errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#E8E4D9] accent-[var(--brand-primary)]"
              />
              <span className="text-sm text-[#73786F]">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--brand-primary)]
                         text-white font-semibold text-sm py-3.5 rounded-xl
                         hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-[#73786F] mt-6">
            By signing in, you agree to our{' '}
            <Link to="/contact" className="text-[var(--brand-primary)] hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/contact" className="text-[var(--brand-primary)] hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
