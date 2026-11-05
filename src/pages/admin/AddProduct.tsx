import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Save, AlertCircle,
  CheckCircle, ImageIcon, X,
} from 'lucide-react';
import { saveProduct, getAllProducts } from '../../utils/productStore';
import { generateProductSku, collectAllSkus } from '../../utils/skuGenerator';
import ImageFilePicker from '../../admin-components/products/ImageFilePicker';
import { cleanupUnusedProductImages, storeProductImageFile } from '../../utils/imageDb';
import { createId } from '../../utils/storage';
import type { Product, ProductVariant, ProductCategory, ProductTag } from '../../types';

// ─── Shared style helpers ─────────────────────────────────────────────────────

const inputCls = [
  'w-full rounded-xl border border-[#E8E4D9] px-3.5 py-2.5 text-sm text-[#292D28]',
  'bg-white placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10',
].join(' ');

const inputErrCls = [
  'w-full rounded-xl border border-red-400 px-3.5 py-2.5 text-sm text-[#292D28]',
  'bg-white placeholder:text-[#73786F]/60 transition-all',
  'focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200',
].join(' ');

const labelCls = 'text-sm font-medium text-[#292D28] mb-1.5 block';

const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-[#E8E4D9] p-6">
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-[#292D28]">{title}</h2>
      {subtitle && <p className="text-xs text-[#73786F] mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p role="alert" className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{msg}</p> : null;

// ─── Slugify helper ───────────────────────────────────────────────────────────

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Variant row ──────────────────────────────────────────────────────────────

interface VariantRow extends Omit<ProductVariant, 'id'> {
  compareAtPrice?: number;
  purchaseCost?:   number;
  offlinePrice?:   number;
}

const PRESET_SIZES = [
  { label: '100g', weight: 100 },
  { label: '250g', weight: 250 },
  { label: '500g', weight: 500 },
  { label: '1kg',  weight: 1000 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddProduct() {
  const navigate = useNavigate();

  // Section A — Basic info
  const [name,             setName]             = useState('');
  const [slug,             setSlug]             = useState('');
  const [slugManual,       setSlugManual]        = useState(false);
  const [category,         setCategory]         = useState<ProductCategory>('tea');
  const [shortDescription, setShortDescription] = useState('');
  const [description,      setDescription]      = useState('');

  // Section B — Images (URL-based with preview)
  const [imageUrls,    setImageUrls]    = useState<string[]>(['']);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);

  // Section C — Product details
  const [ingredients,   setIngredients]   = useState('');
  const [highlights,    setHighlights]    = useState('');  // newline-separated
  const [storageInstructions, setStorage] = useState('');
  const [shelfLife,     setShelfLife]     = useState('');
  const [origin,        setOrigin]        = useState('');
  const [howToPrepare,  setHowToPrepare]  = useState('');

  // Section E — Variants
  const [variants, setVariants] = useState<VariantRow[]>([
    { label: '250g', weight: 250, price: 0, sku: '', stock: 0 },
  ]);

  // Section F — Visibility
  const [isActive,   setIsActive]   = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Form state
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugManual) setSlug(slugify(v));
  };

  const setImageUrl = (idx: number, url: string) =>
    setImageUrls((urls) => urls.map((u, i) => i === idx ? url : u));

  const addImageField = () => setImageUrls((urls) => [...urls, '']);
  const removeImage   = (idx: number) => {
    setImageUrls((urls) => urls.filter((_, i) => i !== idx));
    if (primaryIndex >= idx && primaryIndex > 0) setPrimaryIndex((p) => p - 1);
  };

  const addVariant = (preset?: typeof PRESET_SIZES[0]) =>
    setVariants((vs) => [
      ...vs,
      { label: preset?.label ?? '', weight: preset?.weight ?? 0, price: 0, sku: '', stock: 0 },
    ]);

  const removeVariant = (idx: number) =>
    setVariants((vs) => vs.filter((_, i) => i !== idx));

  const updateVariant = (idx: number, field: string, value: string | number) =>
    setVariants((vs) => vs.map((v, i) => i === idx ? { ...v, [field]: value } : v));

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!name.trim())             e.name        = 'Product name is required.';
    if (!slug.trim())             e.slug        = 'Slug is required.';
    if (!description.trim())      e.description = 'Full description is required.';
    if (!shortDescription.trim()) e.shortDesc   = 'Short description is required.';

    const validImages = imageUrls.filter((u) => u.trim());
    if (validImages.length === 0 && imageFiles.length === 0) e.images = 'Upload an image or enter an image URL.';

    if (variants.length === 0) e.variants = 'At least one variant is required.';

    // Per-variant checks
    const skus = new Set<string>();
    variants.forEach((v, i) => {
      if (!v.label.trim())  e[`v${i}_label`] = 'Pack size label is required.';
      if (v.price <= 0)     e[`v${i}_price`] = 'Price must be greater than 0.';
      if (!v.sku.trim())    e[`v${i}_sku`]   = 'SKU is required.';
      else if (skus.has(v.sku.trim().toUpperCase())) {
        e[`v${i}_sku`] = 'Duplicate SKU — each variant must have a unique SKU.';
      } else {
        skus.add(v.sku.trim().toUpperCase());
      }
    });

    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      // Scroll to first error
      const firstField = document.querySelector('[role="alert"]');
      firstField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSaving(true);

    const id         = createId('product');
    const productSku = generateProductSku(name.trim(), category, collectAllSkus(getAllProducts()));
    const validImgs  = imageUrls.filter((u) => u.trim());
    let storedImageIds: string[];
    try {
      storedImageIds = await Promise.all(imageFiles.map((file) => storeProductImageFile(id, file)));
    } catch (error) {
      setSaving(false); setErrors({ images: error instanceof Error ? error.message : 'Could not save product images.' }); return;
    }
    const allImages = [...storedImageIds, ...validImgs];
    const thumbnail  = storedImageIds[0] ?? validImgs[primaryIndex] ?? validImgs[0] ?? '';

    const fullVariants: ProductVariant[] = variants.map((v, i) => ({
      id:             `${id}-v${i}`,
      label:          v.label.trim(),
      weight:         Number(v.weight),
      price:          Number(v.price),
      compareAtPrice: v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price)
                        ? Number(v.compareAtPrice) : undefined,
      purchaseCost:   v.purchaseCost  ? Number(v.purchaseCost)  : undefined,
      offlinePrice:   v.offlinePrice  ? Number(v.offlinePrice)  : undefined,
      sku:            v.sku.trim().toUpperCase(),
      stock:          Math.max(0, Number(v.stock)),
    }));

    const product: Product = {
      id,
      name:              name.trim(),
      slug:              slug.trim(),
      sku:               productSku,
      description:       description.trim(),
      shortDescription:  shortDescription.trim(),
      category,
      subCategory:       undefined,
      tags:              (isFeatured ? ['bestseller'] : []) as ProductTag[],
      variants:          fullVariants,
      defaultVariantId:  fullVariants[0].id,
      images:            allImages,
      thumbnail,
      rating:            0,
      reviewCount:       0,
      packagingType:     'pouch',
      highlights:        highlights.split('\n').map((h) => h.trim()).filter(Boolean),
      ingredients:       ingredients.trim() || undefined,
      howToPrepare:      howToPrepare.trim() || undefined,
      storageInstructions: storageInstructions.trim() || undefined,
      shelfLife:         shelfLife.trim() || undefined,
      origin:            origin.trim() || undefined,
      countryOfOrigin:   'India',
      isFeatured,
      isActive,
      createdAt:         new Date().toISOString(),
    };

    saveProduct(product);
    const references = new Set(getAllProducts().flatMap((savedProduct) => savedProduct.images.filter((ref) => !/^(https?:|data:|blob:|\/)/i.test(ref))));
    await cleanupUnusedProductImages(references);
    setSaving(false);
    setSaved(true);

    setTimeout(() => {
      navigate('/admin/products');
    }, 1000);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-3xl" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/products"
              className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F] hover:bg-[var(--brand-background)] hover:text-[#292D28] transition-colors shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
            Add New Product
          </h1>
          <p className="text-sm text-[#73786F]">Fill in all required fields marked with *</p>
        </div>
      </div>

      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle size={16} aria-hidden="true" />
          Product saved successfully! Redirecting to listing…
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

        {/* ── Section A: Basic Information ──────────────────── */}
        <SectionCard title="A — Basic Information" subtitle="Core product identity details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Product Name <span className="text-red-500">*</span></label>
              <input className={errors.name ? inputErrCls : inputCls}
                     value={name} onChange={(e) => handleNameChange(e.target.value)}
                     placeholder="e.g. Premium Assam Tea Powder" />
              <FieldError msg={errors.name} />
            </div>

            <div>
              <label className={labelCls}>Slug <span className="text-red-500">*</span></label>
              <input className={errors.slug ? inputErrCls : inputCls}
                     value={slug}
                     onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                     placeholder="premium-assam-tea-powder" />
              <FieldError msg={errors.slug} />
            </div>

            <div>
              <label className={labelCls}>Category <span className="text-red-500">*</span></label>
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
                <option value="tea">Tea Powders</option>
                <option value="coffee">Coffee Powders</option>
                <option value="green-tea">Green Tea Powders</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Short Description <span className="text-red-500">*</span>
                <span className="text-[#73786F] font-normal ml-1">(used on product cards)</span>
              </label>
              <input className={errors.shortDesc ? inputErrCls : inputCls}
                     value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
                     placeholder="One-line summary — e.g. Bold CTC Assam powder for a strong, malty daily chai." />
              <FieldError msg={errors.shortDesc} />
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>Full Description <span className="text-red-500">*</span></label>
              <textarea className={`${errors.description ? inputErrCls : inputCls} resize-y`} rows={5}
                        value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed product description for the product details page." />
              <FieldError msg={errors.description} />
            </div>
          </div>
        </SectionCard>

        {/* ── Section B: Images ─────────────────────────────── */}
        <SectionCard title="B — Product Images"
                     subtitle="Upload images to this browser or add a public image URL.">
          <div className="flex flex-col gap-3">
            <ImageFilePicker files={imageFiles} onChange={setImageFiles} />
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                {/* Preview thumbnail */}
                <div className="w-14 h-14 rounded-xl border border-[#E8E4D9] bg-[var(--brand-background)] shrink-0 overflow-hidden flex items-center justify-center">
                  {url.trim() ? (
                    <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover"
                         onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement)?.removeAttribute('style'); }} />
                  ) : (
                    <ImageIcon size={20} className="text-[#E8E4D9]" />
                  )}
                  <ImageIcon size={20} className="text-[#E8E4D9]" style={{ display: 'none' }} aria-hidden="true" />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <input className={errors.images && !url.trim() ? inputErrCls : inputCls}
                         value={url} onChange={(e) => setImageUrl(idx, e.target.value)}
                         placeholder="https://example.com/product-image.jpg" />
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#73786F]">
                      <input type="radio" name="primary-image" checked={primaryIndex === idx}
                             onChange={() => setPrimaryIndex(idx)}
                             className="w-3.5 h-3.5 accent-[var(--brand-primary)]" />
                      Set as primary
                    </label>
                    {primaryIndex === idx && (
                      <span className="text-[10px] font-semibold text-[var(--brand-accent)]">★ Primary</span>
                    )}
                  </div>
                </div>

                {imageUrls.length > 1 && (
                  <button type="button" onClick={() => removeImage(idx)}
                          className="p-2 rounded-lg text-[#73786F] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}

            <FieldError msg={errors.images} />

            <button type="button" onClick={addImageField}
                    className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)] transition-colors w-fit">
              <Plus size={15} />Add another image URL
            </button>
          </div>
        </SectionCard>

        {/* ── Section C: Product Details ────────────────────── */}
        <SectionCard title="C — Product Details" subtitle="Ingredients, preparation, storage and origin details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Ingredients</label>
              <textarea className={`${inputCls} resize-y`} rows={3} value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="e.g. Black tea powder (CTC grade, Assam origin). No additives." />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Product Highlights
                <span className="text-[#73786F] font-normal ml-1">(one per line)</span>
              </label>
              <textarea className={`${inputCls} resize-y`} rows={3} value={highlights}
                        onChange={(e) => setHighlights(e.target.value)}
                        placeholder={"CTC-grade Assam tea powder\nResealable stand-up pouch\nSuitable for daily chai"} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>How to Prepare</label>
              <textarea className={`${inputCls} resize-y`} rows={4} value={howToPrepare}
                        onChange={(e) => setHowToPrepare(e.target.value)}
                        placeholder={"1. Add 1 tsp to 200ml boiling water.\n2. Simmer with milk for 3 min.\n3. Strain and serve."} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Storage Instructions</label>
              <input className={inputCls} value={storageInstructions}
                     onChange={(e) => setStorage(e.target.value)}
                     placeholder="e.g. Store in a cool, dry place. Reseal after use." />
            </div>
            <div>
              <label className={labelCls}>Shelf Life</label>
              <input className={inputCls} value={shelfLife} onChange={(e) => setShelfLife(e.target.value)}
                     placeholder="e.g. Best before 18 months from manufacture" />
            </div>
            <div>
              <label className={labelCls}>Origin</label>
              <input className={inputCls} value={origin} onChange={(e) => setOrigin(e.target.value)}
                     placeholder="e.g. Assam, India" />
            </div>
          </div>
        </SectionCard>

        {/* ── Section D: Packaging ──────────────────────────── */}
        <SectionCard title="D — Packaging"
                     subtitle="Select the packaging type for this product. Only currently available pouch types are shown.">
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-3 p-4 bg-[var(--brand-background)] border-2 border-[var(--brand-primary)] rounded-xl cursor-pointer">
              <input type="radio" name="packaging" defaultChecked className="w-4 h-4 mt-0.5 accent-[var(--brand-primary)] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#292D28]">Resealable Stand-up Pouch</p>
                <p className="text-xs text-[#73786F] mt-0.5">Currently available — sealed powder pouch with resealable zip lock.</p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 bg-[var(--brand-background)] border border-[#E8E4D9] rounded-xl opacity-50 cursor-not-allowed">
              <input type="radio" name="packaging" disabled className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#292D28]">Airtight Jar <span className="text-xs text-[#73786F] font-normal">(Coming Soon)</span></p>
                <p className="text-xs text-[#73786F] mt-0.5">Future packaging option — not currently available.</p>
              </div>
            </label>
          </div>
        </SectionCard>

        {/* ── Section E: Variants ───────────────────────────── */}
        <SectionCard title="E — Weight Variants & Pricing"
                     subtitle="Add one or more pack sizes. Each variant must have a unique SKU.">
          {errors.variants && <FieldError msg={errors.variants} />}

          <div className="flex flex-col gap-3 mb-4">
            {variants.map((v, idx) => (
              <div key={idx} className="p-4 bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[#292D28]">Variant {idx + 1}</p>
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(idx)}
                            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <Trash2 size={13} />Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Pack Size <span className="text-red-500">*</span></label>
                    <input className={errors[`v${idx}_label`] ? inputErrCls : inputCls}
                           value={v.label} placeholder="250g"
                           onChange={(e) => updateVariant(idx, 'label', e.target.value)} />
                    <FieldError msg={errors[`v${idx}_label`]} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Weight (g)</label>
                    <input type="number" min="0" className={inputCls} value={v.weight || ''}
                           onChange={(e) => updateVariant(idx, 'weight', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Selling Price (₹) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" className={errors[`v${idx}_price`] ? inputErrCls : inputCls}
                           value={v.price || ''}
                           onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))} />
                    <FieldError msg={errors[`v${idx}_price`]} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Compare-at Price (₹)
                      <span className="text-[#73786F] font-normal ml-0.5">(optional)</span>
                    </label>
                    <input type="number" min="0" className={inputCls}
                           value={v.compareAtPrice || ''}
                           onChange={(e) => updateVariant(idx, 'compareAtPrice', Number(e.target.value))}
                           placeholder="Original price before discount" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">
                      Purchase Cost (₹)
                      <span className="text-[#73786F] font-normal ml-0.5">(internal)</span>
                    </label>
                    <input type="number" min="0" className={inputCls}
                           value={v.purchaseCost || ''}
                           onChange={(e) => updateVariant(idx, 'purchaseCost', Number(e.target.value))}
                           placeholder="Your cost price" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">
                      Offline / Walk-in Price (₹)
                      <span className="text-[#73786F] font-normal ml-0.5">(internal)</span>
                    </label>
                    <input type="number" min="0" className={inputCls}
                           value={v.offlinePrice || ''}
                           onChange={(e) => updateVariant(idx, 'offlinePrice', Number(e.target.value))}
                           placeholder="Counter / walk-in price" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">SKU <span className="text-red-500">*</span></label>
                    <input className={errors[`v${idx}_sku`] ? inputErrCls : inputCls}
                           value={v.sku} placeholder="PAT-250"
                           onChange={(e) => updateVariant(idx, 'sku', e.target.value)} />
                    <FieldError msg={errors[`v${idx}_sku`]} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Stock Quantity</label>
                    <input type="number" min="0" className={inputCls} value={v.stock || ''}
                           onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick-add preset sizes */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[#73786F] self-center">Quick add:</span>
            {PRESET_SIZES.map((preset) => (
              <button key={preset.label} type="button"
                      onClick={() => addVariant(preset)}
                      className="text-xs font-semibold text-[var(--brand-primary)] border border-[var(--brand-primary)]/30
                                 px-3 py-1.5 rounded-lg hover:bg-[var(--brand-primary)]/5 transition-colors">
                + {preset.label}
              </button>
            ))}
            <button type="button" onClick={() => addVariant()}
                    className="flex items-center gap-1 text-xs font-semibold text-[#73786F]
                               border border-[#E8E4D9] px-3 py-1.5 rounded-lg hover:bg-[var(--brand-background)] transition-colors">
              <Plus size={12} />Custom
            </button>
          </div>
        </SectionCard>

        {/* ── Section F: Visibility ─────────────────────────── */}
        <SectionCard title="F — Product Visibility"
                     subtitle="Control where this product appears in the store.">
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                     className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-primary)] shrink-0" />
              <div>
                <span className="text-sm font-medium text-[#292D28]">Active — visible on store</span>
                <p className="text-xs text-[#73786F] mt-0.5">When inactive, this product will not appear for new customer purchases. Existing cart and order data is unaffected.</p>
              </div>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)}
                     className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-primary)] shrink-0" />
              <div>
                <span className="text-sm font-medium text-[#292D28]">Featured — show on homepage</span>
                <p className="text-xs text-[#73786F] mt-0.5">Adds this product to the Best Sellers section on the homepage.</p>
              </div>
            </label>
          </div>
        </SectionCard>

        {/* ── Form actions ─────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 py-2">
          <button type="submit" disabled={saving || saved}
                  className="flex items-center gap-2 bg-[var(--brand-primary)] text-white font-semibold text-sm
                             px-7 py-3 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                             disabled:opacity-70 focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : saved
              ? <><CheckCircle size={16} />Saved!</>
              : <><Save size={16} />Save Product</>}
          </button>
          <Link to="/admin/products"
                className="flex items-center gap-2 border border-[#E8E4D9] text-[#73786F]
                           font-semibold text-sm px-7 py-3 rounded-xl
                           hover:bg-[var(--brand-background)] hover:text-[#292D28] transition-colors">
            Cancel
          </Link>
        </div>

      </form>
    </div>
  );
}
