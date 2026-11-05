import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { createInitialAdmin, hasAdminAccount } from '../../utils/adminAccounts';

export default function AdminSetup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (hasAdminAccount()) return <Navigate to="/admin/login" replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const result = await createInitialAdmin(name, email, password);
    setBusy(false);
    if (result.success) navigate('/admin/login', { replace: true });
    else setError(result.error ?? 'Could not create admin account.');
  };
  return <main className="min-h-screen bg-[var(--brand-dark)] flex items-center justify-center p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl space-y-4">
      <h1 className="text-2xl font-semibold text-[#292D28]">Set up the store admin</h1>
      <p className="text-sm text-[#73786F]">This one-time setup creates the first admin account on this browser.</p>
      <label className="block text-sm">Name<input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm">Password<input required type="password" minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="mt-1 w-full rounded-lg border p-3" /><span className="text-xs text-[#73786F]">At least 10 characters.</span></label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-[var(--brand-primary)] p-3 font-semibold text-white disabled:opacity-60">{busy ? 'Creating…' : 'Create admin account'}</button>
      <Link to="/" className="block text-center text-sm text-[var(--brand-primary)]">Return to store</Link>
    </form>
  </main>;
}
