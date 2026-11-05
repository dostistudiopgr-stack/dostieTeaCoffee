import { useState } from 'react';
import {
  ShoppingCart, Search, Mail, ArrowRight, Trash2,
  PackageSearch, Star, Heart,
} from 'lucide-react';

import Button           from '../components/common/Button';
import Input            from '../components/common/Input';
import Select           from '../components/common/Select';
import Textarea         from '../components/common/Textarea';
import Modal            from '../components/common/Modal';
import SectionTitle     from '../components/common/SectionTitle';
import Badge            from '../components/common/Badge';
import EmptyState       from '../components/common/EmptyState';
import ConfirmDialog    from '../components/common/ConfirmDialog';
import PriceDisplay     from '../components/common/PriceDisplay';
import ProductRating    from '../components/common/ProductRating';
import Pagination       from '../components/common/Pagination';
import { Spinner, Skeleton, SkeletonCard } from '../components/common/Loader';

// ─── Section wrapper ──────────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-14">
    <h2
      className="text-xl font-semibold text-[#292D28] mb-6 pb-3
                 border-b border-[#E8E4D9]"
      style={{ fontFamily: 'var(--font-heading)' }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const Row = ({ children, wrap = true }: { children: React.ReactNode; wrap?: boolean }) => (
  <div className={`flex ${wrap ? 'flex-wrap' : ''} items-center gap-3`}>{children}</div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ComponentPreview = () => {
  // Modal
  const [modalOpen,   setModalOpen]   = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDangerOpen, setConfirmDangerOpen] = useState(false);

  // Form state
  const [inputVal,    setInputVal]    = useState('');
  const [passwordVal, setPasswordVal] = useState('');
  const [textareaVal, setTextareaVal] = useState('');
  const [selectVal,   setSelectVal]   = useState('');

  // Pagination
  const [page, setPage] = useState(1);

  // Button loading demo
  const [loadingBtn, setLoadingBtn] = useState(false);
  const handleLoadingBtn = () => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  return (
    <div
      className="min-h-screen bg-[var(--brand-background)] py-12"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="container max-w-4xl mx-auto px-6">
        {/* Page heading */}
        <div className="mb-12 text-center">
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-accent)]">
            Internal
          </span>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-[#292D28] mt-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Component Library
          </h1>
          <p className="text-[#73786F] mt-2 text-sm">
            Dosti Tea &amp; Coffee — reusable UI components preview
          </p>
        </div>

        {/* ── 1. Buttons ──────────────────────────────────────── */}
        <Section title="Button">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#73786F] mb-2 uppercase tracking-wide">Variants</p>
              <Row>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="gold">Gold</Button>
              </Row>
            </div>

            <div>
              <p className="text-xs font-medium text-[#73786F] mb-2 uppercase tracking-wide">Sizes</p>
              <Row>
                <Button size="small">Small</Button>
                <Button size="medium">Medium</Button>
                <Button size="large">Large</Button>
              </Row>
            </div>

            <div>
              <p className="text-xs font-medium text-[#73786F] mb-2 uppercase tracking-wide">States &amp; Icons</p>
              <Row>
                <Button leftIcon={<ShoppingCart size={16} />}>Add to Cart</Button>
                <Button rightIcon={<ArrowRight size={16} />} variant="outline">Shop Now</Button>
                <Button loading={loadingBtn} onClick={handleLoadingBtn}>
                  {loadingBtn ? 'Adding…' : 'Click to Load'}
                </Button>
                <Button disabled>Disabled</Button>
              </Row>
            </div>

            <div>
              <p className="text-xs font-medium text-[#73786F] mb-2 uppercase tracking-wide">Full Width</p>
              <Button fullWidth leftIcon={<Heart size={16} />}>Full-Width Button</Button>
            </div>
          </div>
        </Section>

        {/* ── 2. Inputs ───────────────────────────────────────── */}
        <Section title="Input">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={16} />}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              helperText="We never share your email."
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter password"
              value={passwordVal}
              onChange={(e) => setPasswordVal(e.target.value)}
              required
            />
            <Input
              label="Search"
              type="search"
              placeholder="Search teas…"
              leftIcon={<Search size={16} />}
            />
            <Input
              label="Error State"
              type="email"
              placeholder="bad@email"
              error="Please enter a valid email address."
              defaultValue="notanemail"
            />
            <Input
              label="Disabled"
              type="text"
              placeholder="Cannot edit"
              disabled
              defaultValue="Disabled value"
            />
          </div>
        </Section>

        {/* ── 3. Select ───────────────────────────────────────── */}
        <Section title="Select">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select
              label="Category"
              placeholder="Select a category"
              value={selectVal}
              onChange={(e) => setSelectVal(e.target.value)}
              options={[
                { value: 'tea',        label: 'Black Tea' },
                { value: 'coffee',     label: 'Coffee' },
                { value: 'green-tea',  label: 'Green Tea' },
                { value: 'herbal-tea', label: 'Herbal Tea' },
              ]}
              required
              helperText="Choose a product category."
            />
            <Select
              label="Error State"
              options={[{ value: 'a', label: 'Option A' }]}
              error="Please select an option."
            />
            <Select
              label="Disabled"
              options={[{ value: 'x', label: 'Disabled option' }]}
              disabled
            />
          </div>
        </Section>

        {/* ── 4. Textarea ─────────────────────────────────────── */}
        <Section title="Textarea">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Textarea
              label="Message"
              placeholder="Write your message…"
              rows={4}
              maxLength={200}
              value={textareaVal}
              onChange={(e) => setTextareaVal(e.target.value)}
              helperText="Max 200 characters."
              required
            />
            <Textarea
              label="Error State"
              placeholder="This field has an error"
              error="This field is required."
            />
            <Textarea
              label="Disabled"
              placeholder="Cannot edit"
              disabled
              defaultValue="This textarea is disabled."
            />
          </div>
        </Section>

        {/* ── 5. Modal ────────────────────────────────────────── */}
        <Section title="Modal">
          <Row>
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          </Row>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Order Confirmed"
            description="Your order has been placed successfully."
            footer={
              <>
                <Button variant="outline" size="small" onClick={() => setModalOpen(false)}>
                  Close
                </Button>
                <Button size="small" onClick={() => setModalOpen(false)}>
                  View Orders
                </Button>
              </>
            }
          >
            <p className="text-sm text-[#73786F]">
              Thank you for shopping with Dosti Tea &amp; Coffee. You will receive a
              confirmation email shortly with your order details and tracking information.
            </p>
          </Modal>
        </Section>

        {/* ── 6. ConfirmDialog ────────────────────────────────── */}
        <Section title="ConfirmDialog">
          <Row>
            <Button variant="outline" onClick={() => setConfirmOpen(true)}>
              Default Confirm
            </Button>
            <Button variant="danger" leftIcon={<Trash2 size={16} />} onClick={() => setConfirmDangerOpen(true)}>
              Danger Confirm
            </Button>
          </Row>
          <ConfirmDialog
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => setConfirmOpen(false)}
            title="Apply Coupon?"
            description="This will apply the coupon DOSTI10 to your order, giving you 10% off."
            confirmLabel="Yes, Apply"
          />
          <ConfirmDialog
            isOpen={confirmDangerOpen}
            onClose={() => setConfirmDangerOpen(false)}
            onConfirm={() => setConfirmDangerOpen(false)}
            title="Remove Item?"
            description="Are you sure you want to remove Darjeeling First Flush from your cart? This cannot be undone."
            confirmLabel="Remove"
            variant="danger"
          />
        </Section>

        {/* ── 7. Badge ────────────────────────────────────────── */}
        <Section title="Badge">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#73786F] mb-2 uppercase tracking-wide">Variants</p>
              <Row>
                <Badge variant="success">Delivered</Badge>
                <Badge variant="warning">Processing</Badge>
                <Badge variant="danger">Cancelled</Badge>
                <Badge variant="info">Shipped</Badge>
                <Badge variant="neutral">Pending</Badge>
                <Badge variant="brand">Bestseller</Badge>
              </Row>
            </div>
            <div>
              <p className="text-xs font-medium text-[#73786F] mb-2 uppercase tracking-wide">With Dot</p>
              <Row>
                <Badge variant="success" dot>In Stock</Badge>
                <Badge variant="danger" dot>Out of Stock</Badge>
                <Badge variant="warning" dot>Low Stock</Badge>
                <Badge variant="brand" dot>New</Badge>
              </Row>
            </div>
            <div>
              <p className="text-xs font-medium text-[#73786F] mb-2 uppercase tracking-wide">Sizes</p>
              <Row>
                <Badge size="small">Small Badge</Badge>
                <Badge size="medium">Medium Badge</Badge>
              </Row>
            </div>
          </div>
        </Section>

        {/* ── 8. SectionTitle ─────────────────────────────────── */}
        <Section title="SectionTitle">
          <div className="space-y-10">
            <SectionTitle
              eyebrow="Our Collection"
              title="Featured Products"
              subtitle="Hand-picked teas and coffees from India's finest estates."
              alignment="center"
            />
            <SectionTitle
              eyebrow="New Arrivals"
              title="Just In"
              subtitle="Fresh additions to our premium catalogue."
              alignment="left"
              action={
                <Button variant="outline" size="small" rightIcon={<ArrowRight size={14} />}>
                  View All
                </Button>
              }
            />
          </div>
        </Section>

        {/* ── 9. PriceDisplay ─────────────────────────────────── */}
        <Section title="PriceDisplay">
          <Row>
            <div className="p-4 bg-white rounded-xl border border-[#E8E4D9] space-y-1">
              <p className="text-xs text-[#73786F] mb-2">Small</p>
              <PriceDisplay price={549} compareAtPrice={649} size="small" />
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E8E4D9] space-y-1">
              <p className="text-xs text-[#73786F] mb-2">Medium (default)</p>
              <PriceDisplay price={1199} compareAtPrice={1399} size="medium" />
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E8E4D9] space-y-1">
              <p className="text-xs text-[#73786F] mb-2">Large</p>
              <PriceDisplay price={2199} size="large" />
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E8E4D9] space-y-1">
              <p className="text-xs text-[#73786F] mb-2">Inline</p>
              <PriceDisplay price={699} compareAtPrice={799} inline />
            </div>
          </Row>
        </Section>

        {/* ── 10. ProductRating ───────────────────────────────── */}
        <Section title="ProductRating">
          <div className="space-y-3">
            {[
              { rating: 4.9, count: 128, size: 'small'  as const },
              { rating: 4.5, count: 214, size: 'medium' as const },
              { rating: 3.7, count: 56,  size: 'large'  as const },
              { rating: 4.0, count: 89,  size: 'medium' as const, showValue: true },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <ProductRating {...r} />
                <span className="text-xs text-[#73786F]">
                  {r.rating} stars, {r.size} size
                  {r.showValue ? ', showValue' : ''}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── 11. EmptyState ──────────────────────────────────── */}
        <Section title="EmptyState">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#E8E4D9]">
              <EmptyState
                title="Your cart is empty"
                description="Add some products to get started."
                action={
                  <Button size="small" leftIcon={<ShoppingCart size={14} />}>
                    Shop Now
                  </Button>
                }
              />
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4D9]">
              <EmptyState
                icon={<Star size={32} strokeWidth={1.5} />}
                title="No reviews yet"
                description="Be the first to review this product."
              />
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4D9]">
              <EmptyState
                icon={<Search size={32} strokeWidth={1.5} />}
                title="No results found"
                description="Try adjusting your search or filters."
              />
            </div>
            <div className="bg-white rounded-xl border border-[#E8E4D9]">
              <EmptyState
                icon={<PackageSearch size={32} strokeWidth={1.5} />}
                title="No orders yet"
                description="Your order history will appear here."
              />
            </div>
          </div>
        </Section>

        {/* ── 12. Loader / Skeleton ───────────────────────────── */}
        <Section title="Loader &amp; Skeleton">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-[#73786F] mb-3 uppercase tracking-wide">Spinner sizes</p>
              <Row>
                {(['xs','sm','md','lg','xl'] as const).map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <Spinner size={s} />
                    <span className="text-[10px] text-[#73786F]">{s}</span>
                  </div>
                ))}
              </Row>
            </div>
            <div>
              <p className="text-xs font-medium text-[#73786F] mb-3 uppercase tracking-wide">Skeleton lines</p>
              <div className="space-y-2 max-w-sm">
                <Skeleton height="h-4" width="w-3/4" />
                <Skeleton height="h-4" />
                <Skeleton height="h-4" width="w-1/2" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#73786F] mb-3 uppercase tracking-wide">Skeleton cards</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          </div>
        </Section>

        {/* ── 13. Pagination ──────────────────────────────────── */}
        <Section title="Pagination">
          <div className="space-y-4">
            <Pagination currentPage={page} totalPages={12} onPageChange={setPage} />
            <p className="text-sm text-[#73786F]">Current page: {page} / 12</p>
            <Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />
            <Pagination currentPage={3} totalPages={3} onPageChange={() => {}} />
          </div>
        </Section>
      </div>
    </div>
  );
};

export default ComponentPreview;
