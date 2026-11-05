import { ShieldCheck, Coffee, Package, Truck } from 'lucide-react';
import SectionTitle from '../common/SectionTitle';

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon:        <ShieldCheck size={28} strokeWidth={1.5} aria-hidden="true" />,
    title:       'Carefully Selected Quality',
    description:
      'Every product is selected with care to bring you a satisfying and enjoyable experience in every cup.',
  },
  {
    icon:        <Coffee size={28} strokeWidth={1.5} aria-hidden="true" />,
    title:       'Rich Taste & Aroma',
    description:
      'Enjoy delicious flavours and beautiful aromas crafted from premium ingredients sourced across India.',
  },
  {
    icon:        <Package size={28} strokeWidth={1.5} aria-hidden="true" />,
    title:       'Freshly Packed',
    description:
      'Our products are presented with care to preserve their freshness and quality from source to your cup.',
  },
  {
    icon:        <Truck size={28} strokeWidth={1.5} aria-hidden="true" />,
    title:       'Delivered With Care',
    description:
      'We focus on making your shopping experience simple, convenient and reliable every single time.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const WhyChooseUs = () => {
  return (
    <section
      className="py-16 sm:py-20 bg-[var(--brand-background)]"
      aria-labelledby="why-heading"
    >
      <div className="container max-w-7xl mx-auto px-6">
        <SectionTitle
          id="why-heading"
          eyebrow="Our Promise"
          title="Why Choose Dosti?"
          subtitle="We take pride in delivering more than just great taste."
          alignment="center"
          className="mb-12"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map(({ icon, title, description }) => (
            <div
              key={title}
              className="group flex flex-col items-start gap-4 p-6
                         bg-white rounded-2xl border border-[#E8E4D9]
                         hover:border-[var(--brand-primary)]/25 hover:shadow-md
                         transition-all duration-300"
            >
              {/* Icon container */}
              <div
                className="w-14 h-14 rounded-xl bg-[var(--brand-primary)]/8 text-[var(--brand-primary)]
                           flex items-center justify-center shrink-0
                           group-hover:bg-[var(--brand-primary)] group-hover:text-white
                           transition-all duration-300"
              >
                {icon}
              </div>

              <div className="flex flex-col gap-1.5">
                <h3
                  className="text-base font-semibold text-[#292D28]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {title}
                </h3>
                <p className="text-sm text-[#73786F] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
