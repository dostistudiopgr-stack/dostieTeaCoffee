import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Leaf } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { hasAdminAccount } from '../../utils/adminAccounts';
import { Spinner } from '../../components/common/Loader';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const inputCls = (err: boolean) => [
  'w-full rounded-xl border text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:ring-2',
  'pl-10 pr-4 py-2.5',
  err
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
].join(' ');

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminLogin = () => {
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();
  const from                        = searchParams.get('from') ?? '/admin/dashboard';

  // Redirect if already logged in — use Navigate component, not navigate()

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [remember,  setRemember]  = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading,   setLoading]   = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim())           e.email    = 'Email is required.';
    else if (!isValidEmail(email)) e.email  = 'Enter a valid email address.';
    if (!password)               e.password = 'Password is required.';
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

    if (result.success) navigate('/admin/dashboard', { replace: true });
    else setFormError(result.error ?? 'Login failed.');
  };

  // While the auth context is initialising (reading localStorage), show a
  // full-screen spinner so we never flash the wrong screen.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--brand-dark)]">
        <Spinner size="lg" label="Loading…" />
      </div>
    );
  }

  // Context is ready — now it is safe to read both auth state and account existence.
  if (isAuthenticated) return <Navigate to={from} replace />;
  if (!hasAdminAccount()) return <Navigate to="/admin/setup" replace />;

  return (
    <div className="min-h-screen bg-[var(--brand-dark)] flex items-center justify-center px-4 py-12"
         style={{ fontFamily: 'var(--font-body)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-accent)] flex items-center justify-center shadow-lg">
            <Leaf size={28} className="text-[var(--brand-dark)]" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Dosti Tea &amp; Coffee
            </p>
            <p className="text-white/50 text-xs tracking-widest uppercase mt-0.5">
              Admin Panel
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-semibold text-[#292D28] mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Admin Sign In
          </h1>
          <p className="text-sm text-[#73786F] mb-6">Sign in to manage your store.</p>

          {formError && (
            <div role="alert"
                 className="flex items-center gap-2 bg-red-50 border border-red-200
                            rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
              <AlertCircle size={15} aria-hidden="true" />{formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adm-email" className="text-sm font-medium text-[#292D28]">
                Email<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input id="adm-email" type="email" value={email} autoComplete="email"
                       onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: '' })); }}
                       placeholder="admin@example.com"
                       aria-invalid={!!errors.email}
                       className={inputCls(!!errors.email)} />
              </div>
              {errors.email && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="adm-pw" className="text-sm font-medium text-[#292D28]">
                Password<span className="text-red-500 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input id="adm-pw" type={showPw ? 'text' : 'password'} value={password}
                       autoComplete="current-password"
                       onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: '' })); }}
                       placeholder="Admin password"
                       aria-invalid={!!errors.password}
                       className={[inputCls(!!errors.password), 'pr-10'].join(' ')} />
                <button type="button" tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73786F]
                                   hover:text-[#292D28] transition-colors focus-visible:outline-none
                                   focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                     className="w-4 h-4 rounded accent-[var(--brand-primary)]" />
              <span className="text-sm text-[#73786F]">Remember me</span>
            </label>

            <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--brand-primary)]
                               text-white font-semibold text-sm py-3.5 rounded-xl
                               hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : 'Sign In to Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-[#73786F] mt-5">
            Admin access is managed by the store owner.
          </p>
          {import.meta.env.DEV && <p className="text-center text-xs mt-2"><a href="/admin/recovery" className="text-[var(--brand-primary)] underline">Recover local Admin access</a></p>}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
