import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Star, ShoppingBag } from 'lucide-react';

// ─── Product imagery (packaged powders, not beverages) ─────────────────────────
const IMG_POUCH = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=900&q=85&auto=format&fit=crop';
const IMG_POWDER = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&q=85&auto=format&fit=crop';

// ─── Component ────────────────────────────────────────────────────────────────

const HeroSection = () => {
  return (
    <section
      className="relative overflow-hidden bg-[var(--brand-background)]"
      aria-label="Hero"
    >
      {/* Decorative gradient accent on the right */}
      <div className="absolute right-0 top-0 h-full w-1/2
                      bg-gradient-to-l from-[var(--brand-primary)]/8 to-transparent
                      pointer-events-none" aria-hidden="true" />
      {/* Gold accent line */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b
                      from-transparent via-[var(--brand-accent)]/50 to-transparent
                      pointer-events-none" aria-hidden="true" />

      <div className="container max-w-7xl mx-auto px-6 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: text content ─────────────────────────── */}
          <div className="flex flex-col gap-6 relative z-10">

            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
                <Leaf size={16} className="text-white" aria-hidden="true" />
              </div>
              <span
                className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-accent)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Premium Powder Collection
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-semibold
                         text-[#292D28] leading-[1.1] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Every Sip,{' '}
              <span className="text-[var(--brand-primary)] italic">A Little More</span>
              <br />
              Togetherness
            </h1>

            {/* Subtitle */}
            <p
              className="text-base sm:text-lg text-[#73786F] leading-relaxed max-w-lg"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Discover premium tea powders, aromatic coffee powders and
              refreshing green tea powders — carefully packed in resealable
              pouches for freshness in every cup.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                           px-7 py-3.5 rounded-lg font-semibold text-sm
                           hover:bg-[var(--brand-dark)] transition-colors duration-200
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2
                           focus-visible:ring-offset-[var(--brand-background)]"
              >
                <ShoppingBag size={16} aria-hidden="true" />
                Shop Now
              </Link>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2
                           border-2 border-[var(--brand-primary)] text-[var(--brand-primary)]
                           px-7 py-3.5 rounded-lg font-semibold text-sm
                           hover:bg-[var(--brand-primary)] hover:text-white
                           transition-colors duration-200
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)] focus-visible:ring-offset-2
                           focus-visible:ring-offset-[var(--brand-background)]"
              >
                Explore Our Products
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            {/* Stats */}
            <div
              className="flex flex-wrap gap-6 sm:gap-8 pt-5 border-t border-[#E8E4D9]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {[
                { value: '14+',  label: 'Premium Powders' },
                { value: '10k+', label: 'Happy Customers' },
                { value: '4.8★', label: 'Average Rating' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-[var(--brand-primary)]">{value}</span>
                  <span className="text-xs text-[#73786F]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: product imagery ─────────────────────── */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Decorative circles */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-80 h-80 rounded-full border-2 border-[var(--brand-accent)]/20
                              animate-[fadeIn_400ms_ease]" aria-hidden="true" />
              <div className="absolute w-64 h-64 rounded-full border border-[var(--brand-primary)]/10"
                   aria-hidden="true" />
            </div>

            {/* Main product image — pouch packaging */}
            <div className="relative z-10 w-72 h-72 rounded-3xl overflow-hidden
                            shadow-xl border-4 border-white">
              <img
                src={IMG_POUCH}
                alt="Premium tea powder packaged in resealable pouches"
                fetchPriority="high"
                loading="eager"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating secondary image — powder texture */}
            <div className="absolute bottom-4 -left-2 w-28 h-28 rounded-2xl
                            overflow-hidden shadow-lg border-2 border-white z-20">
              <img
                src={IMG_POWDER}
                alt="Tea powder texture close-up"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating rating badge */}
            <div className="absolute top-2 right-0 bg-white rounded-xl shadow-lg
                            border border-[#E8E4D9] px-4 py-3 z-20
                            flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--brand-accent)]/15 flex items-center
                              justify-center">
                <Star size={16} className="text-[var(--brand-accent)] fill-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#292D28]">4.8 / 5</p>
                <p className="text-[10px] text-[#73786F]">Customer Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
