import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  User, MapPin, ShoppingBag, LogOut, Edit2, Check, X,
  Plus, Trash2, Star, AlertCircle, ChevronRight, Calendar, Navigation,
} from 'lucide-react';
import { useAuth }        from '../../hooks/useAuth';
import { INDIAN_STATES }  from '../../utils/constants';
import type { UserAddress, AddressType } from '../../types';
import MapAddressPicker, { type MapPickedAddress } from '../../components/common/MapAddressPicker';

// ─── Sidebar sections ─────────────────────────────────────────────────────────

type Section = 'profile' | 'addresses' | 'orders';

const SIDEBAR_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'profile',   label: 'My Profile',   icon: <User      size={16} aria-hidden="true" /> },
  { id: 'addresses', label: 'My Addresses', icon: <MapPin    size={16} aria-hidden="true" /> },
  { id: 'orders',    label: 'My Orders',    icon: <ShoppingBag size={16} aria-hidden="true" /> },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

const isValidPhone   = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));
const isValidPincode = (v: string) => /^[1-9][0-9]{5}$/.test(v.trim());

const inputCls = (err?: string) => [
  'w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#292D28]',
  'placeholder:text-[#73786F]/60 bg-white transition-all',
  'focus:outline-none focus:ring-2',
  err
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : 'border-[#E8E4D9] focus:border-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/10',
].join(' ');

// ─── Blank address form ───────────────────────────────────────────────────────

const BLANK_ADDR: Omit<UserAddress, 'id'> = {
  label:        'Home',
  fullName:     '',
  phone:        '',
  addressLine1: '',
  addressLine2: '',
  landmark:     '',
  city:         '',
  state:        '',
  pincode:      '',
  country:      'India',
  isDefault:    false,
};

// ─── Address form modal ───────────────────────────────────────────────────────

interface AddrFormProps {
  initial:   Omit<UserAddress, 'id'> & { id?: string };
  onSave:    (data: Omit<UserAddress, 'id'> & { id?: string }) => void;
  onCancel:  () => void;
}

const AddressFormModal = ({ initial, onSave, onCancel }: AddrFormProps) => {
  const [form,   setForm]   = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [showMap, setShowMap] = useState(false);

  const handleMapConfirm = (picked: MapPickedAddress) => {
    setForm((f) => ({
      ...f,
      addressLine1: picked.addressLine1 || f.addressLine1,
      city:         picked.city         || f.city,
      state:        picked.state        || f.state,
      pincode:      picked.pincode      || f.pincode,
      lat:          picked.lat,
      lng:          picked.lng,
    }));
    setShowMap(false);
  };

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e: Partial<Record<string, string>> = {};
    if (!form.fullName.trim())     e.fullName     = 'Full name is required.';
    if (!isValidPhone(form.phone)) e.phone        = 'Enter a valid 10-digit mobile number.';
    if (!form.addressLine1.trim()) e.addressLine1 = 'Address line 1 is required.';
    if (!form.city.trim())         e.city         = 'City is required.';
    if (!form.state.trim())        e.state        = 'State is required.';
    if (!isValidPincode(form.pincode)) e.pincode  = 'Enter a valid 6-digit PIN code.';
    return e;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
         onClick={onCancel} aria-hidden="true">
      <div
        role="dialog" aria-modal="true" aria-label="Address form"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl
                   shadow-xl overflow-hidden animate-[slideUp_200ms_ease]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-[#E8E4D9]">
          <h3 className="text-base font-semibold text-[#292D28]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            {form.id ? 'Edit Address' : 'Add New Address'}
          </h3>
          <button type="button" onClick={onCancel} aria-label="Close"
                  className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]
                             transition-colors focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}
              className="px-5 py-4 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

            {/* Address type */}
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-[#292D28] mb-2">Address Type</p>
              <div className="flex gap-2">
                {(['Home', 'Work', 'Other'] as AddressType[]).map((t) => (
                  <button key={t} type="button"
                          onClick={() => setForm((f) => ({ ...f, label: t }))}
                          aria-pressed={form.label === t}
                          className={[
                            'px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]',
                            form.label === t
                              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                              : 'border-[#E8E4D9] text-[#73786F] hover:border-[var(--brand-primary)]/40',
                          ].join(' ')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {[
              { name: 'fullName',     label: 'Full Name',        required: true,  col: 2, type: 'text'  },
              { name: 'phone',        label: 'Mobile Number',    required: true,  col: 1, type: 'tel'   },
              { name: 'addressLine1', label: 'House / Flat',     required: true,  col: 2, type: 'text'  },
              { name: 'addressLine2', label: 'Street / Area',    required: false, col: 2, type: 'text'  },
              { name: 'landmark',     label: 'Landmark',         required: false, col: 2, type: 'text'  },
              { name: 'city',         label: 'City',             required: true,  col: 1, type: 'text'  },
              { name: 'pincode',      label: 'PIN Code',         required: true,  col: 1, type: 'text'  },
            ].map(({ name, label, required, col, type }) => (
              <div key={name} className={col === 2 ? 'sm:col-span-2' : ''}>
                <label className="text-xs font-medium text-[#292D28] block mb-1.5">
                  {label}{required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  name={name} type={type}
                  value={(form as Record<string, unknown>)[name] as string ?? ''}
                  onChange={onChange} placeholder={label}
                  maxLength={name === 'phone' ? 10 : name === 'pincode' ? 6 : undefined}
                  className={inputCls(errors[name])}
                />
                {errors[name] && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <AlertCircle size={11} aria-hidden="true" />{errors[name]}
                  </p>
                )}
              </div>
            ))}

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
                Automatically fills address fields from your location
              </p>
            </div>

            {/* State */}
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#292D28] block mb-1.5">
                State<span className="text-red-500 ml-0.5">*</span>
              </label>
              <select name="state" value={form.state} onChange={onChange}
                      className={inputCls(errors.state)}>
                <option value="">Select State</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle size={11} aria-hidden="true" />{errors.state}
                </p>
              )}
            </div>

            {/* Default */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.isDefault}
                       onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                       className="w-4 h-4 rounded accent-[var(--brand-primary)]" />
                <span className="text-sm text-[#73786F]">Set as default address</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button type="button" onClick={onCancel}
                    className="flex-1 border-2 border-[#E8E4D9] text-[#73786F]
                               font-semibold text-sm py-3 rounded-xl hover:border-[var(--brand-primary)]/40
                               transition-all focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[var(--brand-accent)]">
              Cancel
            </button>
            <button type="submit"
                    className="flex-1 bg-[var(--brand-primary)] text-white font-semibold text-sm
                               py-3 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[var(--brand-accent)]">
              Save Address
            </button>
          </div>
        </form>

        {/* Map picker modal */}
        {showMap && (
          <MapAddressPicker
            onConfirm={handleMapConfirm}
            onClose={() => setShowMap(false)}
          />
        )}
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const Profile = () => {
  const {
    user, logout, updateProfile,
    addAddress, updateAddress, deleteAddress, setDefaultAddress,
  } = useAuth();
  const navigate = useNavigate();

  const [section,    setSection]    = useState<Section>('profile');
  const [editing,    setEditing]    = useState(false);
  const [editForm,   setEditForm]   = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);

  const [addrModal,   setAddrModal]   = useState(false);
  const [editingAddr, setEditingAddr] = useState<(Omit<UserAddress,'id'> & { id?: string }) | null>(null);

  // Redirect if not authenticated — use Navigate component, not navigate()
  if (!user) {
    return <Navigate to="/login?from=/profile" replace />;
  }

  // ── Profile edit ──────────────────────────────────────────────────────────

  const startEdit = () => {
    setEditForm({ name: user.name, phone: user.phone ?? '' });
    setEditErrors({});
    setEditing(true);
    setProfileSaved(false);
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) errs.name = 'Name is required.';
    if (editForm.phone && !isValidPhone(editForm.phone))
      errs.phone = 'Enter a valid 10-digit mobile number.';
    if (Object.keys(errs).length) { setEditErrors(errs); return; }
    setSavingProfile(true);
    await updateProfile({ name: editForm.name.trim(), phone: editForm.phone.trim() || undefined });
    setSavingProfile(false);
    setEditing(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // ── Address CRUD ──────────────────────────────────────────────────────────

  const openNewAddr   = () => { setEditingAddr({ ...BLANK_ADDR }); setAddrModal(true); };
  const openEditAddr  = (a: UserAddress) => {
    setEditingAddr({ ...a });
    setAddrModal(true);
  };
  const closeAddrModal = () => { setAddrModal(false); setEditingAddr(null); };

  const handleSaveAddr = (data: Omit<UserAddress, 'id'> & { id?: string }) => {
    if (data.id) {
      updateAddress({ ...data, id: data.id } as UserAddress);
    } else {
      addAddress(data);
    }
    closeAddrModal();
  };

  // ── Logout ────────────────────────────────────────────────────────────────

  const handleLogout = () => { logout(); navigate('/'); };

  // ── Avatar initials ───────────────────────────────────────────────────────

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="py-8 sm:py-12"
         style={{ fontFamily: 'var(--font-body)' }}>
      <div className="container max-w-5xl mx-auto px-6">

        {/* ── Profile header ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#E8E4D9] p-6 mb-6
                        flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)] flex items-center
                          justify-center shrink-0">
            <span className="text-xl font-bold text-white">{initials}</span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-[#292D28] truncate"
                style={{ fontFamily: 'var(--font-heading)' }}>
              {user.name}
            </h1>
            <p className="text-sm text-[#73786F] truncate">{user.email}</p>
            <p className="text-xs text-[#73786F] flex items-center gap-1.5 mt-1">
              <Calendar size={12} aria-hidden="true" />
              Member since {memberSince}
            </p>
          </div>
          {/* Edit action */}
          {!editing && section === 'profile' && (
            <button type="button" onClick={startEdit}
                    className="flex items-center gap-1.5 text-sm font-semibold
                               text-[var(--brand-primary)] border border-[var(--brand-primary)] px-4 py-2
                               rounded-lg hover:bg-[var(--brand-primary)] hover:text-white
                               transition-all shrink-0
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[var(--brand-accent)]">
              <Edit2 size={14} aria-hidden="true" />Edit Profile
            </button>
          )}
        </div>

        {/* ── Layout: sidebar + content ────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Sidebar ──────────────────────────────────── */}
          {/* Mobile: horizontal tab strip; Desktop: vertical sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            {/* Mobile horizontal tabs */}
            <nav className="lg:hidden flex gap-1 overflow-x-auto pb-1 mb-4"
                 aria-label="Profile navigation">
              {SIDEBAR_ITEMS.map(({ id, label, icon }) => (
                <button key={id} type="button"
                        onClick={() => {
                          if (id === 'orders') { navigate('/my-orders'); return; }
                          setSection(id);
                        }}
                        className={[
                          'shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl',
                          'text-sm font-medium transition-all',
                          'focus-visible:outline-none focus-visible:ring-2',
                          'focus-visible:ring-[var(--brand-accent)]',
                          section === id && id !== 'orders'
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'bg-white border border-[#E8E4D9] text-[#73786F] hover:text-[#292D28]',
                        ].join(' ')}>
                  {icon}
                  {label}
                </button>
              ))}
              <button type="button" onClick={handleLogout}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                                 text-sm font-medium text-red-600 bg-white
                                 border border-red-200 hover:bg-red-50 transition-colors
                                 focus-visible:outline-none focus-visible:ring-2
                                 focus-visible:ring-[var(--brand-accent)]">
                <LogOut size={16} aria-hidden="true" />
                Sign Out
              </button>
            </nav>

            {/* Desktop vertical sidebar */}
            <div className="hidden lg:block bg-white rounded-2xl border border-[#E8E4D9]
                            overflow-hidden">
              {/* Avatar (compact) */}
              <div className="px-5 py-5 border-b border-[#E8E4D9] flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--brand-primary)] flex items-center
                                justify-center shrink-0">
                  <span className="text-base font-bold text-white">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#292D28] truncate">{user.name}</p>
                  <p className="text-xs text-[#73786F] truncate">{user.email}</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="py-2">
                {SIDEBAR_ITEMS.map(({ id, label, icon }) => (
                  <button key={id} type="button"
                          onClick={() => {
                            if (id === 'orders') { navigate('/my-orders'); return; }
                            setSection(id);
                          }}
                          className={[
                            'w-full flex items-center justify-between px-5 py-3',
                            'text-sm transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2',
                            'focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]',
                            section === id && id !== 'orders'
                              ? 'bg-[var(--brand-primary)]/8 text-[var(--brand-primary)] font-semibold'
                              : 'text-[#73786F] hover:bg-[var(--brand-background)] hover:text-[#292D28]',
                          ].join(' ')}>
                    <span className="flex items-center gap-2.5">{icon}{label}</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                ))}

                <div className="border-t border-[#E8E4D9] mt-1 pt-1">
                  <button type="button" onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-5 py-3
                                     text-sm text-red-600 hover:bg-red-50 transition-colors
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-inset focus-visible:ring-[var(--brand-accent)]">
                    <LogOut size={16} aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* ── Content area ─────────────────────────────── */}
          <main className="flex-1 min-w-0">

            {/* ── PROFILE SECTION ────────────────────────── */}
            {section === 'profile' && (
              <div className="bg-white rounded-2xl border border-[#E8E4D9] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-[#292D28]"
                      style={{ fontFamily: 'var(--font-heading)' }}>
                    Personal Details
                  </h2>
                  {!editing && (
                    <button type="button" onClick={startEdit}
                            className="flex items-center gap-1.5 text-sm font-medium
                                       text-[var(--brand-primary)] hover:text-[var(--brand-dark)] transition-colors
                                       focus-visible:outline-none focus-visible:ring-2
                                       focus-visible:ring-[var(--brand-accent)] rounded">
                      <Edit2 size={14} aria-hidden="true" />Edit
                    </button>
                  )}
                </div>

                {profileSaved && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200
                                  rounded-xl px-4 py-3 mb-4 text-sm text-emerald-700">
                    <Check size={14} aria-hidden="true" />Profile updated successfully.
                  </div>
                )}

                {editing ? (
                  <form onSubmit={saveProfile} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[#292D28] block mb-1.5">
                          Full Name<span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <input type="text" value={editForm.name}
                               onChange={(e) => { setEditForm((f) => ({ ...f, name: e.target.value })); setEditErrors((er) => ({ ...er, name: '' })); }}
                               className={inputCls(editErrors.name)} />
                        {editErrors.name && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.name}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#292D28] block mb-1.5">
                          Mobile Number
                        </label>
                        <input type="tel" value={editForm.phone} maxLength={10}
                               onChange={(e) => { setEditForm((f) => ({ ...f, phone: e.target.value })); setEditErrors((er) => ({ ...er, phone: '' })); }}
                               placeholder="10-digit mobile" className={inputCls(editErrors.phone)} />
                        {editErrors.phone && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{editErrors.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={savingProfile}
                              className="flex items-center gap-2 bg-[var(--brand-primary)] text-white
                                         font-semibold text-sm px-5 py-2.5 rounded-xl
                                         hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70
                                         focus-visible:outline-none focus-visible:ring-2
                                         focus-visible:ring-[var(--brand-accent)]">
                        {savingProfile
                          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Check size={15} aria-hidden="true" />}
                        Save Changes
                      </button>
                      <button type="button" onClick={() => setEditing(false)}
                              className="flex items-center gap-2 border border-[#E8E4D9]
                                         text-[#73786F] font-semibold text-sm px-5 py-2.5
                                         rounded-xl hover:border-[var(--brand-primary)]/40 transition-all
                                         focus-visible:outline-none focus-visible:ring-2
                                         focus-visible:ring-[var(--brand-accent)]">
                        <X size={15} aria-hidden="true" />Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: 'Full Name',       value: user.name },
                      { label: 'Email Address',   value: user.email },
                      { label: 'Mobile Number',   value: user.phone ?? '—' },
                      { label: 'Member Since',    value: new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-[#73786F] mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-[#292D28] break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Change password placeholder */}
                <div className="mt-6 pt-5 border-t border-[#E8E4D9]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#292D28]">Password</p>
                      <p className="text-xs text-[#73786F] mt-0.5">
                        Password changes require backend email integration.
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-[#E8E4D9]
                                     text-[#73786F] font-medium">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── ADDRESSES SECTION ──────────────────────── */}
            {section === 'addresses' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[#292D28]"
                      style={{ fontFamily: 'var(--font-heading)' }}>
                    Saved Addresses
                  </h2>
                  <button type="button" onClick={openNewAddr}
                          className="flex items-center gap-2 bg-[var(--brand-primary)] text-white
                                     text-sm font-semibold px-4 py-2.5 rounded-xl
                                     hover:bg-[var(--brand-dark)] transition-colors
                                     focus-visible:outline-none focus-visible:ring-2
                                     focus-visible:ring-[var(--brand-accent)]">
                    <Plus size={15} aria-hidden="true" />Add Address
                  </button>
                </div>

                {user.addresses.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#E8E4D9] py-12
                                  flex flex-col items-center gap-3 text-center px-6">
                    <MapPin size={36} strokeWidth={1.5} className="text-[#73786F]" />
                    <p className="text-base font-semibold text-[#292D28]">No addresses saved</p>
                    <p className="text-sm text-[#73786F]">Add a delivery address for faster checkout.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div key={addr.id}
                           className={[
                             'bg-white rounded-2xl border p-5 relative',
                             addr.isDefault
                               ? 'border-[var(--brand-primary)]/40 ring-1 ring-[var(--brand-primary)]/20'
                               : 'border-[#E8E4D9]',
                           ].join(' ')}>
                        {/* Default badge */}
                        {addr.isDefault && (
                          <div className="absolute top-3 right-3">
                            <span className="flex items-center gap-1 text-[10px] font-bold
                                             bg-[var(--brand-primary)] text-white px-2 py-0.5 rounded-full">
                              <Star size={9} aria-hidden="true" />Default
                            </span>
                          </div>
                        )}

                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-accent)] mb-2">
                          {addr.label}
                        </p>
                        <address className="not-italic text-sm text-[#73786F] leading-relaxed mb-4">
                          <strong className="text-[#292D28]">{addr.fullName}</strong><br />
                          {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                          {addr.city}, {addr.state} — {addr.pincode}<br />
                          📞 {addr.phone}
                        </address>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button type="button" onClick={() => openEditAddr(addr)}
                                  className="flex items-center gap-1.5 text-xs font-semibold
                                             text-[var(--brand-primary)] hover:text-[var(--brand-dark)] transition-colors
                                             focus-visible:outline-none focus-visible:ring-2
                                             focus-visible:ring-[var(--brand-accent)] rounded">
                            <Edit2 size={12} aria-hidden="true" />Edit
                          </button>
                          <button type="button"
                                  onClick={() => deleteAddress(addr.id)}
                                  className="flex items-center gap-1.5 text-xs font-semibold
                                             text-red-500 hover:text-red-600 transition-colors
                                             focus-visible:outline-none focus-visible:ring-2
                                             focus-visible:ring-[var(--brand-accent)] rounded">
                            <Trash2 size={12} aria-hidden="true" />Remove
                          </button>
                          {!addr.isDefault && (
                            <button type="button"
                                    onClick={() => setDefaultAddress(addr.id)}
                                    className="flex items-center gap-1.5 text-xs font-semibold
                                               text-[#73786F] hover:text-[var(--brand-primary)] transition-colors
                                               focus-visible:outline-none focus-visible:ring-2
                                               focus-visible:ring-[var(--brand-accent)] rounded">
                              <Star size={12} aria-hidden="true" />Set Default
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Address modal */}
        {addrModal && editingAddr && (
          <AddressFormModal
            initial={editingAddr}
            onSave={handleSaveAddr}
            onCancel={closeAddrModal}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
