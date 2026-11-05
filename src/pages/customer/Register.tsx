import { useState, type FormEvent } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, Leaf,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePublicSettings } from '../../hooks/usePublicSettings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidEmail  = (v: string)  => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone  = (v: string)  => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));
const isValidPw     = (v: string)  => v.length >= 8;

interface FormData {
  name:     string;
  email:    string;
  phone:    string;
  password: string;
  confirm:  string;
  terms:    boolean;
}

const INIT: FormData = { name: '', email: '', phone: '', password: '', confirm: '', terms: false };

const inputCls = (err: boolean) => [
  'w-full rounded-xl border text-sm text-[#292D28] bg-white',
  'pl-10 pr-4 py-2.5',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:ring-2',
  err
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
].join(' ');

// ─── Page ─────────────────────────────────────────────────────────────────────

const Register = () => {
  const { register, isAuthenticated } = useAuth();
  const { store } = usePublicSettings();
  const navigate                       = useNavigate();

  // Redirect if already logged in — use Navigate, not navigate()

  const [form,      setForm]      = useState<FormData>(INIT);
  const [errors,    setErrors]    = useState<Partial<Record<keyof FormData, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [showPw,    setShowPw]    = useState(false);
  const [showCon,   setShowCon]   = useState(false);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = field === 'terms' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((er) => ({ ...er, [field]: '' }));
    setFormError('');
  };

  const validate = (): Partial<Record<keyof FormData, string>> => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim())          e.name    = 'Full name is required.';
    if (!isValidEmail(form.email))  e.email   = 'Enter a valid email address.';
    if (form.phone && !isValidPhone(form.phone))
                                    e.phone   = 'Enter a valid 10-digit Indian mobile number.';
    if (!isValidPw(form.password))  e.password= 'Password must be at least 8 characters.';
    if (form.confirm !== form.password)
                                    e.confirm = 'Passwords do not match.';
    if (!form.terms)                e.terms   = 'Please accept the terms and conditions.';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const result = await register({
      name:     form.name.trim(),
      email:    form.email.trim(),
      phone:    form.phone.trim() || undefined,
      password: form.password,
    });
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setFormError(result.error ?? 'Registration failed. Please try again.');
    }
  };

  // Password strength
  const pwStrength = (() => {
    if (!form.password) return null;
    if (form.password.length < 8)  return { label: 'Too short', color: 'bg-red-400',    w: 'w-1/4' };
    if (!/[A-Z]/.test(form.password) || !/\d/.test(form.password))
                                    return { label: 'Fair',      color: 'bg-amber-400',  w: 'w-2/4' };
    if (!/[^A-Za-z0-9]/.test(form.password))
                                    return { label: 'Good',      color: 'bg-blue-400',   w: 'w-3/4' };
    return                                 { label: 'Strong',    color: 'bg-emerald-500', w: 'w-full' };
  })();

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div
      className="min-h-screen bg-[var(--brand-background)] flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center">
            <Leaf size={24} className="text-white" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--brand-accent)]">
            {store.name}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4D9] p-8 shadow-sm">
          <h1
            className="text-2xl font-semibold text-[#292D28] mb-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Create Account
          </h1>
          <p className="text-sm text-[#73786F] mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--brand-primary)] font-semibold hover:underline
                                         focus-visible:outline-none focus-visible:ring-2
                                         focus-visible:ring-[var(--brand-accent)] rounded">
              Sign in
            </Link>
          </p>

          {formError && (
            <div role="alert"
                 className="flex items-center gap-2 bg-red-50 border border-red-200
                            rounded-xl px-4 py-3 mb-5 text-sm text-red-700">
              <AlertCircle size={15} aria-hidden="true" />{formError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Full name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-name" className="text-sm font-medium text-[#292D28]">
                Full Name<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input id="reg-name" type="text" value={form.name}
                       onChange={set('name')} placeholder="Your full name"
                       autoComplete="name" aria-invalid={!!errors.name}
                       className={inputCls(!!errors.name)} />
              </div>
              {errors.name && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} aria-hidden="true" />{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-email" className="text-sm font-medium text-[#292D28]">
                Email Address<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input id="reg-email" type="email" value={form.email}
                       onChange={set('email')} placeholder="you@example.com"
                       autoComplete="email" aria-invalid={!!errors.email}
                       className={inputCls(!!errors.email)} />
              </div>
              {errors.email && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} aria-hidden="true" />{errors.email}</p>}
            </div>

            {/* Mobile */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-phone" className="text-sm font-medium text-[#292D28]">
                Mobile Number <span className="text-[#73786F] text-xs">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                            text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input id="reg-phone" type="tel" value={form.phone}
                       onChange={set('phone')} placeholder="10-digit mobile number"
                       maxLength={10} autoComplete="tel" aria-invalid={!!errors.phone}
                       className={inputCls(!!errors.phone)} />
              </div>
              {errors.phone && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} aria-hidden="true" />{errors.phone}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-pw" className="text-sm font-medium text-[#292D28]">
                Password<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input id="reg-pw" type={showPw ? 'text' : 'password'} value={form.password}
                       onChange={set('password')} placeholder="Min. 8 characters"
                       autoComplete="new-password" aria-invalid={!!errors.password}
                       className={[inputCls(!!errors.password), 'pr-10'].join(' ')} />
                <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73786F]
                                   hover:text-[#292D28] transition-colors focus-visible:outline-none
                                   focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength bar */}
              {pwStrength && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#E8E4D9] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.w}`} />
                  </div>
                  <span className="text-xs text-[#73786F]">{pwStrength.label}</span>
                </div>
              )}
              {errors.password && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} aria-hidden="true" />{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reg-confirm" className="text-sm font-medium text-[#292D28]">
                Confirm Password<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                           text-[#73786F] pointer-events-none" aria-hidden="true" />
                <input id="reg-confirm" type={showCon ? 'text' : 'password'} value={form.confirm}
                       onChange={set('confirm')} placeholder="Re-enter password"
                       autoComplete="new-password" aria-invalid={!!errors.confirm}
                       className={[inputCls(!!errors.confirm), 'pr-10'].join(' ')} />
                <button type="button" tabIndex={-1} onClick={() => setShowCon((v) => !v)}
                        aria-label={showCon ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73786F]
                                   hover:text-[#292D28] transition-colors focus-visible:outline-none
                                   focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                  {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirm && form.confirm === form.password && (
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle size={11} aria-hidden="true" />Passwords match
                </p>
              )}
              {errors.confirm && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} aria-hidden="true" />{errors.confirm}</p>}
            </div>

            {/* Terms */}
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.terms} onChange={set('terms')}
                       className="w-4 h-4 mt-0.5 rounded border-[#E8E4D9] accent-[var(--brand-primary)] shrink-0" />
                <span className="text-sm text-[#73786F] leading-relaxed">
                  I agree to the{' '}
                  <Link to="/contact" className="text-[var(--brand-primary)] font-semibold hover:underline">
                    Terms &amp; Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/contact" className="text-[var(--brand-primary)] font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                  .<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                </span>
              </label>
              {errors.terms && <p role="alert" className="text-xs text-red-600 flex items-center gap-1 ml-6"><AlertCircle size={11} aria-hidden="true" />{errors.terms}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[var(--brand-primary)]
                         text-white font-semibold text-sm py-3.5 rounded-xl mt-1
                         hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-[var(--brand-accent)]"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
                : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
