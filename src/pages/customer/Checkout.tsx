import { useState, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, User, MapPin,
  ClipboardList, CreditCard, Check, Package,
  AlertCircle, PlusCircle, Navigation,
} from 'lucide-react';
import MapAddressPicker, { type MapPickedAddress } from '../../components/common/MapAddressPicker';
import { useCart }        from '../../hooks/useCart';
import { useAuth }        from '../../hooks/useAuth';
import CartSummary        from '../../components/cart/CartSummary';
import { formatINR }      from '../../utils/formatPrice';
import { INDIAN_STATES }  from '../../utils/constants';
import {
  createOrder,
  loadSavedAddress,
  saveAddress,
}                         from '../../utils/orderUtils';
import { usePublicSettings } from '../../hooks/usePublicSettings';
import type { ShippingAddress } from '../../types';

// ─── Step config ──────────────────────────────────────────────────────────────

type StepId = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1 as StepId, label: 'Delivery Info',  icon: <User       size={16} aria-hidden="true" /> },
  { id: 2 as StepId, label: 'Address',        icon: <MapPin     size={16} aria-hidden="true" /> },
  { id: 3 as StepId, label: 'Review Order',   icon: <ClipboardList size={16} aria-hidden="true" /> },
  { id: 4 as StepId, label: 'Payment',        icon: <CreditCard size={16} aria-hidden="true" /> },
];

// ─── Form types ───────────────────────────────────────────────────────────────

interface CustomerInfo {
  fullName: string;
  phone:    string;
  email:    string;
}

interface AddressForm extends Omit<ShippingAddress, 'country'> {
  addressType: 'Home' | 'Work' | 'Other';
  landmark:    string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const isValidIndianPhone  = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));
const isValidEmail        = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidPincode      = (v: string) => /^[1-9][0-9]{5}$/.test(v.trim());

function validateCustomer(c: CustomerInfo): Record<string, string> {
  const e: Record<string, string> = {};
  if (!c.fullName.trim())            e.fullName = 'Full name is required.';
  if (!isValidIndianPhone(c.phone))  e.phone    = 'Enter a valid 10-digit Indian mobile number.';
  if (!isValidEmail(c.email))        e.email    = 'Enter a valid email address.';
  return e;
}

function validateAddress(a: AddressForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (!a.addressLine1.trim()) e.addressLine1 = 'House / flat number is required.';
  if (!a.city.trim())         e.city         = 'City is required.';
  if (!a.state.trim())        e.state        = 'State is required.';
  if (!isValidPincode(a.pincode)) e.pincode  = 'Enter a valid 6-digit PIN code.';
  return e;
}

// ─── Field component ──────────────────────────────────────────────────────────

const Field = ({
  label, required = false, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-[#292D28]">
      {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
    </label>
    {children}
    {error && (
      <p role="alert" className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle size={11} aria-hidden="true" />{error}
      </p>
    )}
  </div>
);

const inputCls = (err?: string) => [
  'w-full rounded-xl border px-4 py-2.5 text-sm text-[#292D28]',
  'placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:ring-2',
  err
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
].join(' ');

// ─── Step indicator ───────────────────────────────────────────────────────────

const StepBar = ({ current }: { current: StepId }) => (
  <div className="flex items-center justify-center gap-0 overflow-x-auto pb-1 mb-8">
    {STEPS.map((step, idx) => {
      const done   = step.id < current;
      const active = step.id === current;
      return (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={[
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold',
              'border-2 transition-all',
              done   ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white'
              : active ? 'bg-white border-[var(--brand-primary)] text-[var(--brand-primary)]'
              :          'bg-white border-[#E8E4D9] text-[#73786F]',
            ].join(' ')}>
              {done ? <Check size={16} aria-hidden="true" /> : step.id}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap hidden sm:block
                              ${active ? 'text-[var(--brand-primary)]' : done ? 'text-[#73786F]' : 'text-[#C5C5C5]'}`}>
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`w-10 sm:w-16 h-0.5 mb-4 mx-1 transition-colors
                             ${done ? 'bg-[var(--brand-primary)]' : 'bg-[#E8E4D9]'}`} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

const Checkout = () => {
  const navigate  = useNavigate();
  const { items, summary, couponCode, clearCart } = useCart();
  const { user }  = useAuth();

  // Read admin settings once
  const adminSettings = usePublicSettings();
  const codEnabled     = adminSettings.business.allowCOD;
  const minOrderAmount = adminSettings.business.minimumOrderAmount ?? 0;

  const [step,     setStep]     = useState<StepId>(1);
  const [placing,  setPlacing]  = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false); // prevent duplicate
  const [checkoutError, setCheckoutError] = useState('');

  // Map picker state (Step 2)
  const [showMap, setShowMap] = useState(false);
  const handleMapConfirm = (picked: MapPickedAddress) => {
    setAddress((a) => ({
      ...a,
      addressLine1: picked.addressLine1 || a.addressLine1,
      city:         picked.city         || a.city,
      state:        picked.state        || a.state,
      pincode:      picked.pincode      || a.pincode,
      lat:          picked.lat,
      lng:          picked.lng,
    }));
    setAddressErrors({});
    setShowMap(false);
  };

  // Payment method selection
  type PayMethod = 'cod' | 'online' | 'upi_qr';
  const [selectedPayMethod, setSelectedPayMethod] = useState<PayMethod>(() =>
    codEnabled ? 'cod'
      : adminSettings.business.allowOnlinePayment ? 'online'
      : adminSettings.business.allowUpiQr ? 'upi_qr' : 'cod'
  );
  const [onlinePayState, setOnlinePayState]       = useState<'idle' | 'processing' | 'pending'>('idle');
  const [upiCopied,     setUpiCopied]     = useState(false);
  const [upiConfirmed,  setUpiConfirmed]  = useState(false);

  // UPI validation
  const upiId = adminSettings.payment?.merchantUpiId ?? '';
  const upiIdValid = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim());
  const upiUri = upiIdValid
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(adminSettings.payment?.merchantName || adminSettings.store.name)}&am=${summary.total}&cu=${encodeURIComponent(adminSettings.store.currency)}&tn=${encodeURIComponent(`${adminSettings.store.name} Order`)}`
    : '';

  // Customer info — pre-fill from auth user if logged in
  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: user?.name  ?? '',
    phone:    user?.phone ?? '',
    email:    user?.email ?? '',
  });
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({});

  // Saved addresses from auth (if logged in)
  const savedAddresses = user?.addresses ?? [];
  const defaultAddr    = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
  const [selectedSavedId, setSelectedSavedId] = useState<string | 'new'>(
    defaultAddr ? defaultAddr.id : 'new'
  );

  // Address form — pre-fill from selected saved address or localStorage
  const [address, setAddress] = useState<AddressForm>(() => {
    if (defaultAddr) {
      return {
        fullName:     defaultAddr.fullName,
        phone:        defaultAddr.phone,
        addressLine1: defaultAddr.addressLine1,
        addressLine2: defaultAddr.addressLine2 ?? '',
        landmark:     defaultAddr.landmark ?? '',
        city:         defaultAddr.city,
        state:        defaultAddr.state,
        pincode:      defaultAddr.pincode,
        addressType:  defaultAddr.label as 'Home' | 'Work' | 'Other',
      };
    }
    const saved = loadSavedAddress();
    return {
      fullName:     saved?.fullName     ?? '',
      phone:        saved?.phone        ?? '',
      addressLine1: saved?.addressLine1 ?? '',
      addressLine2: saved?.addressLine2 ?? '',
      landmark:     '',
      city:         saved?.city         ?? '',
      state:        saved?.state        ?? '',
      pincode:      saved?.pincode      ?? '',
      addressType:  'Home',
    };
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const isEmpty = items.length === 0;

  // ── Field change handlers ──────────────────────────────────────────────────

  const onCustomer = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
    setCustomerErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const onAddress = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    setAddressErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Step navigation ────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === 1) {
      const errors = validateCustomer(customer);
      if (Object.keys(errors).length) { setCustomerErrors(errors); return; }
      // Minimum order amount check
      if (minOrderAmount > 0 && summary.subtotal < minOrderAmount) {
        setCustomerErrors({
          fullName: `Minimum order amount is ${formatINR(minOrderAmount)}. Your cart total is ${formatINR(summary.subtotal)}.`,
        });
        return;
      }
    }
    if (step === 2) {
      const errors = validateAddress(address);
      if (Object.keys(errors).length) { setAddressErrors(errors); return; }
      // Sync address fullName/phone with customer if blank
      if (!address.fullName.trim()) setAddress((a) => ({ ...a, fullName: customer.fullName }));
      if (!address.phone.trim())    setAddress((a) => ({ ...a, phone: customer.phone }));
    }
    setStep((s) => Math.min(4, s + 1) as StepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStep((s) => Math.max(1, s - 1) as StepId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Online payment handler (demo) ─────────────────────────────────────────
  const handleOnlinePay = async () => {
    setOnlinePayState('processing');
    await new Promise((r) => setTimeout(r, 1500));
    // Demo: always goes to pending — never marks as paid
    setOnlinePayState('pending');
  };

  // ── UPI confirmation handler ───────────────────────────────────────────────
  const handleUpiConfirm = () => {
    setUpiConfirmed(true);
    // Payment stays pending — customer confirmation is NOT proof of payment
  };

  // ── Place order ───────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (isEmpty || placing || orderPlaced) return; // prevent duplicate
    setPlacing(true);

    // Determine payment method label
    const payMethodLabel =
      selectedPayMethod === 'cod' ? 'Cash on Delivery'
      : selectedPayMethod === 'online' ? 'Online Payment'
      : 'UPI QR Payment';

    const shippingAddress: ShippingAddress = {
      fullName:     address.fullName || customer.fullName,
      phone:        address.phone    || customer.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? undefined,
      city:         address.city,
      state:        address.state,
      pincode:      address.pincode,
      country:      'India',
      lat:          address.lat,
      lng:          address.lng,
    };

    saveAddress(shippingAddress);

    let order;
    try {
      order = createOrder({
      userId:          user?.id ?? 'guest',
      items,
      shippingAddress,
      subtotal:        summary.subtotal,
      discount:        summary.discount,
      shippingCharge:  summary.shipping,
      tax:             summary.tax,
      total:           summary.total,
      couponCode:      couponCode || undefined,
      paymentMethod:   payMethodLabel,
      });
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Could not place your order. Please try again.');
      setPlacing(false);
      return;
    }

    // Short UX delay so the user sees the loading state
    await new Promise((r) => setTimeout(r, 500));

    clearCart();
    setPlacing(false);
    setOrderPlaced(true); // mark done — prevents re-click
    navigate(`/order-confirmation/${order.id}`);
  };

  // ── Redirect if cart is empty (except after order placement) ──────────────

  if (isEmpty && step !== 4) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6">
        <Package size={48} strokeWidth={1.5} className="text-[#73786F]" />
        <p className="text-lg font-semibold text-[#292D28]"
           style={{ fontFamily: 'var(--font-heading)' }}>
          Your cart is empty
        </p>
        <Link to="/shop"
              className="bg-[var(--brand-primary)] text-white text-sm font-semibold px-6 py-3
                         rounded-xl hover:bg-[var(--brand-dark)] transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--brand-background)] py-8 sm:py-12"
         style={{ fontFamily: 'var(--font-body)' }}>
      <div className="container max-w-5xl mx-auto px-6">

        {/* Page heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-[#73786F] mb-2">
            <Link to="/cart" className="hover:text-[var(--brand-primary)] transition-colors">Cart</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-[#292D28] font-medium">Checkout</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            Checkout
          </h1>
        </div>

        {/* Step indicator */}
        <StepBar current={step} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── Main form area ──────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* ── STEP 1: Customer info ─────────────────── */}
            {step === 1 && (
              <section className="bg-white rounded-2xl border border-[#E8E4D9] p-6">
                <h2 className="text-base font-semibold text-[#292D28] mb-5 flex items-center gap-2">
                  <User size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
                  Your Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Full Name" required error={customerErrors.fullName}>
                      <input name="fullName" type="text" value={customer.fullName}
                             onChange={onCustomer} placeholder="Customer name"
                             className={inputCls(customerErrors.fullName)} />
                    </Field>
                  </div>
                  <Field label="Mobile Number" required error={customerErrors.phone}>
                    <input name="phone" type="tel" value={customer.phone}
                           onChange={onCustomer} placeholder="10-digit mobile number"
                           maxLength={10}
                           className={inputCls(customerErrors.phone)} />
                  </Field>
                  <Field label="Email Address" required error={customerErrors.email}>
                    <input name="email" type="email" value={customer.email}
                           onChange={onCustomer} placeholder="you@example.com"
                           className={inputCls(customerErrors.email)} />
                  </Field>
                </div>
              </section>
            )}

            {/* ── STEP 2: Delivery address ──────────────── */}
            {step === 2 && (
              <section className="bg-white rounded-2xl border border-[#E8E4D9] p-6">
                <h2 className="text-base font-semibold text-[#292D28] mb-5 flex items-center gap-2">
                  <MapPin size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
                  Delivery Address
                </h2>

                {/* Saved addresses (logged-in users) */}
                {savedAddresses.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-[#73786F] uppercase tracking-wide mb-2">
                      Saved Addresses
                    </p>
                    <div className="flex flex-col gap-2">
                      {savedAddresses.map((sa) => (
                        <label key={sa.id}
                               className={[
                                 'flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer',
                                 'transition-all',
                                 selectedSavedId === sa.id
                                   ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/6'
                                   : 'border-[#E8E4D9] hover:border-[var(--brand-primary)]/30',
                               ].join(' ')}>
                          <input type="radio" name="saved-addr"
                                 checked={selectedSavedId === sa.id}
                                 onChange={() => {
                                   setSelectedSavedId(sa.id);
                                   setAddress({
                                     fullName: sa.fullName, phone: sa.phone,
                                     addressLine1: sa.addressLine1, addressLine2: sa.addressLine2 ?? '',
                                     landmark: sa.landmark ?? '', city: sa.city,
                                     state: sa.state, pincode: sa.pincode,
                                     addressType: sa.label as 'Home' | 'Work' | 'Other',
                                   });
                                 }}
                                 className="w-4 h-4 mt-0.5 accent-[var(--brand-primary)] shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-[var(--brand-accent)] uppercase">{sa.label}</p>
                            <p className="text-sm font-medium text-[#292D28]">{sa.fullName}</p>
                            <p className="text-xs text-[#73786F]">
                              {sa.addressLine1}{sa.addressLine2 && `, ${sa.addressLine2}`}, {sa.city}, {sa.state} — {sa.pincode}
                            </p>
                          </div>
                        </label>
                      ))}
                      <label className={[
                               'flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',
                               selectedSavedId === 'new'
                                 ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/6'
                                 : 'border-[#E8E4D9] hover:border-[var(--brand-primary)]/30',
                             ].join(' ')}>
                        <input type="radio" name="saved-addr"
                               checked={selectedSavedId === 'new'}
                               onChange={() => {
                                 setSelectedSavedId('new');
                                 setAddress({ fullName: customer.fullName, phone: customer.phone,
                                              addressLine1: '', addressLine2: '', landmark: '',
                                              city: '', state: '', pincode: '', addressType: 'Home' });
                               }}
                               className="w-4 h-4 accent-[var(--brand-primary)] shrink-0" />
                        <span className="flex items-center gap-2 text-sm font-medium text-[#292D28]">
                          <PlusCircle size={15} className="text-[var(--brand-primary)]" aria-hidden="true" />
                          Enter a new address
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Address form — shown when 'new' or no saved addresses */}
                {(selectedSavedId === 'new' || savedAddresses.length === 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Field label="House / Flat / Building" required error={addressErrors.addressLine1}>
                        <input name="addressLine1" type="text" value={address.addressLine1}
                               onChange={onAddress} placeholder="e.g. 204, Green Meadows CHS"
                               className={inputCls(addressErrors.addressLine1)} />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="Street / Area / Locality" error={addressErrors.addressLine2}>
                        <input name="addressLine2" type="text" value={address.addressLine2 ?? ''}
                               onChange={onAddress} placeholder="e.g. Andheri West"
                               className={inputCls()} />
                      </Field>
                    </div>
                    <Field label="Landmark (optional)">
                      <input name="landmark" type="text" value={address.landmark}
                             onChange={onAddress} placeholder="e.g. Near Metro Station"
                             className={inputCls()} />
                    </Field>
                    <Field label="City" required error={addressErrors.city}>
                      <input name="city" type="text" value={address.city}
                             onChange={onAddress} placeholder="City"
                             className={inputCls(addressErrors.city)} />
                    </Field>
                    <Field label="State" required error={addressErrors.state}>
                      <select name="state" value={address.state} onChange={onAddress}
                              className={inputCls(addressErrors.state)}>
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="PIN Code" required error={addressErrors.pincode}>
                      <input name="pincode" type="text" value={address.pincode}
                             onChange={onAddress} placeholder="6-digit PIN code"
                             maxLength={6}
                             className={inputCls(addressErrors.pincode)} />
                    </Field>

                    {/* Address type */}
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-[#292D28] mb-2">Address Type</p>
                      <div className="flex gap-3">
                        {(['Home', 'Work', 'Other'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setAddress((a) => ({ ...a, addressType: type }))}
                            aria-pressed={address.addressType === type}
                            className={[
                              'px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                              address.addressType === type
                                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                                : 'border-[#E8E4D9] text-[#73786F] hover:border-[var(--brand-primary)]/40',
                            ].join(' ')}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pick on map */}
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]
                                   border border-[var(--brand-primary)]/40 px-4 py-2.5 rounded-xl
                                   hover:bg-[var(--brand-primary)]/6 transition-colors w-full justify-center
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-[var(--brand-accent)]"
                      >
                        <Navigation size={15} aria-hidden="true" />
                        Pick Location on Map
                      </button>
                      <p className="text-[10px] text-[#73786F] text-center mt-1.5">
                        Auto-fills address, city, state and PIN from your location
                      </p>
                    </div>
                  </div>
                )}

                {/* Map picker modal */}
                {showMap && (
                  <MapAddressPicker
                    onConfirm={handleMapConfirm}
                    onClose={() => setShowMap(false)}
                  />
                )}
              </section>
            )}

            {/* ── STEP 3: Order review ──────────────────── */}
            {step === 3 && (
              <section className="bg-white rounded-2xl border border-[#E8E4D9] p-6">
                <h2 className="text-base font-semibold text-[#292D28] mb-5 flex items-center gap-2">
                  <ClipboardList size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
                  Review Your Order
                </h2>

                {/* Items */}
                <div className="flex flex-col gap-3 mb-6">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId}`}
                         className="flex items-center gap-3.5 p-3 bg-[var(--brand-background)]
                                    rounded-xl border border-[#E8E4D9]">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0">
                        <img src={item.thumbnail} alt={item.name} loading="lazy"
                             className="w-full h-full object-cover"
                             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#292D28] truncate">{item.name}</p>
                        <p className="text-xs text-[#73786F]">
                          {item.variantLabel} · Resealable Pouch · Qty {item.quantity}
                        </p>
                        <p className="text-sm font-bold text-[#292D28] mt-0.5">
                          {formatINR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery address summary */}
                <div className="bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#292D28] uppercase tracking-wide">
                      Delivering to
                    </p>
                    <button type="button" onClick={() => setStep(2)}
                            className="text-xs text-[var(--brand-primary)] font-semibold hover:underline
                                       focus-visible:outline-none focus-visible:ring-2
                                       focus-visible:ring-[var(--brand-accent)] rounded">
                      Edit
                    </button>
                  </div>
                  <address className="not-italic text-sm text-[#73786F] leading-relaxed">
                    <strong className="text-[#292D28]">{address.fullName || customer.fullName}</strong>
                    {' · '}{address.phone || customer.phone}<br />
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`}<br />
                    {address.city}, {address.state} — {address.pincode}
                  </address>
                </div>

                <p className="text-xs text-[#73786F] mt-4 flex items-center gap-1.5">
                  <Link to="/cart" className="text-[var(--brand-primary)] font-semibold hover:underline">
                    ← Back to cart
                  </Link>
                  {' '}to make changes to your items.
                </p>
              </section>
            )}

            {/* ── STEP 4: Payment ───────────────────────── */}
            {step === 4 && (
              <section className="bg-white rounded-2xl border border-[#E8E4D9] p-6">
                <h2 className="text-base font-semibold text-[#292D28] mb-5 flex items-center gap-2">
                  <CreditCard size={16} className="text-[var(--brand-primary)]" aria-hidden="true" />
                  Payment Method
                </h2>

                <div className="flex flex-col gap-3">
                  {/* COD */}
                  {codEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedPayMethod('cod')}
                      className={[
                        'flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                        selectedPayMethod === 'cod'
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/6'
                          : 'border-[#E8E4D9] hover:border-[var(--brand-primary)]/30',
                      ].join(' ')}
                    >
                      <div className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                           style={{ borderColor: selectedPayMethod === 'cod' ? 'var(--brand-primary)' : '#E8E4D9' }}>
                        {selectedPayMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#292D28]">Cash on Delivery</p>
                        <p className="text-xs text-[#73786F] mt-0.5">Pay in cash when your order is delivered. No prepayment required.</p>
                      </div>
                    </button>
                  )}

                  {/* Online Payment */}
                  {adminSettings.business.allowOnlinePayment && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('online')}
                        className={[
                          'w-full flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                          selectedPayMethod === 'online'
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/6'
                            : 'border-[#E8E4D9] hover:border-[var(--brand-primary)]/30',
                        ].join(' ')}
                      >
                        <div className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                             style={{ borderColor: selectedPayMethod === 'online' ? 'var(--brand-primary)' : '#E8E4D9' }}>
                          {selectedPayMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#292D28]">Online Payment <span className="text-[10px] font-bold text-[var(--brand-accent)] ml-1">Demo</span></p>
                          <p className="text-xs text-[#73786F] mt-0.5">Pay using cards, net banking or UPI. Demo flow — no real gateway.</p>
                        </div>
                      </button>

                      {/* Online payment panel */}
                      {selectedPayMethod === 'online' && (
                        <div className="ml-8 mt-3 p-4 bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9] flex flex-col gap-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#73786F]">Amount to pay</span>
                            <span className="font-bold text-[var(--brand-primary)]">{formatINR(summary.total)}</span>
                          </div>
                          {onlinePayState === 'idle' && (
                            <button type="button" onClick={handleOnlinePay}
                                    className="flex items-center justify-center gap-2 bg-[var(--brand-primary)] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors">
                              <CreditCard size={15} /> Pay Now
                            </button>
                          )}
                          {onlinePayState === 'processing' && (
                            <div className="flex items-center justify-center gap-2 text-sm text-[var(--brand-primary)] py-2.5">
                              <span className="w-4 h-4 border-2 border-[var(--brand-primary)]/30 border-t-[var(--brand-primary)] rounded-full animate-spin" />
                              Processing payment…
                            </div>
                          )}
                          {onlinePayState === 'pending' && (
                            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <AlertCircle size={13} className="shrink-0 mt-0.5" />
                              <span>Payment is awaiting verification. Your order has been placed with <strong>pending</strong> payment status. This is a demo — no real payment was processed.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* UPI QR */}
                  {adminSettings.business.allowUpiQr && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedPayMethod('upi_qr')}
                        className={[
                          'w-full flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                          selectedPayMethod === 'upi_qr'
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/6'
                            : 'border-[#E8E4D9] hover:border-[var(--brand-primary)]/30',
                        ].join(' ')}
                      >
                        <div className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center"
                             style={{ borderColor: selectedPayMethod === 'upi_qr' ? 'var(--brand-primary)' : '#E8E4D9' }}>
                          {selectedPayMethod === 'upi_qr' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)]" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#292D28]">UPI QR Code</p>
                          <p className="text-xs text-[#73786F] mt-0.5">Scan QR with any UPI app to pay.</p>
                        </div>
                      </button>

                      {/* UPI QR panel */}
                      {selectedPayMethod === 'upi_qr' && (
                        <div className="ml-8 mt-3 p-4 bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9] flex flex-col gap-3">
                          {upiIdValid ? (
                            <>
                              {/* QR code image */}
                              <div className="flex flex-col items-center gap-2">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`}
                                  alt="UPI Payment QR Code"
                                  className="w-44 h-44 rounded-xl border border-[#E8E4D9] bg-white"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                                <p className="text-[10px] text-[#73786F]">Scan to pay via UPI</p>
                              </div>

                              {/* UPI ID display + copy */}
                              <div className="flex items-center gap-2 bg-white border border-[#E8E4D9] rounded-xl px-3 py-2.5">
                                <span className="text-sm font-mono text-[#292D28] flex-1 truncate">{adminSettings.payment.merchantUpiId}</span>
                                <button type="button" onClick={() => {
                                  navigator.clipboard?.writeText(adminSettings.payment.merchantUpiId);
                                  setUpiCopied(true);
                                  setTimeout(() => setUpiCopied(false), 2000);
                                }}
                                        className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)] shrink-0">
                                  {upiCopied ? '✓ Copied' : 'Copy'}
                                </button>
                              </div>

                              {/* Instructions */}
                              <ol className="text-xs text-[#73786F] list-decimal list-inside flex flex-col gap-1">
                                <li>Open any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                                <li>Scan the QR code above</li>
                                <li>Verify merchant name and amount: <strong>{formatINR(summary.total)}</strong></li>
                                <li>Complete the payment in your UPI app</li>
                              </ol>

                              {/* Customer confirmation */}
                              <button type="button" onClick={handleUpiConfirm}
                                      disabled={upiConfirmed}
                                      className={[
                                        'flex items-center justify-center gap-2 font-semibold text-sm py-2.5 rounded-xl transition-colors',
                                        upiConfirmed
                                          ? 'bg-amber-50 border border-amber-200 text-amber-700 cursor-default'
                                          : 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-dark)]',
                                      ].join(' ')}>
                                {upiConfirmed
                                  ? <><Check size={15} />Payment Awaiting Verification</>
                                  : <>I have completed payment</>}
                              </button>

                              {upiConfirmed && (
                                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                  <span>Your payment is awaiting verification. The order has been placed with <strong>pending</strong> payment status. This is a demo — payment is not automatically confirmed.</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                <span>UPI QR payment is enabled but no valid merchant UPI ID is configured. Please contact the store administrator or choose another payment method.</span>
                              </div>
                              {codEnabled && (
                                <button type="button" onClick={() => setSelectedPayMethod('cod')}
                                        className="flex items-center justify-center gap-2 bg-[var(--brand-primary)] text-white
                                                   font-semibold text-sm py-2.5 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
                                  Switch to Cash on Delivery
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card — Coming Soon (no real gateway) */}
                  <div>
                    <div className={[
                      'flex items-start gap-3.5 p-4 rounded-xl border-2 text-left',
                      'border-[#E8E4D9] opacity-60 cursor-not-allowed',
                    ].join(' ')}>
                      <div className="w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center border-[#E8E4D9]">
                        <span className="w-2 h-2 rounded-full bg-[#E8E4D9]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#73786F]">
                          Card Payment
                          <span className="text-[10px] font-bold text-[#73786F] bg-[#E8E4D9] px-2 py-0.5 rounded-full ml-2">Coming Soon</span>
                        </p>
                        <p className="text-xs text-[#73786F]/70 mt-0.5">A real card payment gateway is not yet integrated. No card details are collected or stored.</p>
                      </div>
                    </div>
                  </div>

                  {/* No payment methods available */}
                  {!codEnabled && !adminSettings.business.allowOnlinePayment && !adminSettings.business.allowUpiQr && (
                    <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">No payment methods available</p>
                        <p className="text-xs text-red-600 mt-0.5">All payment options are currently disabled. Please contact the store.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order total summary */}
                <div className="mt-5 bg-[var(--brand-background)] rounded-xl p-4 flex justify-between items-center border border-[#E8E4D9]">
                  <span className="text-sm font-semibold text-[#292D28]">Amount to Pay</span>
                  <span className="text-xl font-bold text-[var(--brand-primary)]">{formatINR(summary.total)}</span>
                </div>

                <p className="text-xs text-[#73786F] mt-3">
                  This is a demo — no real payment or delivery will occur. Payment status remains pending until verified.
                </p>
              </section>
            )}

            {/* ── Navigation buttons ────────────────────── */}
            <div className="flex items-center justify-between gap-3 mt-5">
              {step > 1 ? (
                <button type="button" onClick={goBack}
                        className="flex items-center gap-2 border-2 border-[#E8E4D9]
                                   text-[#73786F] font-semibold text-sm px-5 py-3 rounded-xl
                                   hover:border-[var(--brand-primary)]/40 hover:text-[#292D28] transition-all
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-[var(--brand-accent)]">
                  <ChevronLeft size={16} aria-hidden="true" />
                  Back
                </button>
              ) : (
                <Link to="/cart"
                      className="flex items-center gap-2 border-2 border-[#E8E4D9]
                                 text-[#73786F] font-semibold text-sm px-5 py-3 rounded-xl
                                 hover:border-[var(--brand-primary)]/40 transition-all
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-[var(--brand-accent)]">
                  <ChevronLeft size={16} aria-hidden="true" />
                  Back to Cart
                </Link>
              )}

              {step < 4 ? (
                <button type="button" onClick={goNext}
                        className="flex items-center gap-2 bg-[var(--brand-primary)] text-white
                                   font-semibold text-sm px-7 py-3 rounded-xl
                                   hover:bg-[var(--brand-dark)] transition-colors
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-[var(--brand-accent)]">
                  Continue
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <>
                {checkoutError && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{checkoutError}</p>}
                <button type="button" onClick={handlePlaceOrder} disabled={placing || orderPlaced ||
                  (selectedPayMethod === 'online' && onlinePayState === 'processing') ||
                  (selectedPayMethod === 'upi_qr' && !upiIdValid)}
                        className="flex items-center gap-2 bg-[var(--brand-primary)] text-white
                                   font-semibold text-sm px-7 py-3 rounded-xl
                                   hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-[var(--brand-accent)]">
                  {placing ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                     rounded-full animate-spin" />
                  ) : (
                    <Check size={16} aria-hidden="true" />
                  )}
                  {placing ? 'Placing Order…' : 'Place Order'}
                </button>
                </>
              )}
            </div>
          </div>

          {/* ── Order summary sidebar ────────────────────── */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0 lg:sticky lg:top-24">
            <CartSummary readOnly showCoupon={false} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
