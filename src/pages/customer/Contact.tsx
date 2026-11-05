import { useState, type FormEvent } from 'react';
import {
  Mail, Phone, MapPin, Send, AlertCircle, CheckCircle,
  ChevronDown, User, MessageSquare,
} from 'lucide-react';
import SectionTitle from '../../components/common/SectionTitle';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import { createId, readJson, writeJson, STORAGE_KEYS } from '../../utils/storage';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

// ─── Mock contact info ────────────────────────────────────────────────────────

// ─── FAQ data ──────────────────────────────────────────────────────────────────

const FAQS: { q: string; a: string }[] = [];

// ─── Validation ────────────────────────────────────────────────────────────────

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPhone = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));

const inputCls = (err?: string) => [
  'w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:ring-2',
  err
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
].join(' ');

// ─── Page ─────────────────────────────────────────────────────────────────────

const Contact = () => {
  useLocalDataRevision();
  const { store } = usePublicSettings();
  const CONTACT_INFO = { email: store.email, phone: store.phone, address: store.address };
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                   e.name = 'Name is required.';
    if (!isValidEmail(form.email))           e.email = 'Enter a valid email address.';
    if (form.phone && !isValidPhone(form.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (!form.subject.trim())                e.subject = 'Subject is required.';
    if (!form.message.trim())                e.message = 'Please enter your message.';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    const messages = readJson<Record<string, unknown>[]>(STORAGE_KEYS.CONTACT_MESSAGES, []);
    writeJson(STORAGE_KEYS.CONTACT_MESSAGES, [{ id: createId('message'), ...form, createdAt: new Date().toISOString() }, ...messages]);
    setLoading(false);
    setSent(true);
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Page header ──────────────────────────────────── */}
      <section className="bg-[var(--brand-background)] py-12 sm:py-16">
        <div className="container max-w-7xl mx-auto px-6 text-center">
          <SectionTitle
            eyebrow="Get In Touch"
            title="Contact Us"
            subtitle="Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as we can."
            alignment="center"
          />
        </div>
      </section>

      {/* ── Contact info cards ────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: <Mail   size={22} />, label: 'Email Us', value: CONTACT_INFO.email, href: `mailto:${CONTACT_INFO.email}` },
              { icon: <Phone  size={22} />, label: 'Call Us', value: CONTACT_INFO.phone, href: `tel:${CONTACT_INFO.phone}` },
              { icon: <MapPin size={22} />, label: 'Visit Us', value: CONTACT_INFO.address, href: '' },
            ].filter((item) => item.value).map(({ icon, label, value, href }) => (
              <div key={label} className="bg-[var(--brand-background)] rounded-2xl border border-[#E8E4D9]
                                          p-6 flex flex-col items-center text-center gap-3
                                          hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center
                                justify-center text-[var(--brand-primary)]">
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-accent)]">{label}</p>
                  {href ? <a href={href}
                    className="text-sm font-medium text-[#292D28] hover:text-[var(--brand-primary)]
                               transition-colors mt-1 block break-all"
                  >
                    {value}
                  </a> : <p className="text-sm font-medium text-[#292D28] mt-1">{value}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* ── Form + business hours ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E4D9]
                            p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-semibold text-[#292D28] mb-5"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                Send Us a Message
              </h2>

              {sent && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                                rounded-xl px-4 py-3 mb-5 text-sm text-emerald-700">
                  <CheckCircle size={15} aria-hidden="true" />
                  Message saved in this browser. It has not been sent by email.
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#292D28]">
                    Name<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                         text-[#73786F] pointer-events-none" aria-hidden="true" />
                    <input name="name" type="text" value={form.name} onChange={onChange}
                           placeholder="Your full name"
                           className={[inputCls(errors.name), 'pl-10'].join(' ')} />
                  </div>
                  {errors.name && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors.name}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#292D28]">
                    Email<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                        text-[#73786F] pointer-events-none" aria-hidden="true" />
                    <input name="email" type="email" value={form.email} onChange={onChange}
                           placeholder="you@example.com"
                           className={[inputCls(errors.email), 'pl-10'].join(' ')} />
                  </div>
                  {errors.email && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#292D28]">
                    Phone <span className="text-[#73786F] text-xs">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2
                                         text-[#73786F] pointer-events-none" aria-hidden="true" />
                    <input name="phone" type="tel" value={form.phone} onChange={onChange}
                           placeholder="10-digit mobile" maxLength={10}
                           className={[inputCls(errors.phone), 'pl-10'].join(' ')} />
                  </div>
                  {errors.phone && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors.phone}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#292D28]">
                    Subject<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input name="subject" type="text" value={form.subject} onChange={onChange}
                         placeholder="What is this about?"
                         className={inputCls(errors.subject)} />
                  {errors.subject && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors.subject}</p>}
                </div>

                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[#292D28]">
                    Message<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare size={15} className="absolute left-3.5 top-3.5
                                            text-[#73786F] pointer-events-none" aria-hidden="true" />
                    <textarea name="message" rows={5} value={form.message} onChange={onChange}
                              placeholder="Tell us how we can help…"
                              className={[inputCls(errors.message), 'pl-10 pt-2.5 resize-y'].join(' ')} />
                  </div>
                  {errors.message && <p role="alert" className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={11} />{errors.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <button type="submit" disabled={loading}
                          className="w-full sm:w-auto flex items-center justify-center gap-2
                                     bg-[var(--brand-primary)] text-white font-semibold text-sm px-8 py-3.5
                                     rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                                     disabled:opacity-70
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-[var(--brand-accent)]">
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                      : <><Send size={15} aria-hidden="true" />Send Message</>}
                  </button>
                </div>
              </form>
            </div>

            <aside className="rounded-2xl border border-[#E8E4D9] bg-[var(--brand-background)] p-6 text-sm text-[#73786F]">
              Contact details are configured by the store owner. The form does not send email from this browser-only application.
            </aside>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      {FAQS.length > 0 && <section id="faq" className="py-16 sm:py-20 bg-[var(--brand-background)]">
        <div className="container max-w-3xl mx-auto px-6">
          <SectionTitle
            eyebrow="Common Questions"
            title="Frequently Asked Questions"
            alignment="center"
            className="mb-10"
          />
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#E8E4D9]
                                         overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                  className="w-full flex items-center justify-between gap-3
                             px-5 py-4 text-left hover:bg-[var(--brand-background)] transition-colors
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-[var(--brand-accent)]"
                >
                  <span className="text-sm font-semibold text-[#292D28]">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-[#73786F] shrink-0 transition-transform
                                 duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm text-[#73786F] leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>}
    </div>
  );
};

export default Contact;
