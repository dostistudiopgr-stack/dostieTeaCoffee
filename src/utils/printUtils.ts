import type { Order } from '../types';
import { formatINR }   from './formatPrice';
import { loadSettings } from './productStore';

function getPrintBrand() {
  const settings = loadSettings();
  const store = settings.store;
  return {
    name: store.name,
    tagline: store.tagline,
    email: store.email,
    phone: store.phone,
    address: store.address,
    branding: settings.branding,
  };
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char] ?? char));

/** Printable receipt for warehouse sales; this does not enter parcel fulfillment. */
export function printWalkInSaleBill(order: Order): void {
  const brand = getPrintBrand();
  const rows = order.items.map((item) => `<tr><td>${escapeHtml(item.name)} · ${escapeHtml(item.variantLabel)}</td><td>${item.quantity}</td><td>${formatINR(item.price)}</td><td>${formatINR(item.price * item.quantity)}</td></tr>`).join('');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Sale Bill ${escapeHtml(order.orderNumber)}</title><style>body{font:14px Arial,sans-serif;color:#292d28;max-width:720px;margin:32px auto;padding:16px}header{border-bottom:2px solid ${brand.branding.primary};padding-bottom:12px;margin-bottom:20px}h1{margin:0;color:${brand.branding.primary}}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{text-align:left;border-bottom:1px solid #ddd;padding:9px}th:last-child,td:last-child{text-align:right}.total{text-align:right;font-size:18px;font-weight:bold}.meta{color:#555}@media print{body{margin:0}}</style></head><body><header><h1>${escapeHtml(brand.name)}</h1><p>${escapeHtml(brand.tagline)}</p></header><h2>Customer Bill</h2><p class="meta">Sale: ${escapeHtml(order.orderNumber)} · Invoice: ${escapeHtml(order.orderNumber)}<br>${fmtDateTime(order.createdAt)}</p><p>Customer: ${escapeHtml(order.adminCustomerName || 'Walk-in customer')}${order.adminCustomerPhone ? ` · ${escapeHtml(order.adminCustomerPhone)}` : ''}</p><table><thead><tr><th>Product / Variant</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p>Subtotal: ${formatINR(order.subtotal)}</p><p>Discount: −${formatINR(order.discount)}</p><p class="total">Total: ${formatINR(order.total)}</p><p>Payment: ${escapeHtml(order.paymentMethod)} · ${escapeHtml(order.paymentStatus)}</p><script>window.onload=()=>window.print()</script></body></html>`);
  win.document.close();
}

// ─── Customer Invoice (browser print-to-PDF) ──────────────────────────────────

/**
 * Opens a print-friendly invoice in a new window.
 * The browser's print dialog allows the user to save as PDF.
 * Only available for delivered orders.
 */
export function printInvoice(order: Order): void {
  const brand = getPrintBrand();
  const deliveredEntry = order.timeline.find((t) => t.status === 'delivered');

  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #E8E4D9">${item.name}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #E8E4D9;text-align:center">${item.variantLabel}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #E8E4D9;text-align:center;font-family:monospace;font-size:11px">
        ${((): string => {
          // SKU is on the variant — look it up by variantId from the order item
          return item.variantId.toUpperCase().replace('PROD-', '');
        })()}
      </td>
      <td style="padding:6px 8px;border-bottom:1px solid #E8E4D9;text-align:center">${item.quantity}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #E8E4D9;text-align:right">${formatINR(item.price)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #E8E4D9;text-align:right;font-weight:600">${formatINR(item.price * item.quantity)}</td>
    </tr>`).join('');

  const addr = order.shippingAddress;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — ${order.orderNumber}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', Arial, sans-serif; font-size: 13px; color: #292D28; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 3px solid ${brand.branding.primary}; margin-bottom: 24px; }
    .brand-name { font-size: 22px; font-weight: 700; color: ${brand.branding.primary}; font-family: Georgia, serif; }
    .brand-tag  { font-size: 11px; color: #73786F; margin-top: 2px; }
    .inv-title  { font-size: 26px; font-weight: 700; color: #292D28; text-align: right; }
    .inv-meta   { font-size: 11px; color: #73786F; text-align: right; margin-top: 4px; }
    .info-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .info-box h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: ${brand.branding.accent}; margin-bottom: 6px; }
    .info-box p { font-size: 12px; line-height: 1.6; color: #292D28; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead { background: ${brand.branding.primary}; color: #fff; }
    thead th { padding: 8px; font-size: 11px; font-weight: 600; text-align: left; }
    thead th:nth-child(3), thead th:nth-child(4) { text-align: center; }
    thead th:nth-child(5), thead th:nth-child(6) { text-align: right; }
    .totals { margin-left: auto; width: 260px; }
    .totals tr td { padding: 4px 8px; font-size: 12px; }
    .totals tr td:last-child { text-align: right; font-weight: 600; }
    .totals .grand td { font-size: 14px; font-weight: 700; color: ${brand.branding.primary}; border-top: 2px solid ${brand.branding.primary}; padding-top: 8px; }
    .pay-row { display: flex; justify-content: space-between; margin-top: 20px; padding: 12px 16px; background: ${brand.branding.background}; border-radius: 8px; font-size: 12px; }
    .disclaimer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #E8E4D9; font-size: 10px; color: #73786F; text-align: center; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-name">${escapeHtml(brand.name)}</div>
      <div class="brand-tag">${escapeHtml(brand.tagline)}</div>
      ${brand.email ? `<div style="margin-top:6px;font-size:11px;color:#73786F">${escapeHtml(brand.email)}</div>` : ''}
      ${brand.phone ? `<div style="font-size:11px;color:#73786F">${escapeHtml(brand.phone)}</div>` : ''}
      ${brand.address ? `<div style="font-size:11px;color:#73786F">${escapeHtml(brand.address)}</div>` : ''}
    </div>
    <div>
      <div class="inv-title">INVOICE</div>
      <div class="inv-meta"># ${order.orderNumber}</div>
      <div class="inv-meta">Order Date: ${fmtDate(order.createdAt)}</div>
      ${deliveredEntry ? `<div class="inv-meta">Delivered: ${fmtDateTime(deliveredEntry.timestamp)}</div>` : ''}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h4>Bill To</h4>
      <p><strong>${addr.fullName}</strong></p>
      <p>${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}</p>
      <p>${addr.city}, ${addr.state} — ${addr.pincode}</p>
      <p>📞 ${addr.phone}</p>
    </div>
    <div class="info-box">
      <h4>Payment</h4>
      <p>Method: ${order.paymentMethod}</p>
      <p>Status: ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</p>
      ${order.couponCode ? `<p>Coupon: ${order.couponCode}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:35%">Product</th>
        <th style="text-align:center;width:12%">Pack Size</th>
        <th style="text-align:center;width:18%">SKU</th>
        <th style="text-align:center;width:8%">Qty</th>
        <th style="text-align:right;width:12%">Unit Price</th>
        <th style="text-align:right;width:15%">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td>${formatINR(order.subtotal)}</td></tr>
    ${order.discount > 0 ? `<tr><td>Discount</td><td>−${formatINR(order.discount)}</td></tr>` : ''}
    <tr><td>Delivery</td><td>${order.shippingCharge === 0 ? 'Free' : formatINR(order.shippingCharge)}</td></tr>
    <tr><td>Tax (GST)</td><td>${formatINR(order.tax)}</td></tr>
    <tr class="grand"><td>Grand Total</td><td>${formatINR(order.total)}</td></tr>
  </table>

  <div class="pay-row">
    <span><strong>Payment Method:</strong> ${order.paymentMethod}</span>
    <span><strong>Status:</strong> ${order.paymentStatus}</span>
  </div>

  <div class="disclaimer">
    This is a computer-generated invoice. No signature required. •
    Demo document — not a real commercial invoice. •
    ${escapeHtml(brand.name)}${brand.address ? `, ${escapeHtml(brand.address)}` : ''}.
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── Admin Shipping Sticker (browser print) ───────────────────────────────────

/**
 * Opens a printable shipping label/sticker in a new window.
 * Designed for 4×6 inch thermal label printing.
 * Includes QR code linking to the customer's order tracking page.
 * Does NOT change order status, stock, or payment.
 */
export function printShippingLabel(order: Order): void {
  const brand = getPrintBrand();
  const addr = order.shippingAddress;
  const itemLines = order.items.map((item) =>
    `<div class="item-row"><span class="item-name">${item.name} (${item.variantLabel})</span><span class="item-qty">×${item.quantity}</span></div>`
  ).join('');

  // QR code encodes ONLY the tracking URL — no personal info
  // Using qrserver.com API (stable, no dependency needed)
  const trackUrl = `${window.location.origin}/track-order/${order.id}`;
  const qrUrl    = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=2&data=${encodeURIComponent(trackUrl)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Shipping Label — ${order.orderNumber}</title>
  <style>
    @page { size: 4in 6in; margin: 4mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      width: 100%;
    }
    .label { border: 2px solid #000; border-radius: 4px; padding: 8px; height: calc(6in - 16mm); display: flex; flex-direction: column; gap: 6px; }
    .brand { font-size: 15px; font-weight: 900; border-bottom: 2px solid #000; padding-bottom: 5px; text-transform: uppercase; letter-spacing: .05em; }
    .section-label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #333; margin-bottom: 2px; }
    .order-num { font-size: 18px; font-weight: 900; font-family: 'Courier New', monospace; background: #000; color: #fff; padding: 4px 8px; display: inline-block; border-radius: 2px; }
    .to-box { border: 1.5px solid #000; border-radius: 3px; padding: 6px; }
    .to-name { font-size: 14px; font-weight: 700; }
    .to-addr { font-size: 11px; line-height: 1.55; margin-top: 2px; }
    .from-box { font-size: 10px; line-height: 1.5; }
    .items-box { border: 1px solid #666; border-radius: 3px; padding: 4px 6px; font-size: 10px; flex: 1; overflow: hidden; }
    .item-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 2px 0; }
    .item-name { flex: 1; }
    .item-qty { font-weight: 700; }
    .footer-row { display: flex; justify-content: space-between; font-size: 10px; border-top: 1px solid #000; padding-top: 4px; }
    .cod-badge { font-size: 11px; font-weight: 900; border: 2px solid #000; padding: 2px 6px; border-radius: 3px; }
    .disclaimer { font-size: 8px; color: #666; text-align: center; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="brand">${escapeHtml(brand.name)}</div>

    <div>
      <div class="section-label">Order Number</div>
      <span class="order-num">${order.orderNumber}</span>
    </div>

    <div class="to-box">
      <div class="section-label">Deliver To</div>
      <div class="to-name">${addr.fullName}</div>
      <div class="to-addr">
        ${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}<br/>
        ${addr.city}, ${addr.state} — ${addr.pincode}<br/>
        📞 ${addr.phone}
      </div>
    </div>

    <div class="from-box">
      <strong>From:</strong> ${escapeHtml(brand.name)}${brand.address ? `, ${escapeHtml(brand.address)}` : ''}${brand.phone ? ` · ${escapeHtml(brand.phone)}` : ''}
    </div>

    <div class="items-box">
      <div class="section-label">Items</div>
      ${itemLines}
      <div style="margin-top:3px;font-size:9px;color:#444">
        Total items: ${order.items.reduce((s, i) => s + i.quantity, 0)}
      </div>
    </div>

    <div class="footer-row">
      <div>
        <div class="section-label">Payment</div>
        <span class="cod-badge">${order.paymentMethod === 'Cash on Delivery' ? 'COD' : order.paymentMethod}</span>
        <span style="margin-left:4px">${order.paymentStatus === 'paid' ? '✓ PAID' : 'COLLECT ON DELIVERY'}</span>
      </div>
      <div style="text-align:right">
        <div class="section-label">Order Total</div>
        <strong style="font-size:13px">₹${order.total.toLocaleString('en-IN')}</strong>
      </div>
    </div>

    ${order.trackingNumber ? `<div style="font-size:10px"><strong>Tracking:</strong> ${order.trackingNumber}</div>` : ''}

    <div style="display:flex;align-items:center;gap:8px;margin-top:4px;border:1px solid #000;border-radius:3px;padding:6px">
      <img src="${qrUrl}" alt="Track Order QR" width="80" height="80"
           onerror="this.style.display='none'"
           style="border:1px solid #000" />
      <div>
        <div class="section-label">Scan to Track Order</div>
        <div style="font-size:9px;color:#444">Scan with your phone camera to open the order tracking page.</div>
      </div>
    </div>

    <div class="disclaimer">
      Printing this label does not change order status or stock. Demo document only.
    </div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
