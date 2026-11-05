import { useState, useMemo, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Save, AlertCircle,
  CheckCircle, ImageIcon, X,
} from 'lucide-react';
import { saveProduct, getProductById, getAllProducts } from '../../utils/productStore';
import type { Product, ProductVariant, ProductCategory, ProductTag } from '../../types';
import ImageFilePicker from '../../admin-components/products/ImageFilePicker';
import { cleanupUnusedProductImages, storeProductImageFile } from '../../utils/imageDb';
import ProductImage from '../../components/product/ProductImage';

// ─── Shared styles ────────────────────────────────────────────────────────────

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

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface VariantRow extends Omit<ProductVariant, 'id'> { compareAtPrice?: number; purchaseCost?: number; offlinePrice?: number; }

const PRESET_SIZES = [
  { label: '100g', weight: 100 },
  { label: '250g', weight: 250 },
  { label: '500g', weight: 500 },
  { label: '1kg',  weight: 1000 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditProduct() {
  const navigate = useNavigate();
  const { id: productId } = useParams<{ id: string }>();

  const product = useMemo(() => {
    if (!productId) return undefined;
    return getProductById(productId);
  }, [productId]);

  // Section A
  const [name,             setName]             = useState(product?.name ?? '');
  const [slug,             setSlug]             = useState(product?.slug ?? '');
  const [category,         setCategory]         = useState<ProductCategory>(product?.category ?? 'tea');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '');
  const [description,      setDescription]      = useState(product?.description ?? '');

  // Section B — images
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images.filter((image) => /^(https?:|data:|blob:|\/)/i.test(image)) ?? ['']
  );
  const [existingImageIds, setExistingImageIds] = useState<string[]>(product?.images.filter((image) => !/^(https?:|data:|blob:|\/)/i.test(image)) ?? []);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Section C
  const [ingredients,   setIngredients]   = useState(product?.ingredients   ?? '');
  const [highlights,    setHighlights]    = useState((product?.highlights ?? []).join('\n'));
  const [storageInstructions, setStorage] = useState(product?.storageInstructions ?? '');
  const [shelfLife,     setShelfLife]     = useState(product?.shelfLife     ?? '');
  const [origin,        setOrigin]        = useState(product?.origin        ?? '');
  const [howToPrepare,  setHowToPrepare]  = useState(product?.howToPrepare  ?? '');

  // Section E — variants
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.map((v) => ({
      label:          v.label,
      weight:         v.weight,
      price:          v.price,
      compareAtPrice: v.compareAtPrice,
      purchaseCost:   v.purchaseCost,
      offlinePrice:   v.offlinePrice,
      sku:            v.sku,
      stock:          v.stock,
    })) ?? []
  );

  // Section F
  const [isActive,   setIsActive]   = useState(product?.isActive   ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // ── Not found ──────────────────────────────────────────────────────────────

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <AlertCircle size={36} className="text-[#73786F]" />
        <p className="text-base font-semibold text-[#292D28]">Product not found</p>
        <p className="text-sm text-[#73786F]">The product ID may be invalid or the product may have been removed.</p>
        <Link to="/admin/products" className="text-sm font-semibold text-[var(--brand-primary)] hover:underline">Back to Products</Link>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const setImageUrl  = (idx: number, url: string) => setImageUrls((urls) => urls.map((u, i) => i === idx ? url : u));
  const addImageField = () => setImageUrls((urls) => [...urls, '']);
  const removeImage  = (idx: number) => {
    setImageUrls((urls) => urls.filter((_, i) => i !== idx));
    if (primaryIndex >= idx && primaryIndex > 0) setPrimaryIndex((p) => p - 1);
  };

  const addVariant    = (preset?: typeof PRESET_SIZES[0]) =>
    setVariants((vs) => [...vs, { label: preset?.label ?? '', weight: preset?.weight ?? 0, price: 0, sku: '', stock: 0 }]);
  const removeVariant = (idx: number) => setVariants((vs) => vs.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, field: string, value: string | number) =>
    setVariants((vs) => vs.map((v, i) => i === idx ? { ...v, [field]: value } : v));

  // ── Validate ──────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!name.trim())             e.name        = 'Product name is required.';
    if (!slug.trim())             e.slug        = 'Slug is required.';
    if (!description.trim())      e.description = 'Full description is required.';
    if (!shortDescription.trim()) e.shortDesc   = 'Short description is required.';
    const validImgs = imageUrls.filter((u) => u.trim());
    if (validImgs.length === 0 && existingImageIds.length === 0 && imageFiles.length === 0) e.images = 'Upload an image or add an image URL.';
    if (variants.length === 0)    e.variants    = 'At least one variant is required.';
    const skus = new Set<string>();
    variants.forEach((v, i) => {
      if (!v.label.trim()) e[`v${i}_label`] = 'Pack size is required.';
      if (v.price <= 0)    e[`v${i}_price`] = 'Price must be greater than 0.';
      if (!v.sku.trim())   e[`v${i}_sku`]   = 'SKU is required.';
      else if (skus.has(v.sku.trim().toUpperCase())) e[`v${i}_sku`] = 'Duplicate SKU.';
      else skus.add(v.sku.trim().toUpperCase());
    });
    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);

    const validImgs = imageUrls.filter((u) => u.trim());
    let uploadedIds: string[];
    try { uploadedIds = await Promise.all(imageFiles.map((file) => storeProductImageFile(product.id, file))); }
    catch (error) { setSaving(false); setErrors({ images: error instanceof Error ? error.message : 'Could not save product images.' }); return; }
    const imageRefs = [...uploadedIds, ...existingImageIds, ...validImgs];
    const thumbnail = uploadedIds[0] ?? existingImageIds[0] ?? validImgs[primaryIndex] ?? validImgs[0] ?? product.thumbnail;

    const fullVariants: ProductVariant[] = variants.map((v, i) => ({
      id:             `${product.id}-v${i}`,
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

    const updated: Product = {
      ...product,
      name:               name.trim(),
      slug:               slug.trim(),
      category,
      description:        description.trim(),
      shortDescription:   shortDescription.trim(),
      thumbnail,
      images:             imageRefs,
      variants:           fullVariants,
      defaultVariantId:   fullVariants[0]?.id ?? product.defaultVariantId,
      highlights:         highlights.split('\n').map((h) => h.trim()).filter(Boolean),
      ingredients:        ingredients.trim() || undefined,
      howToPrepare:       howToPrepare.trim() || undefined,
      storageInstructions: storageInstructions.trim() || undefined,
      shelfLife:          shelfLife.trim() || undefined,
      origin:             origin.trim() || undefined,
      isActive,
      isFeatured,
      tags: isFeatured ? (['bestseller'] as ProductTag[]) : product.tags,
    };

    saveProduct(updated);
    const references = new Set(getAllProducts().flatMap((savedProduct) => savedProduct.images.filter((ref) => !/^(https?:|data:|blob:|\/)/i.test(ref))));
    await cleanupUnusedProductImages(references);
    setSaving(false);
    setSaved(true);
    setTimeout(() => navigate('/admin/products'), 1000);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-3xl" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/admin/products"
              className="p-2 rounded-lg border border-[#E8E4D9] text-[#73786F] hover:bg-[var(--brand-background)] hover:text-[#292D28] transition-colors shrink-0 mt-0.5">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[#292D28]" style={{ fontFamily: 'var(--font-heading)' }}>
            Edit: {product.name}
          </h1>
          <p className="text-xs text-[#73786F] font-mono mt-0.5">{product.sku ?? product.id}</p>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
          <CheckCircle size={16} />Changes saved successfully! Redirecting…
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

        {/* A — Basic info */}
        <SectionCard title="A — Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Product Name <span className="text-red-500">*</span></label>
              <input className={errors.name ? inputErrCls : inputCls} value={name} onChange={(e) => { setName(e.target.value); if (!slug || slug === slugify(product.name)) setSlug(slugify(e.target.value)); }} />
              <FieldError msg={errors.name} />
            </div>
            <div>
              <label className={labelCls}>Slug <span className="text-red-500">*</span></label>
              <input className={errors.slug ? inputErrCls : inputCls} value={slug} onChange={(e) => setSlug(e.target.value)} />
              <FieldError msg={errors.slug} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
                <option value="tea">Tea Powders</option>
                <option value="coffee">Coffee Powders</option>
                <option value="green-tea">Green Tea Powders</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Short Description <span className="text-red-500">*</span></label>
              <input className={errors.shortDesc ? inputErrCls : inputCls} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
              <FieldError msg={errors.shortDesc} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Full Description <span className="text-red-500">*</span></label>
              <textarea className={`${errors.description ? inputErrCls : inputCls} resize-y`} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
              <FieldError msg={errors.description} />
            </div>
          </div>
        </SectionCard>

        {/* B — Images */}
        <SectionCard title="B — Product Images" subtitle="Upload images to this browser or edit image URLs. The first uploaded image becomes primary.">
          <div className="flex flex-col gap-3">
            <ImageFilePicker files={imageFiles} onChange={setImageFiles} />
            {existingImageIds.map((imageId) => <div key={imageId} className="flex items-center gap-3 rounded-lg border border-[#E8E4D9] p-2"><ProductImage src={imageId} alt="Saved product image" className="h-14 w-14 rounded object-cover" /><span className="flex-1 text-xs text-[#73786F]">Saved image</span><button type="button" onClick={() => setExistingImageIds((ids) => ids.filter((id) => id !== imageId))} className="rounded p-2 text-red-600" aria-label="Remove saved image"><X size={15} /></button></div>)}
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="w-14 h-14 rounded-xl border border-[#E8E4D9] bg-[var(--brand-background)] shrink-0 overflow-hidden flex items-center justify-center">
                  {url.trim()
                    ? <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                    : <ImageIcon size={20} className="text-[#E8E4D9]" />}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <input className={errors.images && !url.trim() ? inputErrCls : inputCls}
                         value={url} onChange={(e) => setImageUrl(idx, e.target.value)} placeholder="https://…" />
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#73786F]">
                    <input type="radio" name="primary" checked={primaryIndex === idx} onChange={() => setPrimaryIndex(idx)} className="w-3.5 h-3.5 accent-[var(--brand-primary)]" />
                    Set as primary
                    {primaryIndex === idx && <span className="text-[10px] font-semibold text-[var(--brand-accent)] ml-1">★ Primary</span>}
                  </label>
                </div>
                {imageUrls.length > 1 && (
                  <button type="button" onClick={() => removeImage(idx)} className="p-2 rounded-lg text-[#73786F] hover:text-red-500 hover:bg-red-50 transition-colors">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
            <FieldError msg={errors.images} />
            <button type="button" onClick={addImageField}
                    className="flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-dark)] w-fit">
              <Plus size={15} />Add image URL
            </button>
          </div>
        </SectionCard>

        {/* C — Details */}
        <SectionCard title="C — Product Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Ingredients</label>
              <textarea className={`${inputCls} resize-y`} rows={3} value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Product Highlights <span className="text-[#73786F] font-normal">(one per line)</span></label>
              <textarea className={`${inputCls} resize-y`} rows={3} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>How to Prepare</label>
              <textarea className={`${inputCls} resize-y`} rows={4} value={howToPrepare} onChange={(e) => setHowToPrepare(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Storage Instructions</label>
              <input className={inputCls} value={storageInstructions} onChange={(e) => setStorage(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Shelf Life</label>
              <input className={inputCls} value={shelfLife} onChange={(e) => setShelfLife(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Origin</label>
              <input className={inputCls} value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </div>
          </div>
        </SectionCard>

        {/* E — Variants */}
        <SectionCard title="E — Weight Variants & Pricing">
          {errors.variants && <FieldError msg={errors.variants} />}
          <div className="flex flex-col gap-3 mb-4">
            {variants.map((v, idx) => (
              <div key={idx} className="p-4 bg-[var(--brand-background)] rounded-xl border border-[#E8E4D9]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-[#292D28]">Variant {idx + 1}</p>
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(idx)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <Trash2 size={13} />Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Pack Size <span className="text-red-500">*</span></label>
                    <input className={errors[`v${idx}_label`] ? inputErrCls : inputCls} value={v.label} onChange={(e) => updateVariant(idx, 'label', e.target.value)} />
                    <FieldError msg={errors[`v${idx}_label`]} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Weight (g)</label>
                    <input type="number" min="0" className={inputCls} value={v.weight} onChange={(e) => updateVariant(idx, 'weight', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Price (₹) <span className="text-red-500">*</span></label>
                    <input type="number" min="0" className={errors[`v${idx}_price`] ? inputErrCls : inputCls} value={v.price} onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))} />
                    <FieldError msg={errors[`v${idx}_price`]} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Compare-at Price (₹)</label>
                    <input type="number" min="0" className={inputCls} value={v.compareAtPrice ?? ''} onChange={(e) => updateVariant(idx, 'compareAtPrice', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">
                      Purchase Cost (₹)
                      <span className="text-[#73786F] font-normal ml-0.5">(internal)</span>
                    </label>
                    <input type="number" min="0" className={inputCls}
                           value={v.purchaseCost ?? ''}
                           onChange={(e) => updateVariant(idx, 'purchaseCost', Number(e.target.value))}
                           placeholder="Your cost price" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">
                      Offline / Walk-in Price (₹)
                      <span className="text-[#73786F] font-normal ml-0.5">(internal)</span>
                    </label>
                    <input type="number" min="0" className={inputCls}
                           value={v.offlinePrice ?? ''}
                           onChange={(e) => updateVariant(idx, 'offlinePrice', Number(e.target.value))}
                           placeholder="Counter / walk-in price" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">SKU <span className="text-red-500">*</span></label>
                    <input className={errors[`v${idx}_sku`] ? inputErrCls : inputCls} value={v.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} />
                    <FieldError msg={errors[`v${idx}_sku`]} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#73786F] mb-1 block">Stock</label>
                    <input type="number" min="0" className={inputCls} value={v.stock} onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-[#73786F] self-center">Quick add:</span>
            {PRESET_SIZES.map((p) => (
              <button key={p.label} type="button" onClick={() => addVariant(p)}
                      className="text-xs font-semibold text-[var(--brand-primary)] border border-[var(--brand-primary)]/30 px-3 py-1.5 rounded-lg hover:bg-[var(--brand-primary)]/5">
                + {p.label}
              </button>
            ))}
            <button type="button" onClick={() => addVariant()}
                    className="flex items-center gap-1 text-xs font-semibold text-[#73786F] border border-[#E8E4D9] px-3 py-1.5 rounded-lg hover:bg-[var(--brand-background)]">
              <Plus size={12} />Custom
            </button>
          </div>
        </SectionCard>

        {/* F — Visibility */}
        <SectionCard title="F — Product Visibility">
          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-primary)] shrink-0" />
              <div>
                <span className="text-sm font-medium text-[#292D28]">Active — visible on store</span>
                <p className="text-xs text-[#73786F] mt-0.5">Inactive products are hidden from new purchases. Historical orders are not affected.</p>
              </div>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-[var(--brand-primary)] shrink-0" />
              <div>
                <span className="text-sm font-medium text-[#292D28]">Featured — show on homepage</span>
                <p className="text-xs text-[#73786F] mt-0.5">Adds this product to the Best Sellers section.</p>
              </div>
            </label>
          </div>
        </SectionCard>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 py-2">
          <button type="submit" disabled={saving || saved}
                  className="flex items-center gap-2 bg-[var(--brand-primary)] text-white font-semibold text-sm
                             px-7 py-3 rounded-xl hover:bg-[var(--brand-dark)] transition-colors
                             disabled:opacity-70 focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : saved ? <><CheckCircle size={16} />Saved!</>
              : <><Save size={16} />Save Changes</>}
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
