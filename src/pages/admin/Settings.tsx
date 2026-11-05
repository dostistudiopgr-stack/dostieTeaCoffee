import { useState, type FormEvent } from 'react';
import {
  Save, Store, Truck, Package, User, Check,
  ShoppingCart, Bell, RotateCcw, AlertTriangle,
  Info, CreditCard, Palette,
} from 'lucide-react';
import {
  loadSettings, saveSettings, getDefaultSettings,
  type AdminSettings,
} from '../../utils/productStore';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LocalDataTools from '../../admin-components/settings/LocalDataTools';

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputCls = [
  'w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10',
].join(' ');

const inputErrCls = [
  'w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm text-[#292D28] bg-white',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200',
].join(' ');

const readonlyCls = [
  'w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#73786F]',
  'bg-[var(--brand-background)] cursor-default',
].join(' ');

const labelCls = 'text-sm font-medium text-[#292D28] mb-1.5 block';
const descCls  = 'text-xs text-[#73786F] mt-0.5';

// ─── Section card ─────────────────────────────────────────────────────────────

const Section = ({
  id, icon, title, description, children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden scroll-mt-20">
    <div className="px-6 py-4 border-b border-[#E8E4D9] bg-[var(--brand-background)]">
      <h2 className="text-sm font-semibold text-[#292D28] flex items-center gap-2"
          style={{ fontFamily: 'var(--font-heading)' }}>
        <span className="text-[var(--brand-primary)]">{icon}</span>
        {title}
      </h2>
      {description && <p className="text-xs text-[#73786F] mt-0.5">{description}</p>}
    </div>
    <div className="p-6">{children}</div>
  </section>
);

// ─── Toggle component ─────────────────────────────────────────────────────────

const Toggle = ({
  label, description, checked, onChange, warn,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warn?: string;
}) => (
  <label className="flex items-start justify-between gap-4 cursor-pointer group">
    <div className="min-w-0">
      <p className="text-sm font-medium text-[#292D28]">{label}</p>
      {description && <p className="text-xs text-[#73786F] mt-0.5 leading-relaxed">{description}</p>}
      {warn && checked && (
        <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
          <AlertTriangle size={11} />{warn}
        </p>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'shrink-0 w-11 h-6 rounded-full transition-colors duration-200 relative',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
        checked ? 'bg-[var(--brand-primary)]' : 'bg-[#E8E4D9]',
      ].join(' ')}
    >
      <span className={[
        'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow',
        'transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0',
      ].join(' ')} />
    </button>
  </label>
);

// ─── Field error ──────────────────────────────────────────────────────────────

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p role="alert" className="text-xs text-red-600 mt-1">{msg}</p> : null;

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'store',         icon: <Store        size={15} />, label: 'General'       },
  { id: 'branding',      icon: <Palette      size={15} />, label: 'Branding'      },
  { id: 'business',      icon: <ShoppingCart size={15} />, label: 'Business'      },
  { id: 'delivery',      icon: <Truck        size={15} />, label: 'Delivery'      },
  { id: 'payment-cfg',   icon: <CreditCard   size={15} />, label: 'Payments'      },
  { id: 'inventory',     icon: <Package      size={15} />, label: 'Inventory'     },
  { id: 'orders-config', icon: <ShoppingCart size={15} />, label: 'Orders'        },
  { id: 'notifications', icon: <Bell         size={15} />, label: 'Notifications' },
  { id: 'admin-profile', icon: <User         size={15} />, label: 'Admin Profile' },
];

// ─── Validation ────────────────────────────────────────────────────────────────

function validateSettings(s: AdminSettings): Record<string, string> {
  const e: Record<string, string> = {};
  if (!s.store.name.trim())                  e['store.name']              = 'Store name is required.';
  if (s.store.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.store.email)) e['store.email'] = 'Enter a valid email address.';
  if (s.store.phone && !/^[+\d\s().-]{7,20}$/.test(s.store.phone)) e['store.phone'] = 'Enter a valid phone number.';
  if (s.delivery.charge < 0)                 e['delivery.charge']         = 'Delivery charge cannot be negative.';
  if (s.delivery.freeThreshold < 0)          e['delivery.freeThreshold']  = 'Free delivery threshold cannot be negative.';
  if (s.business.minimumOrderAmount < 0)     e['business.minimumOrder']   = 'Minimum order amount cannot be negative.';
  if (s.inventory.lowStockThreshold < 1)     e['inventory.threshold']     = 'Low-stock threshold must be at least 1.';
  if (s.orders.returnWindowDays < 1)         e['orders.returnDays']       = 'Return window must be at least 1 day.';
  if ([s.branding.primary, s.branding.dark, s.branding.background, s.branding.accent].some((color) => !/^#[\da-f]{6}$/i.test(color))) e['branding.colors'] = 'Use a valid six-digit HEX color.';
  if (s.business.allowUpiQr && s.payment.merchantUpiId && !/^[\w.-]{2,}@[\w.-]{2,}$/.test(s.payment.merchantUpiId.trim())) e['payment.upi'] = 'Enter a valid UPI ID (for example, name@bank).';
  return e;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Settings() {
  const { admin } = useAdminAuth();
  const [settings,       setSettings]       = useState<AdminSettings>(loadSettings());
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [confirmReset,   setConfirmReset]   = useState(false);

  // Generic deep-set helper
  const update = <K extends keyof AdminSettings>(
    section: K,
    field: keyof AdminSettings[K],
    value: AdminSettings[K][keyof AdminSettings[K]]
  ) => {
    setSettings((s) => ({
      ...s,
      [section]: { ...s[section], [field]: value },
    } as AdminSettings));
    // Clear matching error
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${section}.${String(field)}`];
      return next;
    });
    setSaved(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validateSettings(settings);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const firstId = Object.keys(errs)[0].split('.')[0];
      document.getElementById(firstId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    saveSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 4000);
  };

  const handleReset = () => {
    const defaults = getDefaultSettings();
    saveSettings(defaults);
    setSettings(defaults);
    setErrors({});
    setSaved(false);
    setConfirmReset(false);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ── Sidebar nav (desktop) ────────────────────── */}
      <aside className="hidden lg:block w-48 shrink-0 sticky top-24">
        <nav className="bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
          {NAV_ITEMS.map(({ id, icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#73786F]
                         hover:bg-[var(--brand-background)] hover:text-[var(--brand-primary)] transition-colors text-left
                         border-b border-[#E8E4D9] last:border-0
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]"
            >
              <span className="text-[var(--brand-accent)] shrink-0">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main form ─────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex-1 min-w-0 flex flex-col gap-5"
      >
        {/* Page header */}
        <div>
          <h1 className="text-xl font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Settings
          </h1>
          <p className="text-sm text-[#73786F] mt-0.5">
            Configure store, business, delivery, inventory and admin settings.
            Changes are saved in this browser.
          </p>
        </div>

        {/* Success / error banners */}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                          rounded-xl px-4 py-3 text-sm text-emerald-700" role="status">
            <Check size={15} />Settings saved successfully.
          </div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200
                          rounded-xl px-4 py-3 text-sm text-red-700" role="alert">
            <AlertTriangle size={15} />Please fix the validation errors below before saving.
          </div>
        )}

        {/* ── A. General Store Settings ──────────────── */}
        <Section
          id="store"
          icon={<Store size={16} />}
          title="A — General Store Settings"
          description="Core store identity and contact information."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Store Name <span className="text-red-500">*</span></label>
              <input
                className={errors['store.name'] ? inputErrCls : inputCls}
                value={settings.store.name}
                onChange={(e) => update('store', 'name', e.target.value)}
              />
              <FieldError msg={errors['store.name']} />
            </div>
            <div>
              <label className={labelCls}>Tagline</label>
              <input
                className={inputCls}
                value={settings.store.tagline}
                onChange={(e) => update('store', 'tagline', e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Store Email</label>
              <input
                type="email"
                className={errors['store.email'] ? inputErrCls : inputCls}
                value={settings.store.email}
                onChange={(e) => update('store', 'email', e.target.value)}
                placeholder="hello@example.com"
              />
              <FieldError msg={errors['store.email']} />
            </div>
            <div>
              <label className={labelCls}>Store Phone</label>
              <input
                className={errors['store.phone'] ? inputErrCls : inputCls}
                value={settings.store.phone}
                onChange={(e) => update('store', 'phone', e.target.value)}
                placeholder="Store contact phone"
              />
              <FieldError msg={errors['store.phone']} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Store Address</label>
              <input
                className={inputCls}
                value={settings.store.address}
                onChange={(e) => update('store', 'address', e.target.value)}
                placeholder="Store address"
              />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <input className={readonlyCls} value="INR (₹) — Indian Rupee" readOnly />
              <p className={descCls}>Currency is fixed at INR for this business.</p>
            </div>
            <div>
              <label className={labelCls}>Time Zone</label>
              <input className={readonlyCls} value="Asia/Kolkata (IST, UTC+5:30)" readOnly />
              <p className={descCls}>Time zone is fixed at Indian Standard Time.</p>
            </div>
          </div>
        </Section>

        {/* ── B. Business Settings ───────────────────── */}
        <Section id="branding" icon={<Palette size={16} />} title="Branding" description="Choose the colors used throughout the storefront, customer pages and admin interface.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ['primary', 'Primary Color'], ['dark', 'Dark Color'],
              ['background', 'Background Color'], ['accent', 'Accent Color'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className={labelCls} htmlFor={`brand-${key}`}>{label}</label>
                <div className="flex items-center gap-3">
                  <input aria-label={`${label} picker`} type="color" value={settings.branding[key]} onChange={(e) => update('branding', key, e.target.value.toUpperCase())} className="h-11 w-14 cursor-pointer rounded-lg border border-[#E8E4D9] bg-white p-1" />
                  <input id={`brand-${key}`} className={inputCls} value={settings.branding[key]} maxLength={7} onChange={(e) => update('branding', key, e.target.value.toUpperCase())} />
                </div>
                <FieldError msg={errors['branding.colors']} />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl p-5" style={{ background: settings.branding.background, color: settings.branding.primary, border: `2px solid ${settings.branding.accent}` }}>
            <h3 className="font-semibold">{settings.store.name || 'Store name preview'}</h3>
            <p className="text-sm">{settings.store.tagline || 'Store tagline preview'}</p>
            <button type="button" className="mt-3 rounded-lg px-4 py-2 text-white" style={{ background: settings.branding.primary }}>Primary button preview</button>
            <button type="button" className="ml-2 rounded-lg px-4 py-2 text-white" style={{ background: settings.branding.dark }}>Dark button preview</button>
          </div>
        </Section>

        <Section
          id="business"
          icon={<ShoppingCart size={16} />}
          title="B — Business Settings"
          description="Order configuration and store availability."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Order ID Prefix</label>
              <input
                className={inputCls}
                value={settings.business.orderIdPrefix}
                onChange={(e) => update('business', 'orderIdPrefix', e.target.value)}
                placeholder="DTC"
                maxLength={10}
              />
              <p className={descCls}>New orders will use this prefix (e.g. DTC-2026-12345).</p>
            </div>
            <div>
              <label className={labelCls}>Minimum Order Amount (₹)</label>
              <input
                type="number"
                min="0"
                className={errors['business.minimumOrder'] ? inputErrCls : inputCls}
                value={settings.business.minimumOrderAmount}
                onChange={(e) => update('business', 'minimumOrderAmount', Math.max(0, Number(e.target.value)))}
              />
              <FieldError msg={errors['business.minimumOrder']} />
              <p className={descCls}>Set to 0 to allow any order amount.</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Toggle
              label="Allow Cash on Delivery (COD)"
              description="When enabled, customers can select COD at checkout. COD payment remains pending until manually marked as collected."
              checked={settings.business.allowCOD}
              onChange={(v) => update('business', 'allowCOD', v)}
            />
            <Toggle
              label="Maintenance Mode"
              description="When enabled, the store shows a maintenance message to customers. Admin panel remains accessible."
              checked={settings.business.maintenanceMode}
              onChange={(v) => update('business', 'maintenanceMode', v)}
              warn="Enabling maintenance mode will make the customer store inaccessible."
            />
          </div>
        </Section>

        {/* ── C. Delivery Settings ───────────────────── */}
        <Section
          id="delivery"
          icon={<Truck size={16} />}
          title="C — Delivery Settings"
          description="Delivery charges and estimated delivery time."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Delivery Charge (₹)</label>
              <input
                type="number"
                min="0"
                className={errors['delivery.charge'] ? inputErrCls : inputCls}
                value={settings.delivery.charge}
                onChange={(e) => update('delivery', 'charge', Math.max(0, Number(e.target.value)))}
              />
              <FieldError msg={errors['delivery.charge']} />
            </div>
            <div>
              <label className={labelCls}>Free Delivery Above (₹)</label>
              <input
                type="number"
                min="0"
                className={errors['delivery.freeThreshold'] ? inputErrCls : inputCls}
                value={settings.delivery.freeThreshold}
                onChange={(e) => update('delivery', 'freeThreshold', Math.max(0, Number(e.target.value)))}
              />
              <FieldError msg={errors['delivery.freeThreshold']} />
            </div>
            <div>
              <label className={labelCls}>Estimated Delivery Time</label>
              <input
                className={inputCls}
                value={settings.delivery.estimatedDays}
                onChange={(e) => update('delivery', 'estimatedDays', e.target.value)}
                placeholder="3–5 business days"
              />
            </div>
          </div>
        </Section>

        {/* ── C2. Payment Settings ───────────────────── */}
        <Section
          id="payment-cfg"
          icon={<CreditCard size={16} />}
          title="C2 — Payment Settings"
          description="Enable/disable payment methods and configure UPI merchant details."
        >
          <div className="flex flex-col gap-4 mb-5">
            <Toggle
              label="Enable Cash on Delivery (COD)"
              description="Allow customers to select COD at checkout. Payment remains pending until manually collected."
              checked={settings.business.allowCOD}
              onChange={(v) => update('business', 'allowCOD', v)}
            />
            <Toggle
              label="Enable Online Payment"
              description="Show an online payment option. Payment is confirmed manually in this local setup."
              checked={settings.business.allowOnlinePayment}
              onChange={(v) => update('business', 'allowOnlinePayment', v)}
            />
            <Toggle
              label="Enable UPI QR Code Payment"
              description="Show a UPI QR code at checkout for customers to scan and pay via any UPI app."
              checked={settings.business.allowUpiQr}
              onChange={(v) => update('business', 'allowUpiQr', v)}
            />

            {/* Card — Coming Soon */}
            <div className="flex items-start justify-between gap-4 opacity-60 cursor-not-allowed">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#73786F]">
                  Enable Card Payment
                  <span className="text-[10px] font-bold text-[#73786F] bg-[#E8E4D9] px-2 py-0.5 rounded-full ml-2">Coming Soon</span>
                </p>
                <p className="text-xs text-[#73786F] mt-0.5 leading-relaxed">
                  A real card payment gateway (e.g. Razorpay, Stripe) is not yet integrated. No card numbers, CVV or sensitive card details are collected or stored.
                </p>
              </div>
              <div className="shrink-0 w-11 h-6 rounded-full bg-[#E8E4D9] relative pointer-events-none">
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow" />
              </div>
            </div>
          </div>

          {settings.business.allowUpiQr && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E8E4D9]">
              <div>
                <label className={labelCls}>Merchant UPI ID</label>
                <input
                  className={errors['payment.upi'] ? inputErrCls : inputCls}
                  value={settings.payment.merchantUpiId}
                  onChange={(e) => update('payment', 'merchantUpiId' as keyof typeof settings.payment, e.target.value)}
                  placeholder="merchant@upi"
                />
                <FieldError msg={errors['payment.upi']} />
                <p className={descCls}>
                  Enter your business UPI ID. This will be encoded in the QR code for customers to scan.
                  No payment credentials or secrets are stored here.
                </p>
                {!settings.payment.merchantUpiId.trim() && (
                  <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                    <AlertTriangle size={11} />UPI QR is enabled but no merchant UPI ID is configured.
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Merchant Display Name</label>
                <input
                  className={inputCls}
                  value={settings.payment.merchantName}
                  onChange={(e) => update('payment', 'merchantName' as keyof typeof settings.payment, e.target.value)}
                  placeholder="Dosti Tea & Coffee"
                />
                <p className={descCls}>
                  This name appears in the customer's UPI app when they scan the QR code.
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              Payment security: UPI QR scanning or customer confirmation is NOT proof of payment.
              All payments remain <strong>pending</strong> until verified. No real payment gateway is integrated in this demo.
            </p>
          </div>
        </Section>

        {/* ── D. Inventory Settings ──────────────────── */}        <Section
          id="inventory"
          icon={<Package size={16} />}
          title="D — Inventory Settings"
          description="Stock alert thresholds and out-of-stock product behaviour. Changes affect the Inventory module immediately."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>
                Low-Stock Alert Threshold (units)
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="number"
                min="1"
                className={errors['inventory.threshold'] ? inputErrCls : inputCls}
                value={settings.inventory.lowStockThreshold}
                onChange={(e) => update('inventory', 'lowStockThreshold', Math.max(1, Number(e.target.value)))}
              />
              <FieldError msg={errors['inventory.threshold']} />
              <p className={descCls}>
                Variants at or below this quantity show a Low Stock warning. Used by the Inventory, Reports and Dashboard modules.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <Toggle
              label="Hide Out-of-Stock Products from Shop"
              description="When enabled, products with zero stock across all variants will not be displayed in the customer shop."
              checked={settings.inventory.hideOutOfStockProducts}
              onChange={(v) => update('inventory', 'hideOutOfStockProducts', v)}
            />
            <Toggle
              label="Prevent Ordering on Zero Stock"
              description="When enabled, customers cannot add out-of-stock variants to their cart or proceed to checkout with them."
              checked={settings.inventory.preventOrderOnZeroStock}
              onChange={(v) => update('inventory', 'preventOrderOnZeroStock', v)}
            />
          </div>
        </Section>

        {/* ── E. Order Settings ──────────────────────── */}
        <Section
          id="orders-config"
          icon={<ShoppingCart size={16} />}
          title="E — Order Settings"
          description="Order cancellation, return policies and COD payment behaviour."
        >
          <div className="flex flex-col gap-4 mb-4">
            <Toggle
              label="Allow Cancellation Before Shipment"
              description="Customers can cancel orders while status is Pending or Confirmed. Orders in Processing or later cannot be cancelled by customers."
              checked={settings.orders.allowCancellationBeforeShipment}
              onChange={(v) => update('orders', 'allowCancellationBeforeShipment', v)}
            />
            <Toggle
              label="Allow Returns After Delivery"
              description="Customers can request a return after an order is delivered, within the return window."
              checked={settings.orders.allowReturnsAfterDelivery}
              onChange={(v) => update('orders', 'allowReturnsAfterDelivery', v)}
            />
          </div>
          {settings.orders.allowReturnsAfterDelivery && (
            <div className="max-w-xs">
              <label className={labelCls}>Return Window (days)</label>
              <input
                type="number"
                min="1"
                max="30"
                className={errors['orders.returnDays'] ? inputErrCls : inputCls}
                value={settings.orders.returnWindowDays}
                onChange={(e) => update('orders', 'returnWindowDays', Math.max(1, Number(e.target.value)))}
              />
              <FieldError msg={errors['orders.returnDays']} />
              <p className={descCls}>Number of days after delivery within which returns are allowed.</p>
            </div>
          )}
          <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              COD payment always remains <strong>Pending</strong> until an admin manually marks it as paid in the Order Details page. This behaviour cannot be changed via settings.
            </p>
          </div>
        </Section>

        {/* ── F. Notification Preferences ────────────── */}
        <Section
          id="notifications"
          icon={<Bell size={16} />}
          title="F — Notification Preferences"
          description="Frontend-only preference flags. No real email or SMS notifications are sent in this demo."
        >
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              These are display preference flags only. This demo does not send real email or SMS notifications. Backend notification integration is required for actual delivery.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Toggle
              label="New Order Notification"
              description="Show a notification indicator in the admin header when a new order is placed."
              checked={settings.notifications.newOrder}
              onChange={(v) => update('notifications', 'newOrder', v)}
            />
            <Toggle
              label="Low Stock Notification"
              description="Show a notification indicator when product variants reach the low-stock threshold."
              checked={settings.notifications.lowStock}
              onChange={(v) => update('notifications', 'lowStock', v)}
            />
            <Toggle
              label="Customer Registration Notification"
              description="Show a notification indicator when a new customer registers an account."
              checked={settings.notifications.customerRegistration}
              onChange={(v) => update('notifications', 'customerRegistration', v)}
            />
          </div>
        </Section>

        {/* ── G. Admin Profile ───────────────────────── */}
        <Section
          id="admin-profile"
          icon={<User size={16} />}
          title="G — Admin Profile"
          description="Your current admin account details. Password is never displayed or accessible from this panel."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Display Name</label>
              <input
                className={inputCls}
                value={settings.admin.name}
                onChange={(e) => update('admin', 'name', e.target.value)}
                placeholder="Admin User"
              />
              <p className={descCls}>This name is shown in the admin header. It does not change your login credentials.</p>
            </div>
            <div>
              <label className={labelCls}>Admin Email</label>
              <input
                className={readonlyCls}
                value={admin?.email ?? settings.admin.email}
                readOnly
              />
              <p className={descCls}>Email is read-only. Change it via the authentication system.</p>
            </div>
            {admin && (
              <div className="sm:col-span-2 flex items-start gap-2 bg-[var(--brand-background)] border border-[#E8E4D9] rounded-xl px-4 py-3">
                <Info size={14} className="text-[var(--brand-primary)] shrink-0 mt-0.5" />
                <p className="text-xs text-[#73786F] leading-relaxed">
                  Currently signed in as <strong className="text-[#292D28]">{admin.name}</strong> ({admin.email}).
                  Passwords, tokens and authentication secrets are never displayed here.
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* ── Form actions ─────────────────────────────── */}
        <LocalDataTools />
        <div className="flex flex-wrap gap-3 py-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[var(--brand-primary)] text-white font-semibold text-sm
                       px-7 py-3 rounded-xl hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : saved
              ? <><Check size={16} />Saved!</>
              : <><Save size={16} />Save Settings</>}
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-2 border border-[#E8E4D9] text-[#73786F]
                       font-semibold text-sm px-7 py-3 rounded-xl hover:bg-[var(--brand-background)]
                       hover:text-[#292D28] transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
          >
            <RotateCcw size={15} />Reset to Defaults
          </button>
        </div>

      </form>

      {/* Reset confirmation */}
      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Reset All Settings?"
        description="This will restore all settings to their factory defaults. Your current settings will be lost. This action cannot be undone."
        confirmLabel="Yes, Reset All"
        variant="danger"
      />
    </div>
  );
}
