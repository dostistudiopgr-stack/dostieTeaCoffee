import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Leaf } from 'lucide-react';
import { getAllCategories } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';
import { usePublicSettings } from '../../hooks/usePublicSettings';

// ─── Inline social icons (lucide-react v1 removed brand icons) ───────────────

const IconInstagram = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
);

const IconFacebook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const IconTwitter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const IconYoutube = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       aria-hidden="true">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const quickLinks = [
  { label: 'Home',       to: '/'       },
  { label: 'Shop',       to: '/shop'   },
  { label: 'About Us',   to: '/about'  },
  { label: 'Contact Us', to: '/contact'},
];

const supportLinks = [
  { label: 'My Account',       to: '/profile'          },
  { label: 'My Orders',        to: '/my-orders'        },
  { label: 'Track Order',      to: '/my-orders' },
  { label: 'FAQs',             to: '/contact'          },
  { label: 'Shipping Policy',  to: '/contact'          },
  { label: 'Return Policy',    to: '/contact'          },
];

const socials = [
  { label: 'Instagram', icon: <IconInstagram />, href: '#' },
  { label: 'Facebook',  icon: <IconFacebook  />, href: '#' },
  { label: 'Twitter',   icon: <IconTwitter   />, href: '#' },
  { label: 'YouTube',   icon: <IconYoutube   />, href: '#' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FooterHeading = ({ children }: { children: React.ReactNode }) => (
  <h3
    className="text-[var(--brand-accent)] text-sm font-semibold tracking-wider uppercase mb-4"
    style={{ fontFamily: 'var(--font-body)' }}
  >
    {children}
  </h3>
);

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <li>
    <Link
      to={to}
      className="text-[var(--brand-background)]/70 hover:text-[var(--brand-accent)] text-sm
                 transition-colors duration-150 hover:translate-x-1
                 inline-block focus-visible:outline-none
                 focus-visible:ring-1 focus-visible:ring-[var(--brand-accent)] rounded"
    >
      {children}
    </Link>
  </li>
);

// ─── Main component ───────────────────────────────────────────────────────────

const Footer = () => {
  useLocalDataRevision();
  const settings = usePublicSettings();
  const categoryLinks = getAllCategories().filter((category) => category.isActive);
  const store = settings.store;
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-[var(--brand-dark)] text-[var(--brand-background)]"
      style={{ fontFamily: 'var(--font-body)' }}
      aria-label="Site footer"
    >
      {/* ── Main grid ───────────────────────────────────────── */}
      <div className="container max-w-7xl mx-auto px-6 py-14
                      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

        {/* Section 1 – Brand (spans 2 cols on lg) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 w-fit
                       focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-[var(--brand-accent)] rounded"
            aria-label="Dosti Tea & Coffee — home"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--brand-accent)] flex items-center
                            justify-center shrink-0">
              <Leaf size={20} className="text-[var(--brand-dark)]" aria-hidden="true" />
            </div>
            <div>
              <p
                className="text-base font-semibold text-white leading-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {store.name}
              </p>
              <p className="text-[10px] text-[var(--brand-accent)] tracking-wide leading-none mt-0.5">
                {store.tagline}
              </p>
            </div>
          </Link>

          {/* Description */}
          <p className="text-sm text-[var(--brand-background)]/65 leading-relaxed max-w-xs">
            Browse the current product catalog and find something for your next cup.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {socials.map(({ label, icon, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-lg border border-white/10
                           flex items-center justify-center
                           text-[var(--brand-background)]/60 hover:text-[var(--brand-accent)]
                           hover:border-[var(--brand-accent)]/50
                           transition-colors duration-150
                           focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-[var(--brand-accent)]"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Section 2 – Quick Links */}
        <div>
          <FooterHeading>Quick Links</FooterHeading>
          <ul className="space-y-2.5">
            {quickLinks.map((l) => <FooterLink key={l.to} to={l.to}>{l.label}</FooterLink>)}
          </ul>
        </div>

        {/* Section 3 – Categories */}
        <div>
          <FooterHeading>Categories</FooterHeading>
          <ul className="space-y-2.5">
            {categoryLinks.map((category) => <FooterLink key={category.id} to={`/category/${category.slug}`}>{category.name}</FooterLink>)}
          </ul>
        </div>

        {/* Section 4 – Support */}
        <div>
          <FooterHeading>Customer Support</FooterHeading>
          <ul className="space-y-2.5">
            {supportLinks.map((l) => <FooterLink key={l.label} to={l.to}>{l.label}</FooterLink>)}
          </ul>
        </div>
      </div>

      {/* ── Contact bar ─────────────────────────────────────── */}
      {(store.email || store.phone || store.address) && <div className="border-t border-white/8">
        <div className="container max-w-7xl mx-auto px-6 py-6
                        flex flex-col sm:flex-row sm:items-center
                        gap-4 sm:gap-8">
          {store.email && <div className="flex items-center gap-2 text-sm text-[var(--brand-background)]/65">
            <Mail size={14} className="text-[var(--brand-accent)] shrink-0" aria-hidden="true" />
            <a
              href={`mailto:${store.email}`}
              className="hover:text-[var(--brand-accent)] transition-colors focus-visible:outline-none
                         focus-visible:ring-1 focus-visible:ring-[var(--brand-accent)] rounded"
            >
              {store.email}
            </a>
          </div>}
          {store.phone && <div className="flex items-center gap-2 text-sm text-[var(--brand-background)]/65">
            <Phone size={14} className="text-[var(--brand-accent)] shrink-0" aria-hidden="true" />
            <span>{store.phone}</span>
          </div>}
          {store.address && <div className="flex items-start gap-2 text-sm text-[var(--brand-background)]/65">
            <MapPin size={14} className="text-[var(--brand-accent)] shrink-0 mt-0.5" aria-hidden="true" />
            <span>{store.address}</span>
          </div>}
        </div>
      </div>}

      {/* ── Bottom strip ────────────────────────────────────── */}
      <div className="border-t border-white/8 bg-[#0F2A1D]">
        <div className="container max-w-7xl mx-auto px-6 py-4
                        flex flex-col sm:flex-row items-center
                        justify-between gap-3 text-xs text-[var(--brand-background)]/45">
          <p>© {year} {store.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              to="/contact"
              className="hover:text-[var(--brand-accent)] transition-colors
                         focus-visible:outline-none focus-visible:ring-1
                         focus-visible:ring-[var(--brand-accent)] rounded"
            >
              Privacy Policy
            </Link>
            <Link
              to="/contact"
              className="hover:text-[var(--brand-accent)] transition-colors
                         focus-visible:outline-none focus-visible:ring-1
                         focus-visible:ring-[var(--brand-accent)] rounded"
            >
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
