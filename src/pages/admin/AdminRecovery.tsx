import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { resetAdminAccessForLocalRecovery } from '../../utils/adminAccounts';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const CONFIRMATION = 'RESET ADMIN ACCESS';

export default function AdminRecovery() {
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  if (!import.meta.env.DEV) return <Navigate to="/admin/login" replace />;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (confirmation !== CONFIRMATION) {
      setError(`Type “${CONFIRMATION}” to confirm.`);
      return;
    }
    if (!window.confirm('Reset only the saved Admin account and Admin session for this browser? Business data will remain untouched.')) return;

    setBusy(true);
    try {
      logout();
      resetAdminAccessForLocalRecovery();
      navigate('/admin/setup', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not reset local Admin access.');
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--brand-dark)] p-4">
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-[#292D28]">Recover local Admin access</h1>
        <p className="text-sm text-[#73786F]">This local-development recovery removes only <code>dtc_admin_accounts</code> and <code>dtc_admin_auth</code>. Products, orders, customers, inventory, images, settings, and other browser data are preserved.</p>
        <label className="block text-sm font-medium" htmlFor="recovery-confirmation">Type {CONFIRMATION} to continue</label>
        <input id="recovery-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" className="w-full rounded-lg border p-3" />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy || confirmation !== CONFIRMATION} className="w-full rounded-lg bg-red-700 p-3 font-semibold text-white disabled:opacity-50">{busy ? 'Resetting…' : 'Reset Admin access'}</button>
        <Link to="/admin/login" className="block text-center text-sm text-[var(--brand-primary)]">Cancel and return to Admin Login</Link>
      </form>
    </main>
  );
}
