import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Bike } from 'lucide-react';
import { deliveryLogin, getCurrentDeliveryBoy } from '../../utils/deliveryStore';

const inputCls = (err: boolean) => [
  'w-full rounded-xl border text-sm text-[#292D28] bg-white',
  'pl-10 pr-4 py-2.5',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:ring-2',
  err
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
].join(' ');

export default function DeliveryLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') ?? '/delivery/dashboard';

  const current = getCurrentDeliveryBoy();

  const [email, setEmail]     = useState('');
  const [password, setPw]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Please enter your credentials.'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = await deliveryLogin(email.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/delivery/dashboard', { replace: true });
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  if (current?.isActive) return <Navigate to={from} replace />;

  return (
    <div className="min-h-screen bg-[var(--brand-dark)] flex items-center justify-center px-4 py-12"
         style={{ fontFamily: 'var(--font-body)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--brand-accent)] flex items-center justify-center shadow-lg">
            <Bike size={28} className="text-[var(--brand-dark)]" aria-hidden="true" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
              Dosti Tea &amp; Coffee
            </p>
            <p className="text-white/50 text-xs tracking-widest uppercase mt-0.5">
              Delivery Portal
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-xl font-semibold text-[#292D28] mb-1"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Delivery Boy Sign In
          </h1>
          <p className="text-sm text-[#73786F] mb-6">Access your assigned delivery orders.</p>

          {error && (
            <div role="alert"
                 className="flex items-center gap-2 bg-red-50 border border-red-200
                            rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
              <AlertCircle size={15} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="del-email" className="text-sm font-medium text-[#292D28]">Email<span className="text-red-500 ml-0.5">*</span></label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
                <input id="del-email" type="email" value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       placeholder="delivery@example.com"
                       className={inputCls(false)} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="del-pw" className="text-sm font-medium text-[#292D28]">Password<span className="text-red-500 ml-0.5">*</span></label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F] pointer-events-none" />
                <input id="del-pw" type={showPw ? 'text' : 'password'} value={password}
                       onChange={(e) => setPw(e.target.value)} placeholder="Password"
                       className={`${inputCls(false)} pr-10`} />
                <button type="button" tabIndex={-1} onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#73786F] hover:text-[#292D28]">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[var(--brand-primary)] text-white
                               font-semibold text-sm py-3.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                               disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-xs text-[#73786F] mt-5">
            Delivery access only. Contact your admin for account setup.
          </p>
        </div>
      </div>
    </div>
  );
}
