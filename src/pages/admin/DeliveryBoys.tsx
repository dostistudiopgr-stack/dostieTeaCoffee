import { useState, type FormEvent } from 'react';
import {
  Search, Plus, Edit2, X, Bike,
  CheckCircle, Check,
} from 'lucide-react';
import {
  getAllDeliveryBoys, addDeliveryBoy, toggleDeliveryBoyActive,
  updateDeliveryBoy, isDeliveryEmailDuplicate,
  type DeliveryBoy,
} from '../../utils/deliveryStore';
import { getAllOrders } from '../../data/orders';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';

const inputCls = 'w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28] bg-white placeholder:text-[#73786F]/60 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10';
const errCls  = 'w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm text-[#292D28] bg-white placeholder:text-[#73786F]/60 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200';

const isValidPhone = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ''));

export default function DeliveryBoys() {
  useLocalDataRevision();
  const [refreshKey, setRefreshKey] = useState(0); void refreshKey;
  const boys = getAllDeliveryBoys();
  const allOrders = getAllOrders();

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<(DeliveryBoy & { isNew?: boolean }) | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<DeliveryBoy | null>(null);

  const getOrderCount = (boyId: string) => allOrders.filter((o) => o.deliveryBoyId === boyId).length;
  const getDeliveredCount = (boyId: string) => allOrders.filter((o) => o.deliveryBoyId === boyId && o.status === 'delivered').length;
  const getActiveCount = (boyId: string) => allOrders.filter((o) => o.deliveryBoyId === boyId && (o.status === 'shipped' || o.status === 'out-for-delivery')).length;

  const filtered = boys.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || b.email.toLowerCase().includes(q) || b.phone.includes(q);
  });

  const handleSave = () => {
    setEditing(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
            Delivery Boys
          </h1>
          <p className="text-sm text-[#73786F] mt-0.5">{boys.length} delivery boys · {boys.filter((b) => b.isActive).length} active</p>
        </div>
        <button type="button" onClick={() => setEditing({ id: '', name: '', email: '', phone: '', isActive: true, createdAt: '', isNew: true })}
                className="flex items-center gap-2 bg-[var(--brand-primary)] text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-[var(--brand-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
          <Plus size={16} />Add Delivery Boy
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73786F]" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
               placeholder="Search name, email or phone…"
               className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E8E4D9] rounded-xl text-sm focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10" />
      </div>

      {/* Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-[#E8E4D9] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#E8E4D9] bg-[var(--brand-background)]">
              <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 min-w-[180px]">Name</th>
              <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Phone</th>
              <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Assigned</th>
              <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Delivered</th>
              <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3 whitespace-nowrap">Active Now</th>
              <th className="text-left text-xs font-semibold text-[#73786F] px-4 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-[#73786F] px-4 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-[#E8E4D9]">
              {filtered.map((boy) => (
                <tr key={boy.id} className="hover:bg-[var(--brand-background)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{boy.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div><p className="font-medium text-[#292D28]">{boy.name}</p><p className="text-xs text-[#73786F]">{boy.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#73786F] whitespace-nowrap">{boy.phone}</td>
                  <td className="px-4 py-3 text-center text-[#292D28] font-medium">{getOrderCount(boy.id)}</td>
                  <td className="px-4 py-3 text-center text-emerald-600 font-medium">{getDeliveredCount(boy.id)}</td>
                  <td className="px-4 py-3 text-center text-blue-600 font-medium">{getActiveCount(boy.id)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button type="button" onClick={() => setConfirmToggle(boy)}
                            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] rounded">
                      {boy.isActive ? <Badge variant="success" size="small" dot>Active</Badge> : <Badge variant="neutral" size="small" dot>Inactive</Badge>}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setEditing({ ...boy })}
                            className="p-1.5 rounded-lg text-[#73786F] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-background)] transition-colors">
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <Bike size={36} strokeWidth={1.5} className="text-[#73786F]" />
            <p className="text-sm font-medium text-[#292D28]">No delivery boys found</p>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.map((boy) => (
          <div key={boy.id} className="bg-white rounded-2xl border border-[#E8E4D9] p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">{boy.name.charAt(0).toUpperCase()}</span>
                </div>
                <div><p className="font-semibold text-[#292D28]">{boy.name}</p><p className="text-xs text-[#73786F]">{boy.email}</p></div>
              </div>
              {boy.isActive ? <Badge variant="success" size="small" dot>Active</Badge> : <Badge variant="neutral" size="small" dot>Inactive</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
              <div><p className="font-bold text-[#292D28]">{getOrderCount(boy.id)}</p><p className="text-[#73786F]">Assigned</p></div>
              <div><p className="font-bold text-emerald-600">{getDeliveredCount(boy.id)}</p><p className="text-[#73786F]">Delivered</p></div>
              <div><p className="font-bold text-blue-600">{getActiveCount(boy.id)}</p><p className="text-[#73786F]">Active</p></div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-[#E8E4D9]">
              <button type="button" onClick={() => setEditing({ ...boy })}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] border border-[var(--brand-primary)] py-2 rounded-lg hover:bg-[var(--brand-primary)] hover:text-white transition-all">
                <Edit2 size={13} />Edit
              </button>
              <button type="button" onClick={() => setConfirmToggle(boy)}
                      className="px-3 py-2 text-xs font-semibold text-[#73786F] border border-[#E8E4D9] rounded-lg hover:bg-[var(--brand-background)]">
                Toggle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit modal */}
      {editing && <DeliveryBoyForm initial={editing} onSave={handleSave} onCancel={() => setEditing(null)} />}

      {/* Toggle confirm */}
      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => { if (confirmToggle) { toggleDeliveryBoyActive(confirmToggle.id); setRefreshKey((k) => k + 1); } setConfirmToggle(null); }}
        title={confirmToggle?.isActive ? 'Deactivate Delivery Boy?' : 'Activate Delivery Boy?'}
        description={confirmToggle?.isActive
          ? `"${confirmToggle?.name ?? ''}" will be marked inactive and cannot log in. Assignment history is preserved.`
          : `"${confirmToggle?.name ?? ''}" will be reactivated and can log in again.`}
        confirmLabel={confirmToggle?.isActive ? 'Deactivate' : 'Activate'}
        variant={confirmToggle?.isActive ? 'danger' : 'default'}
      />
    </div>
  );
}

// ─── Delivery Boy Form Modal ─────────────────────────────────────────────────

function DeliveryBoyForm({
  initial, onSave, onCancel,
}: {
  initial: DeliveryBoy & { isNew?: boolean };
  onSave: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...initial, password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (form.isNew && isDeliveryEmailDuplicate(form.email)) e.email = 'Email already exists.';
    if (!isValidPhone(form.phone)) e.phone = 'Enter a valid 10-digit mobile number.';
    if (form.isNew && !form.password) e.password = 'Password is required for new accounts.';
    return e;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (form.isNew) {
        const result = await addDeliveryBoy(form.name, form.email, form.phone, form.password);
        if (!result.success) { setErrors({ email: result.error ?? 'Could not save.' }); setSaving(false); return; }
      } else await updateDeliveryBoy(form.id, { name: form.name.trim(), phone: form.phone.trim(), ...(form.password ? { password: form.password } : {}) });
      setSaving(false); setSaved(true); setTimeout(onSave, 600);
    } catch (error) { setErrors({ password: error instanceof Error ? error.message : 'Could not save.' }); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onCancel}>
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-[slideUp_200ms_ease]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E4D9]">
          <h2 className="text-base font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
            {form.isNew ? 'Add Delivery Boy' : `Edit: ${initial.name}`}
          </h2>
          <button type="button" onClick={onCancel} className="p-2 rounded-lg text-[#73786F] hover:bg-[var(--brand-background)]">
            <X size={18} />
          </button>
        </div>
        {saved && <div className="flex items-center gap-2 bg-emerald-50 border-b border-emerald-200 px-6 py-3 text-sm text-emerald-700"><CheckCircle size={15} />Saved successfully!</div>}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">Full Name <span className="text-red-500">*</span></label>
            <input className={errors.name ? errCls : inputCls} value={form.name}
                   onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Delivery person name" />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">Email <span className="text-red-500">*</span></label>
            <input type="email" className={`${errors.email ? errCls : inputCls} ${!form.isNew ? 'bg-[var(--brand-background)] cursor-default' : ''}`}
                   value={form.email} readOnly={!form.isNew}
                   onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="delivery@example.com" />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            {!form.isNew && <p className="text-xs text-[#73786F] mt-1">Email cannot be changed.</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">Phone <span className="text-red-500">*</span></label>
            <input type="tel" maxLength={10} className={errors.phone ? errCls : inputCls} value={form.phone}
                   onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-[#292D28] mb-1.5 block">
              Password {form.isNew ? <span className="text-red-500">*</span> : <span className="text-[#73786F] font-normal">(leave blank to keep)</span>}
            </label>
            <input type="password" autoComplete="new-password" className={errors.password ? errCls : inputCls} value={form.password}
                   onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 10 characters" />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            {form.isNew && <p className="text-xs text-[#73786F] mt-1">Passwords are stored as salted PBKDF2 hashes in this browser.</p>}
          </div>
          <div className="flex gap-3 pt-2 border-t border-[#E8E4D9]">
            <button type="submit" disabled={saving || saved}
                    className="flex-1 flex items-center justify-center gap-2 bg-[var(--brand-primary)] text-white font-semibold text-sm py-3 rounded-xl hover:bg-[var(--brand-dark)] transition-colors disabled:opacity-70">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : saved ? <><Check size={15} />Saved!</> : 'Save'}
            </button>
            <button type="button" onClick={onCancel}
                    className="flex-1 border border-[#E8E4D9] text-[#73786F] font-semibold text-sm py-3 rounded-xl hover:bg-[var(--brand-background)]">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
