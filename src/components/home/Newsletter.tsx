import { useState, type FormEvent } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

// ─── Email validation ─────────────────────────────────────────────────────────

const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ─── Component ────────────────────────────────────────────────────────────────

const Newsletter = () => {
  const [email,     setEmail]     = useState('');
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    // Simulate async — frontend only, no real subscription
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <section
      className="py-16 sm:py-20 bg-[var(--brand-dark)] relative overflow-hidden"
      aria-labelledby="newsletter-heading"
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full
                   border border-white/5 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full
                   border border-white/5 pointer-events-none"
        aria-hidden="true"
      />

      <div className="container max-w-3xl mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-full bg-[var(--brand-accent)]/15
                       flex items-center justify-center"
            aria-hidden="true"
          >
            <Mail size={24} className="text-[var(--brand-accent)]" />
          </div>

          {/* Eyebrow */}
          <span
            className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-accent)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Stay Updated
          </span>

          {/* Heading */}
          <h2
            id="newsletter-heading"
            className="text-3xl sm:text-4xl font-semibold text-white leading-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Stay Connected{' '}
            <span className="text-[var(--brand-accent)] italic">With Dosti</span>
          </h2>

          {/* Subtitle */}
          <p
            className="text-white/65 text-base leading-relaxed max-w-md"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Get updates about our latest collections, special offers and
            more — delivered straight to your inbox.
          </p>

          {/* ── Form or success state ──────────────────────── */}
          {submitted ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-3 mt-2
                         bg-white/8 border border-white/15 rounded-2xl
                         px-8 py-6"
            >
              <CheckCircle size={36} className="text-emerald-400" aria-hidden="true" />
              <p
                className="text-white font-semibold text-lg"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Thank you for subscribing!
              </p>
              <p className="text-white/60 text-sm text-center">
                This is a demo — no real subscription has been created.
                We&apos;ll be in touch when the feature is live.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="w-full max-w-md flex flex-col gap-3 mt-2"
              aria-label="Newsletter signup"
            >
              {/* Input row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2
                               text-white/40 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    className={[
                      'w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/10',
                      'text-white text-sm placeholder:text-white/40',
                      'border transition-all duration-150',
                      'focus:outline-none focus:ring-2',
                      error
                        ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/20'
                        : 'border-white/15 focus:border-[var(--brand-accent)]/70 focus:ring-[var(--brand-accent)]/15',
                    ].join(' ')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    'inline-flex items-center justify-center gap-2',
                    'bg-[var(--brand-accent)] text-white font-semibold text-sm',
                    'px-6 py-3.5 rounded-xl shrink-0',
                    'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-white focus-visible:ring-offset-2',
                    'focus-visible:ring-offset-[var(--brand-dark)]',
                    loading
                      ? 'opacity-70 cursor-wait'
                      : 'hover:bg-[#b8924d]',
                  ].join(' ')}
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                  ) : (
                    <>
                      Subscribe
                      <ArrowRight size={15} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <p
                  id="newsletter-error"
                  role="alert"
                  className="flex items-center gap-1.5 text-xs text-red-300"
                >
                  <AlertCircle size={12} aria-hidden="true" />
                  {error}
                </p>
              )}

              <p className="text-xs text-white/35 text-center">
                No spam, ever. Unsubscribe at any time.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
