import { Link } from 'react-router-dom';
import {
  Leaf, Target, Eye, ShieldCheck, Coffee,
  Users, ArrowRight, CheckCircle, Sparkles,
} from 'lucide-react';
import SectionTitle from '../../components/common/SectionTitle';
import { getAllCategories } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';
import ProductImage from '../../components/product/ProductImage';

// ─── Images ───────────────────────────────────────────────────────────────────

const IMG_ABOUT_HERO = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=1200&q=85&auto=format&fit=crop';
const IMG_STORY     = 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=85&auto=format&fit=crop';
const IMG_QUALITY   = 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=85&auto=format&fit=crop';

// ─── Page ─────────────────────────────────────────────────────────────────────

const About = () => {
  useLocalDataRevision();
  const categories = getAllCategories().filter((category) => category.isActive);
  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Hero banner ────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--brand-background)] py-16 sm:py-24">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <Leaf size={14} className="text-[var(--brand-accent)]" aria-hidden="true" />
                <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-accent)]">
                  Our Story
                </span>
              </div>
              <h1
                className="text-4xl sm:text-5xl font-semibold text-[#292D28] leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                A Little More Than{' '}
                <span className="text-[var(--brand-primary)] italic">Just Tea &amp; Coffee</span>
              </h1>
              <p className="text-base text-[#73786F] leading-relaxed max-w-lg">
                Dosti Tea &amp; Coffee brings you premium tea powders, coffee
                powders and green tea powders sourced from India&apos;s finest
                estates — carefully packed to preserve freshness and flavour in
                every cup.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="h-[2px] w-10 bg-[var(--brand-accent)] rounded-full" />
                <p className="text-sm font-medium text-[#292D28] italic"
                   style={{ fontFamily: 'var(--font-heading)' }}>
                  Every Sip, A Little More Togetherness
                </p>
              </div>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-[var(--brand-primary)] text-white
                           text-sm font-semibold px-6 py-3 rounded-lg
                           hover:bg-[var(--brand-dark)] transition-colors w-fit
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                Explore Our Products
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {/* Image */}
            <div className="relative">
              <div className="absolute -bottom-5 -left-5 w-2/3 h-2/3 bg-[var(--brand-primary)]/8
                              rounded-2xl -z-10" aria-hidden="true" />
              <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
                <img
                  src={IMG_ABOUT_HERO}
                  alt="Premium tea and coffee powder products"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Story ───────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="order-2 lg:order-1 relative">
              <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full
                              border-4 border-[var(--brand-accent)]/30 -z-10" aria-hidden="true" />
              <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
                <img
                  src={IMG_STORY}
                  alt="Dosti Tea & Coffee lifestyle"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Text */}
            <div className="order-1 lg:order-2 flex flex-col gap-4">
              <SectionTitle
                eyebrow="How It Started"
                title="Our Story"
                alignment="left"
                className="mb-2"
              />
              <div className="flex flex-col gap-4 text-[#73786F] leading-relaxed">
                <p>
                  Dosti Tea &amp; Coffee was born from a simple belief — that
                  every cup of tea or coffee creates a moment worth sharing.
                  From the misty hills of Darjeeling and Assam to the coffee
                  plantations of Coorg and Chikmagalur, we travelled across
                  India to find the finest powders for your everyday moments.
                </p>
                <p>
                  We started with a commitment to quality and freshness. Every
                  product is carefully selected, packed in resealable pouches
                  to preserve its aroma, and delivered fresh to your doorstep.
                  Today, we offer a growing range of tea powders, coffee powders
                  and green tea powders — each one chosen with care.
                </p>
                <p>
                  Our name, Dosti, means friendship. And that&apos;s what we want
                  to bring to every home — the warmth of a good cup shared with
                  the people who matter most.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ─────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[var(--brand-background)]">
        <div className="container max-w-7xl mx-auto px-6">
          <SectionTitle
            eyebrow="What Drives Us"
            title="Our Mission &amp; Vision"
            subtitle="Guided by quality, inspired by togetherness."
            alignment="center"
            className="mb-12"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Mission */}
            <div className="bg-white rounded-2xl border border-[#E8E4D9] p-8
                            hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center
                              justify-center mb-5">
                <Target size={24} className="text-[var(--brand-primary)]" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-[#292D28] mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Our Mission
              </h3>
              <p className="text-sm text-[#73786F] leading-relaxed">
                To make premium quality tea and coffee powders accessible to
                every Indian household — sourced responsibly, packed fresh, and
                delivered with care. We want every cup to be a moment of
                togetherness.
              </p>
            </div>
            {/* Vision */}
            <div className="bg-white rounded-2xl border border-[#E8E4D9] p-8
                            hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-accent)]/15 flex items-center
                              justify-center mb-5">
                <Eye size={24} className="text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-[#292D28] mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Our Vision
              </h3>
              <p className="text-sm text-[#73786F] leading-relaxed">
                To become India&apos;s most loved brand for packaged tea and
                coffee powders — known for quality, freshness, and the warmth we
                bring to every home. We see a future where Dosti means more than
                a product; it means a shared moment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Quality ─────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="flex flex-col gap-5">
              <SectionTitle
                eyebrow="Our Promise"
                title="Product Quality"
                alignment="left"
                className="mb-2"
              />
              <p className="text-[#73786F] leading-relaxed">
                Every product in our collection goes through a careful selection
                process. We work directly with estates across India to bring
                you powders that are fresh, aromatic and full of flavour.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  'Carefully selected powders from India\'s finest growing regions',
                  'Packed in resealable stand-up pouches to preserve freshness',
                  'Available in 100g, 250g, 500g and 1kg pack sizes',
                  'No artificial additives in our core product range',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-[#292D28]">
                    <CheckCircle size={16} className="text-[var(--brand-primary)] shrink-0 mt-0.5" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            {/* Image */}
            <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
              <img
                src={IMG_QUALITY}
                alt="Quality tea and coffee powder packaging"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[var(--brand-background)]">
        <div className="container max-w-7xl mx-auto px-6">
          <SectionTitle
            eyebrow="Why Dosti"
            title="Why Choose Dosti Tea &amp; Coffee?"
            subtitle="We take pride in delivering more than just great taste."
            alignment="center"
            className="mb-12"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <ShieldCheck size={26} strokeWidth={1.5} />, title: 'Carefully Selected', desc: 'Every powder is chosen with care from India\'s finest estates.' },
              { icon: <Coffee size={26} strokeWidth={1.5} />, title: 'Rich Taste & Aroma', desc: 'Enjoy delicious flavours and beautiful aromas in every cup.' },
              { icon: <Leaf size={26} strokeWidth={1.5} />, title: 'Freshly Packed', desc: 'Resealable pouches preserve quality from source to your cup.' },
              { icon: <Users size={26} strokeWidth={1.5} />, title: 'Delivered With Care', desc: 'A simple, convenient shopping experience every single time.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-[#E8E4D9]
                                          p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/8 flex items-center
                                justify-center mb-4 text-[var(--brand-primary)]">
                  {icon}
                </div>
                <h3 className="text-base font-semibold text-[#292D28] mb-2"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                  {title}
                </h3>
                <p className="text-sm text-[#73786F] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Categories ────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
          <SectionTitle
            eyebrow="Our Collections"
            title="Explore Our Powder Collections"
            subtitle="Explore the categories currently available in the store."
            alignment="center"
            className="mb-12"
          />
          {categories.length === 0 ? <p className="py-8 text-center text-sm text-[#73786F]">No categories are available yet.</p> : <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-[3/4]
                           focus-visible:outline-none focus-visible:ring-4
                           focus-visible:ring-[var(--brand-accent)]"
              >
                <ProductImage src={cat.image} alt={cat.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80
                                via-black/30 to-transparent" />
                <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                  <h3 className="text-xl font-semibold text-white mb-1"
                      style={{ fontFamily: 'var(--font-heading)' }}>
                    {cat.name}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-3">{cat.description}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm
                                   font-semibold text-[var(--brand-accent)] group-hover:gap-3
                                   transition-all">
                    Explore <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[var(--brand-dark)] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full
                        border border-white/5" aria-hidden="true" />
        <div className="container max-w-3xl mx-auto px-6 relative z-10 text-center">
          <Sparkles size={28} className="text-[var(--brand-accent)] mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Ready to Experience Dosti?
          </h2>
          <p className="text-white/65 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Browse our full collection of premium tea, coffee and green tea
            powders — packed fresh and delivered to your door.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-[var(--brand-accent)] text-white
                       text-sm font-semibold px-8 py-3.5 rounded-lg
                       hover:bg-[#b8924d] transition-colors
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-white"
          >
            Shop Now
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
