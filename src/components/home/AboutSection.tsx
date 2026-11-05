import { Link } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';

// Stable Unsplash lifestyle image — warm tea setting
const ABOUT_IMG =
  'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=85&auto=format&fit=crop';

const HIGHLIGHTS = [
  { value: '50+',  label: 'Premium Products' },
  { value: '5+',   label: 'Tea Estates'      },
  { value: '100%', label: 'Quality Focused'  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AboutSection = () => {
  return (
    <section
      className="py-16 sm:py-20 bg-white overflow-hidden"
      aria-labelledby="about-heading"
    >
      <div className="container max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Image column ──────────────────────────────── */}
          <div className="relative order-2 lg:order-1">
            {/* Decorative green block */}
            <div
              className="absolute -bottom-6 -left-6 w-2/3 h-2/3 bg-[var(--brand-primary)]/8
                         rounded-2xl -z-10"
              aria-hidden="true"
            />
            {/* Gold accent dot */}
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full
                         border-4 border-[var(--brand-accent)]/30 -z-10"
              aria-hidden="true"
            />

            <div className="rounded-2xl overflow-hidden shadow-xl aspect-[4/3]">
              <img
                src={ABOUT_IMG}
                alt="Warm lifestyle scene — teacups, tea leaves and natural textures"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating stats card */}
            <div
              className="absolute -bottom-5 right-4 sm:right-8
                         bg-white rounded-xl shadow-lg border border-[#E8E4D9]
                         px-5 py-4 flex items-center gap-5"
            >
              {HIGHLIGHTS.map(({ value, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 text-center">
                  <span
                    className="text-lg font-bold text-[var(--brand-primary)]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {value}
                  </span>
                  <span className="text-[10px] text-[#73786F] whitespace-nowrap leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Text column ───────────────────────────────── */}
          <div className="order-1 lg:order-2 flex flex-col gap-6">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <Leaf size={14} className="text-[var(--brand-accent)]" aria-hidden="true" />
              <span
                className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-accent)]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Our Story
              </span>
            </div>

            <h2
              id="about-heading"
              className="text-3xl sm:text-4xl font-semibold text-[#292D28] leading-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              A Little More Than{' '}
              <span className="text-[var(--brand-primary)] italic">Just Tea &amp; Coffee</span>
            </h2>

            <div className="flex flex-col gap-4 text-[#73786F] text-base leading-relaxed"
                 style={{ fontFamily: 'var(--font-body)' }}>
              <p>
                At Dosti Tea &amp; Coffee, we believe every cup creates a moment
                worth sharing. Our collection brings together the finest teas,
                coffees and green teas for everyday enjoyment.
              </p>
              <p>
                From your morning routine to relaxed conversations with friends,
                we want to make every sip special — with carefully selected
                products that carry the warmth and richness of India&apos;s finest
                growing regions.
              </p>
            </div>

            {/* Gold divider */}
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-10 rounded-full bg-[var(--brand-accent)]" aria-hidden="true" />
              <p
                className="text-sm font-medium text-[#292D28] italic"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                &ldquo;Every Sip, A Little More Togetherness&rdquo;
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2.5
                           bg-[var(--brand-primary)] text-white
                           px-7 py-3.5 rounded-lg font-semibold text-sm
                           hover:bg-[var(--brand-dark)] transition-colors duration-200
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                Discover Our Story
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutSection;
