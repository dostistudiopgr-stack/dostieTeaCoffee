import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { exportLocalData, parseLocalDataBackup, resetLocalData, restoreLocalData } from '../../utils/storage';
import { clearProductImages, exportLocalDataWithImages, restoreProductImages, saveMigrationBackup } from '../../utils/imageDb';

export default function LocalDataTools() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const exportBackup = async () => {
    setBusy(true); setMessage('');
    try {
      const content = await exportLocalDataWithImages(exportLocalData());
      const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `dosti-local-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
      setMessage('Backup downloaded. Store it somewhere safe.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Backup export failed.'); }
    finally { setBusy(false); }
  };
  const importBackup = async (file?: File) => {
    if (!file) return;
    setBusy(true); setMessage('');
    try {
      const raw = await file.text();
      const data = parseLocalDataBackup(raw);
      const parsed = JSON.parse(raw) as { images?: unknown };
      if (!window.confirm('Restore this backup? Current local records will be replaced.')) return;
      await saveMigrationBackup(`before-restore-${Date.now()}`, await exportLocalDataWithImages(exportLocalData()));
      restoreLocalData(data);
      if (parsed.images) await restoreProductImages(parsed.images);
      setMessage('Backup restored. Refresh the page if a screen still shows old data.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Backup restore failed.'); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };
  const reset = async () => {
    if (!window.confirm('Clear all local products, categories, orders, accounts, settings, stock records, and product images? This cannot be undone unless you exported a backup.')) return;
    setBusy(true); setMessage('');
    try {
      await saveMigrationBackup(`before-reset-${Date.now()}`, await exportLocalDataWithImages(exportLocalData()));
      resetLocalData(); await clearProductImages(); setMessage('Local business data cleared.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not complete reset.'); }
    finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-[#E8E4D9] bg-white p-6 space-y-4">
    <div><h2 className="font-semibold text-[#292D28]">Local data backup</h2><p className="mt-1 text-sm text-[#73786F]">Export or restore products, orders, accounts, settings, stock history, and uploaded images from this browser.</p></div>
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={exportBackup} className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Download size={16} />Export backup</button>
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-[#E8E4D9] px-4 py-2.5 text-sm font-semibold text-[var(--brand-primary)] disabled:opacity-60"><Upload size={16} />Restore backup</button>
      <input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void importBackup(event.currentTarget.files?.[0])} />
      <button type="button" disabled={busy} onClick={() => void reset()} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-60"><Trash2 size={16} />Reset local business data</button>
    </div>
    {message && <p role="status" className="text-sm text-[var(--brand-primary)]">{message}</p>}
  </section>;
}
