import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Leaf } from 'lucide-react';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const ForgotPassword = () => {
  const { store } = usePublicSettings();
  const [email,     setEmail]     = useState('');
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim())        { setError('Please enter your email address.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div
      className="min-h-screen bg-[var(--brand-background)] flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center">
            <Leaf size={24} className="text-white" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[var(--brand-accent)]">
            {store.name}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E4D9] p-8 shadow-sm">
          {!submitted ? (
            <>
              <h1
                className="text-2xl font-semibold text-[#292D28] mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Forgot Password?
              </h1>
              <p className="text-sm text-[#73786F] mb-6 leading-relaxed">
                Enter your registered email address and we will send you a
                reset link — once backend email integration is live.
              </p>

              {/* Demo notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-6">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Demo mode:</strong> No real email will be sent. This feature
                  requires backend email integration which will be available in a future update.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="fp-email" className="text-sm font-medium text-[#292D28]">
                    Email Address<span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                               text-[#73786F] pointer-events-none" aria-hidden="true" />
                    <input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      aria-describedby={error ? 'fp-error' : undefined}
                      aria-invalid={!!error}
                      className={[
                        'w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm',
                        'transition-all focus:outline-none focus:ring-2',
                        error
                          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
                          : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
                      ].join(' ')}
                    />
                  </div>
                  {error && (
                    <p id="fp-error" role="alert" className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={11} aria-hidden="true" />{error}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--brand-primary)]
                             text-white font-semibold text-sm py-3 rounded-xl
                             hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)]"
                >
                  {loading
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-600" aria-hidden="true" />
              </div>
              <h2
                className="text-xl font-semibold text-[#292D28]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Check Your Inbox
              </h2>
              <p className="text-sm text-[#73786F] leading-relaxed max-w-xs">
                If <strong>{email}</strong> is registered, a reset link will be sent once
                email functionality is enabled.
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200
                            rounded-xl px-4 py-3 leading-relaxed">
                This is a frontend demonstration. No real email has been sent.
              </p>
            </div>
          )}

          <Link
            to="/login"
            className="mt-6 flex items-center justify-center gap-2 text-sm
                       text-[#73786F] hover:text-[var(--brand-primary)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)] rounded"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
