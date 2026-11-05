import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Printer, Trash2 } from 'lucide-react';
import { getAllProducts } from '../../utils/productStore';
import { useLocalDataRevision } from '../../hooks/useLocalDataRevision';
import { getAllDeliveryBoys } from '../../utils/deliveryStore';
import { applyOrderInventory, generateOrderId, saveOrderToStorage } from '../../utils/orderUtils';
import { formatINR } from '../../utils/formatPrice';
import type { CartItem, Order, ShippingAddress } from '../../types';

type SaleKind = 'phone_order' | 'walk_in_sale';
type SaleLine = CartItem & { key: string };
let saleLineSequence = 0;

const emptyAddress: ShippingAddress = {
  fullName: '', phone: '', addressLine1: '', city: '', state: '', pincode: '', country: 'India',
};

export default function CreateSale() {
  useLocalDataRevision();
  const navigate = useNavigate();
  const saleInProgress = useRef(false);
  const catalog = getAllProducts().filter((p) => p.isActive);
  const deliveryBoys = getAllDeliveryBoys().filter((boy) => boy.isActive);
  const [kind, setKind] = useState<SaleKind>('phone_order');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [productId, setProductId] = useState(catalog[0]?.id ?? '');
  const [variantId, setVariantId] = useState(catalog[0]?.variants[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [method, setMethod] = useState('Cash');
  const [paid, setPaid] = useState(true);
  const [deliveryBoyId, setDeliveryBoyId] = useState('');
  const [error, setError] = useState('');

  const selectedProduct = catalog.find((p) => p.id === productId);
  const selectedVariant = selectedProduct?.variants.find((v) => v.id === variantId);
  const subtotal = lines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const safeDiscount = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const total = Math.max(0, subtotal - safeDiscount + (kind === 'phone_order' ? Math.max(0, Number(delivery) || 0) : 0));

  const addLine = () => {
    if (!selectedProduct || !selectedVariant || !Number.isInteger(quantity) || quantity < 1) return;
    const current = lines.filter((line) => line.variantId === selectedVariant.id).reduce((sum, line) => sum + line.quantity, 0);
    if (current + quantity > selectedVariant.stock) { setError(`Only ${selectedVariant.stock} in stock for ${selectedProduct.name} ${selectedVariant.label}.`); return; }
    const item: SaleLine = {
      key: `${selectedVariant.id}-${++saleLineSequence}`,
      productId: selectedProduct.id,
      variantId: selectedVariant.id,
      name: selectedProduct.name,
      variantLabel: selectedVariant.label,
      price: selectedVariant.offlinePrice ?? selectedVariant.price,
      quantity,
      thumbnail: selectedProduct.thumbnail,
    };
    setLines((items) => [...items, item]);
    setError('');
  };

  const createSale = () => {
    if (saleInProgress.current) return;
    setError('');
    if (!lines.length) { setError('Add at least one product.'); return; }
    if (lines.some((item) => !Number.isFinite(item.price) || item.price < 0)) { setError('Selling price must be a valid amount of ₹0 or more.'); return; }
    if (kind === 'phone_order') {
      if (!name.trim() || !phone.trim() || !address.addressLine1.trim() || !address.city.trim() || !address.pincode.trim()) {
        setError('Phone orders need a customer name, phone and complete delivery address.'); return;
      }
      if (deliveryBoyId && !deliveryBoys.some((boy) => boy.id === deliveryBoyId)) { setError('Choose an active Delivery Boy.'); return; }
    }
    const quantities = new Map<string, number>();
    for (const item of lines) quantities.set(item.variantId, (quantities.get(item.variantId) ?? 0) + item.quantity);
    for (const [id, count] of quantities) {
      const product = catalog.find((p) => p.variants.some((variant) => variant.id === id));
      const variant = product?.variants.find((entry) => entry.id === id);
      if (!product || !variant || variant.stock < count) { setError('Stock changed while creating this sale. Review the quantities and try again.'); return; }
    }
    saleInProgress.current = true;

    const now = new Date().toISOString();
    const id = generateOrderId();
    const selectedBoy = deliveryBoys.find((boy) => boy.id === deliveryBoyId);
    const shippingAddress = kind === 'phone_order' ? { ...address, fullName: name.trim(), phone: phone.trim() } : emptyAddress;
    const order: Order = {
      id, orderNumber: id, userId: `admin-sale-${id}`, items: lines.map((item) => ({
        productId: item.productId, variantId: item.variantId, name: item.name,
        variantLabel: item.variantLabel, price: item.price, quantity: item.quantity,
        thumbnail: item.thumbnail,
        purchaseCostSnapshot: catalog.find((product) => product.id === item.productId)?.variants.find((variant) => variant.id === item.variantId)?.purchaseCost,
      })),
      shippingAddress, status: kind === 'walk_in_sale' ? 'delivered' : 'confirmed',
      paymentStatus: paid ? 'paid' : 'pending', paymentMethod: method,
      subtotal, discount: safeDiscount, shippingCharge: kind === 'phone_order' ? Math.max(0, Number(delivery) || 0) : 0,
      tax: 0, total, orderSource: kind, isWalkIn: kind === 'walk_in_sale',
      adminCustomerName: name.trim() || undefined, adminCustomerPhone: phone.trim() || undefined,
      adminCustomerEmail: email.trim() || undefined,
      timeline: [{ status: kind === 'walk_in_sale' ? 'delivered' : 'confirmed', timestamp: now, updatedBy: 'Admin', note: kind === 'walk_in_sale' ? 'Warehouse walk-in sale recorded.' : 'Phone / WhatsApp order created by admin.' }],
      createdAt: now, updatedAt: now,
      ...(selectedBoy && kind === 'phone_order' ? {
        deliveryBoyId: selectedBoy.id, deliveryBoyName: selectedBoy.name, assignedAt: now, assignedBy: 'Admin',
        assignmentHistory: [{ deliveryBoyId: selectedBoy.id, deliveryBoyName: selectedBoy.name, assignedAt: now, assignedBy: 'Admin' }],
      } : {}),
    };
    // The shared ledger makes a retry with the same order id a no-op.
    if (!applyOrderInventory(order, 'deduct')) { saleInProgress.current = false; setError('Stock changed while saving. Please check quantities and try again.'); return; }
    saveOrderToStorage(order);
    navigate(`/admin/orders/${id}`);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3"><Link to="/admin/orders" className="p-2 rounded-lg border border-[#E8E4D9]"><ArrowLeft size={18} /></Link><div><h1 className="text-xl font-semibold text-[#292D28]">Create Sale</h1><p className="text-sm text-[#73786F]">Record a phone order or a warehouse walk-in.</p></div></div>
      <div className="flex gap-2">
        {([{ id: 'phone_order', label: 'Phone / WhatsApp Order' }, { id: 'walk_in_sale', label: 'Warehouse Walk-in' }] as const).map((tab) => <button key={tab.id} onClick={() => { setKind(tab.id); if (tab.id === 'walk_in_sale') setDelivery(0); }} className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${kind === tab.id ? 'bg-[var(--brand-primary)] text-white' : 'bg-white border border-[#E8E4D9] text-[#73786F]'}`}>{tab.label}</button>)}
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="bg-white border border-[#E8E4D9] rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 font-semibold">Customer {kind === 'walk_in_sale' && <span className="text-xs font-normal text-[#73786F]">(optional)</span>}</h2>
        <input placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" />
        {kind === 'phone_order' && <><input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" /><input placeholder="Delivery address" value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" /><input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" /><input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" /><input placeholder="PIN code" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" /></>}
      </section>
      <section className="bg-white border border-[#E8E4D9] rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold">Products</h2>
        <div className="grid sm:grid-cols-[1fr_1fr_100px_auto] gap-3">
          <select value={productId} onChange={(e) => { const p = catalog.find((x) => x.id === e.target.value); setProductId(e.target.value); setVariantId(p?.variants[0]?.id ?? ''); }} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm">{catalog.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm">{selectedProduct?.variants.map((v) => <option key={v.id} value={v.id}>{v.label} · {formatINR(v.offlinePrice ?? v.price)} · {v.stock} in stock</option>)}</select>
          <input aria-label="Quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="rounded-xl border border-[#E8E4D9] px-3 py-2.5 text-sm" />
          <button type="button" onClick={addLine} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} />Add</button>
        </div>
        {lines.map((item) => <div key={item.key} className="flex flex-wrap items-center gap-3 border-t border-[#E8E4D9] pt-3 text-sm"><span className="flex-1 min-w-52">{item.name} · {item.variantLabel} × {item.quantity}</span><label className="text-xs">Unit price ₹<input type="number" min={0} value={item.price} onChange={(e) => { const price = Number(e.target.value); setLines((all) => all.map((line) => line.key === item.key ? { ...line, price } : line)); }} className="ml-1 w-24 rounded-lg border border-[#E8E4D9] px-2 py-1.5" /></label><span>{formatINR(item.price * item.quantity)}</span><button aria-label={`Remove ${item.name}`} onClick={() => setLines((all) => all.filter((line) => line.key !== item.key))} className="text-red-600"><Trash2 size={16} /></button></div>)}
      </section>
      <section className="bg-white border border-[#E8E4D9] rounded-2xl p-5 grid sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 font-semibold">Payment & totals</h2>
        <label className="text-sm">Payment method<select value={method} onChange={(e) => setMethod(e.target.value)} className="block mt-1 w-full rounded-xl border border-[#E8E4D9] px-3 py-2.5"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option></select></label>
        <label className="text-sm">Payment status<select value={paid ? 'paid' : 'pending'} onChange={(e) => setPaid(e.target.value === 'paid')} className="block mt-1 w-full rounded-xl border border-[#E8E4D9] px-3 py-2.5"><option value="paid">Paid</option><option value="pending">Pending</option></select></label>
        <label className="text-sm">Discount (₹)<input type="number" min={0} max={subtotal} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="block mt-1 w-full rounded-xl border border-[#E8E4D9] px-3 py-2.5" /></label>
        {kind === 'phone_order' && <label className="text-sm">Delivery charge (₹)<input type="number" min={0} value={delivery} onChange={(e) => setDelivery(Number(e.target.value))} className="block mt-1 w-full rounded-xl border border-[#E8E4D9] px-3 py-2.5" /></label>}
        {kind === 'phone_order' && <label className="sm:col-span-2 text-sm">Assign Delivery Boy (optional)<select value={deliveryBoyId} onChange={(e) => setDeliveryBoyId(e.target.value)} className="block mt-1 w-full rounded-xl border border-[#E8E4D9] px-3 py-2.5"><option value="">Assign later</option>{deliveryBoys.map((boy) => <option key={boy.id} value={boy.id}>{boy.name} · {boy.phone}</option>)}</select></label>}
        <div className="sm:col-span-2 flex justify-end"><div className="min-w-60 space-y-1 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></p><p className="flex justify-between"><span>Discount</span><span>−{formatINR(safeDiscount)}</span></p><p className="flex justify-between"><span>Delivery</span><span>{formatINR(kind === 'phone_order' ? Number(delivery) || 0 : 0)}</span></p><p className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatINR(total)}</span></p></div></div>
        <div className="sm:col-span-2 flex justify-end"><button disabled={!lines.length} onClick={createSale} className="rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><Printer className="inline mr-2" size={16} />Create Sale</button></div>
      </section>
      <p className="text-xs text-[#73786F]">Offline selling prices are selected by default from each product variant. Taxes are recorded as ₹0 for these manually entered sales.</p>
    </div>
  );
}
