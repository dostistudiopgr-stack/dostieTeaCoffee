import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { validateProductImage } from '../../utils/productImages';

export default function ImageFilePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [error, setError] = useState('');
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);
  const choose = (incoming: FileList | null) => {
    if (!incoming) return;
    const additions = Array.from(incoming);
    const invalid = additions.map(validateProductImage).find(Boolean);
    if (invalid) { setError(invalid); return; }
    setError(''); onChange([...files, ...additions]);
  };
  return <div className="space-y-3">
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#E8E4D9] px-3 py-2 text-sm text-[var(--brand-primary)] hover:bg-[var(--brand-background)]">
      <ImagePlus size={16} /> Upload product images
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => { choose(event.currentTarget.files); event.currentTarget.value = ''; }} />
    </label>
    <p className="text-xs text-[#73786F]">JPG, PNG, or WebP; up to 5 MB each. First uploaded image is primary.</p>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    {files.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{files.map((file, index) => <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-xl border border-[#E8E4D9]">
      <img src={previews[index]} alt={`Selected product image ${index + 1}`} className="aspect-square w-full object-cover" />
      {index === 0 && <span className="absolute bottom-1 left-1 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold">Primary</span>}
      {index > 0 && <button type="button" onClick={() => onChange([file, ...files.filter((_, i) => i !== index)])} className="absolute bottom-1 left-1 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold">Make primary</button>}
      <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded-full bg-white p-1 text-red-600 shadow"><X size={14} /></button>
    </div>)}</div>}
  </div>;
}
