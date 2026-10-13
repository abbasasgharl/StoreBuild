import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../../components/PublicHeader.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { GENERATED_ASSETS } from '../../constants/assets.ts';
import { ArrowRight, Check, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const [sellerPrice, setSellerPrice] = useState<number>(1000);
  const [slugPreview, setSlugPreview] = useState<string>('velora');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const platformFee = Math.round(sellerPrice * 0.1);
  const customerPayable = sellerPrice + platformFee;

  const faqs = [
    {
      q: 'Who owns the inventory and handles shipping or returns?',
      a: 'You do. The platform never holds inventory or interferes with your product craft. You pack and ship orders using your preferred courier, record tracking details in the dashboard, and approve returns according to your store policy.',
    },
    {
      q: 'How does the 10% platform fee work?',
      a: 'When you set a seller price of ₹1,000, the server automatically calculates a 10% platform fee (₹100) so the customer pays ₹1,100. Your full ₹1,000 seller entitlement is credited to your append-only wallet ledger upon gateway webhook verification.',
    },
    {
      q: 'How does the WhatsApp order and payment flow protect sellers?',
      a: 'Customers browse your branded storefront and click "Order on WhatsApp". The message contains your store name, product SKU, and a unique order reference. Once you confirm availability, the customer pays via a platform payment link verified strictly by server-side gateway webhooks.',
    },
    {
      q: 'When and how do I receive my payouts?',
      a: 'Eligible available wallet balances—after accounting for active fulfilment holds or open return requests—are settled weekly directly to your verified UPI ID or bank account (NEFT/IMPS).',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col">
      <PublicHeader />

      {/* 1. Hero Section */}
      <section className="max-w-[1240px] mx-auto w-full px-6 pt-14 pb-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-medium text-[#6B7280] tracking-wide">
              Multi-Tenant Branded Commerce Platform · Direct WhatsApp Conversion · Weekly Payouts
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#111827] leading-[1.08] text-balance">
              Your Products. Your Brand. Your Online Store.
            </h1>

            <p className="text-base sm:text-lg text-[#6B7280] max-w-2xl leading-relaxed">
              Launch your own online store without worrying about technology. Add your products,
              customize your brand, share your store and start selling.
            </p>

            {/* Interactive URL preview bar */}
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl shadow-xs">
              <div className="flex items-center px-3 py-2 bg-[#F8FAFC] rounded-[8px] border border-[#E5E7EB] flex-1">
                <span className="font-mono text-xs sm:text-sm text-[#6B7280] select-none">
                  platform.com/
                </span>
                <input
                  type="text"
                  value={slugPreview}
                  onChange={(e) =>
                    setSlugPreview(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder="yourbrand"
                  className="font-mono text-xs sm:text-sm font-semibold text-[#111827] bg-transparent focus:outline-none w-full"
                  aria-label="Preview your store slug"
                />
              </div>
              <Link
                to={`/create-store?slug=${encodeURIComponent(slugPreview || 'mybrand')}`}
                className="px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[8px] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                Create Your Store
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#how-it-works"
                className="px-5 py-3 bg-white border border-[#E5E7EB] hover:border-[#111827] text-[#111827] text-sm font-semibold rounded-[12px] transition-colors whitespace-nowrap"
              >
                See How It Works
              </a>
              <Link
                to="/velora"
                className="px-5 py-3 text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1.5 whitespace-nowrap"
              >
                Explore Live Storefront (/velora)
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Editorial Storefront Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E5E7EB] rounded-[18px] overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8FAFC]">
                <span className="font-mono text-xs text-[#111827] font-medium">
                  platform.com/velora
                </span>
                <span className="text-xs text-[#6B7280]">Luxury Theme Preset · Published</span>
              </div>
              <div className="aspect-[16/10] overflow-hidden bg-[#F1F5F9]">
                <SafeImage
                  src={GENERATED_ASSETS.heroStudio}
                  alt="Velora Atelier Branded Storefront"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#111827]">
                      Velora Atelier
                    </h2>
                    <p className="text-xs text-[#6B7280]">
                      Handcrafted Textiles, Sculptural Brass & Botanical Objects
                    </p>
                  </div>
                  <Link
                    to="/velora"
                    className="text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap shrink-0"
                  >
                    Visit Store →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link
                    to="/velora/product/raw-mulberry-silk-wrap-dress"
                    className="group border border-[#E5E7EB] rounded-[12px] p-2.5 hover:border-[#2563EB] transition-colors"
                  >
                    <div className="aspect-[4/3] rounded-[8px] overflow-hidden mb-2 bg-[#F8FAFC]">
                      <SafeImage
                        src={GENERATED_ASSETS.silkDress}
                        alt="Raw Mulberry Silk Wrap Dress"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="text-xs font-semibold text-[#111827] truncate">
                      Raw Silk Wrap Dress
                    </div>
                    <div className="font-mono text-xs text-[#6B7280] mt-0.5">₹4,950</div>
                  </Link>

                  <Link
                    to="/velora/product/alabaster-brushed-brass-lamp"
                    className="group border border-[#E5E7EB] rounded-[12px] p-2.5 hover:border-[#2563EB] transition-colors"
                  >
                    <div className="aspect-[4/3] rounded-[8px] overflow-hidden mb-2 bg-[#F8FAFC]">
                      <SafeImage
                        src={GENERATED_ASSETS.brassLamp}
                        alt="Alabaster & Brushed Brass Table Lamp"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="text-xs font-semibold text-[#111827] truncate">
                      Alabaster Brass Lamp
                    </div>
                    <div className="font-mono text-xs text-[#6B7280] mt-0.5">₹7,480</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works — Customer + WhatsApp Journey */}
      <section id="how-it-works" className="bg-white border-y border-[#E5E7EB] py-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-semibold text-[#2563EB] mb-2">
              Customer & WhatsApp Commerce Flow
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827] text-balance">
              Built for social and WhatsApp traffic, backed by server-verified payments.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-[#E5E7EB] rounded-[12px] p-7 bg-[#F8FAFC]">
              <div className="font-mono text-xs font-semibold text-[#2563EB] mb-3">
                01. Branded Storefront Discovery
              </div>
              <h3 className="font-display text-xl font-bold text-[#111827] mb-3">
                Customers browse your own brand URL
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Every entrepreneur gets a dedicated storefront at{' '}
                <span className="font-mono text-[#111827]">platform.com/&#123;storeSlug&#125;</span>{' '}
                with controlled luxury, minimal, or boutique theme presets, product galleries,
                variants, and transparent shipping & return policies.
              </p>
            </div>

            <div className="border border-[#E5E7EB] rounded-[12px] p-7 bg-[#F8FAFC]">
              <div className="font-mono text-xs font-semibold text-[#2563EB] mb-3">
                02. Contextual WhatsApp Enquiry
              </div>
              <h3 className="font-display text-xl font-bold text-[#111827] mb-3">
                One-tap Order on WhatsApp with reference ID
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Shoppers click <strong>Order on WhatsApp</strong>. The message automatically carries
                your store name, product title, SKU, variant, and a unique order reference (e.g.{' '}
                <span className="font-mono text-[#111827]">ORD-84925</span>). You confirm stock and
                share the platform payment link.
              </p>
            </div>

            <div className="border border-[#E5E7EB] rounded-[12px] p-7 bg-[#F8FAFC]">
              <div className="font-mono text-xs font-semibold text-[#2563EB] mb-3">
                03. Gateway Webhook & Weekly Payout
              </div>
              <h3 className="font-display text-xl font-bold text-[#111827] mb-3">
                Immutable wallet ledger & weekly settlement
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Payments are verified strictly server-side via gateway webhooks. Your 100% seller
                price entitlement enters the append-only wallet ledger, protected through fulfilment
                and paid out weekly to your verified UPI or bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Commercial Model & Interactive 10% Fee Explanation */}
      <section className="max-w-[1240px] mx-auto w-full px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div className="text-xs font-semibold text-[#2563EB]">
              Transparent Commercial Model
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827] text-balance">
              You keep 100% of your seller price. The 10% platform fee is added transparently.
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
              We never deduct surprise commissions from your asking price or rely on manual
              self-reporting. When you set your seller price, the platform automatically adds a 10%
              platform fee to compute the customer payable amount.
            </p>

            <div className="space-y-3 pt-2 text-sm text-[#111827]">
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#16A34A] mt-1 shrink-0" />
                <span>
                  <strong>Server-Authoritative Pricing:</strong> Client-side prices can never be
                  manipulated; every order snapshots exact seller price and platform fee at purchase.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#16A34A] mt-1 shrink-0" />
                <span>
                  <strong>Append-Only Wallet Ledger:</strong> Every credit, fulfilment release,
                  return hold, and weekly payout is recorded as an immutable ledger transaction.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-4 h-4 text-[#16A34A] mt-1 shrink-0" />
                <span>
                  <strong>Return Exposure Protection:</strong> Funds remain in Pending or Held status
                  during active return windows so refunds and exchanges reconcile cleanly.
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#111827]">
                    Interactive Order & Wallet Split Calculator
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Adjust seller product price to inspect server-calculated customer price
                  </p>
                </div>
                <span className="font-mono text-xs text-[#16A34A] font-medium">
                  +10% Platform Fee
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <label htmlFor="seller-price-range" className="font-medium text-[#111827]">
                    Your Seller Product Price
                  </label>
                  <span className="font-mono font-bold text-[#111827]">
                    ₹{sellerPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  id="seller-price-range"
                  type="range"
                  min={500}
                  max={20000}
                  step={500}
                  value={sellerPrice}
                  onChange={(e) => setSellerPrice(Number(e.target.value))}
                  className="w-full accent-[#2563EB] cursor-pointer"
                />
                <div className="flex gap-2 pt-1">
                  {[1000, 2500, 4500, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSellerPrice(preset)}
                      className={`px-3 py-1.5 text-xs font-mono rounded-[8px] border transition-colors ${
                        sellerPrice === preset
                          ? 'bg-[#111827] text-white border-[#111827]'
                          : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB] hover:text-[#111827]'
                      }`}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Seller Product Amount (Your Entitlement)</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    ₹{sellerPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Platform Fee (10% added on top)</span>
                  <span className="font-mono font-semibold text-[#2563EB]">
                    + ₹{platformFee.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-[#E5E7EB] pt-3 flex justify-between items-baseline">
                  <span className="font-semibold text-[#111827]">Customer Payable Amount</span>
                  <span className="font-mono text-xl font-bold text-[#111827]">
                    ₹{customerPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1">
                <span>Credited to Seller Wallet Ledger:</span>
                <span className="font-mono font-semibold text-[#16A34A]">
                  ₹{sellerPrice.toLocaleString('en-IN')} (Paid weekly to verified UPI / Bank)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Storefront Examples & Surface Directory */}
      <section className="bg-white border-y border-[#E5E7EB] py-20">
        <div className="max-w-[1240px] mx-auto px-6 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-[#2563EB] mb-2">
                Live Multi-Tenant Storefronts & Operations
              </div>
              <h2 className="font-display text-3xl font-bold text-[#111827]">
                Every store feels like its own independent brand.
              </h2>
            </div>
            <Link
              to="/create-store"
              className="px-5 py-3 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-semibold rounded-[12px] transition-colors whitespace-nowrap self-start"
            >
              Launch Your Own Storefront →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between bg-[#F8FAFC]">
              <div className="space-y-3">
                <div className="font-mono text-xs text-[#2563EB]">platform.com/velora</div>
                <h3 className="font-display text-xl font-bold text-[#111827]">
                  Velora Atelier (Luxury Preset)
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Handwoven mulberry silk apparel, sculptural brass lighting, saddle leather totes,
                  and botanical oils with full WhatsApp order & checkout flow.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#E5E7EB] flex items-center justify-between">
                <Link
                  to="/velora"
                  className="text-sm font-semibold text-[#2563EB] hover:underline"
                >
                  Open Storefront →
                </Link>
                <Link
                  to="/checkout/ORD-84952"
                  className="text-xs font-mono text-[#6B7280] hover:text-[#111827]"
                >
                  Inspect Payment Link
                </Link>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between bg-[#F8FAFC]">
              <div className="space-y-3">
                <div className="font-mono text-xs text-[#2563EB]">platform.com/arastudio</div>
                <h3 className="font-display text-xl font-bold text-[#111827]">
                  Ara Studio Ceramics (Boutique Preset)
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Independent Goa-based stoneware and table linen studio demonstrating tenant
                  isolation and custom boutique typography & card styling.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#E5E7EB] flex items-center justify-between">
                <Link
                  to="/arastudio"
                  className="text-sm font-semibold text-[#2563EB] hover:underline"
                >
                  Open Storefront →
                </Link>
                <span className="text-xs text-[#6B7280]">Tenant #2</span>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col justify-between bg-[#F8FAFC]">
              <div className="space-y-3">
                <div className="font-mono text-xs text-[#16A34A]">Seller & Admin Consoles</div>
                <h3 className="font-display text-xl font-bold text-[#111827]">
                  End-to-End SaaS Operations
                </h3>
                <p className="text-sm text-[#6B7280]">
                  Inspect the Seller Dashboard (Products, Orders, Immutable Wallet Ledger, Weekly
                  Payouts, Live Theme Builder) or the RBAC Admin Console.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-[#E5E7EB] flex items-center justify-between">
                <Link
                  to="/app/dashboard"
                  className="text-sm font-semibold text-[#111827] hover:underline"
                >
                  Seller Dashboard →
                </Link>
                <Link
                  to="/admin"
                  className="text-sm font-semibold text-[#2563EB] hover:underline"
                >
                  Admin Console →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Security & Financial Integrity */}
      <section className="max-w-[1240px] mx-auto w-full px-6 py-20">
        <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-8 lg:p-12">
          <div className="max-w-2xl mb-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A] mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Enterprise-Grade Commerce & Ledger Security</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              Engineered for strict tenant isolation and financial reconciliation.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-[#111827]">Webhook Signature Authority</h3>
              <p className="text-[#6B7280]">
                Browser-side payment status is never trusted. Orders transition to Paid only after
                idempotent server-side gateway webhook verification.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#111827]">Immutable Append-Only Wallet</h3>
              <p className="text-[#6B7280]">
                Arbitrary balance edits are prohibited. Every credit, hold, refund, and weekly payout
                writes a permanent ledger entry with running balance.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#111827]">Payout Change Security Hold</h3>
              <p className="text-[#6B7280]">
                Modifying UPI or Bank/IFSC destination triggers automatic verification status and a
                temporary payout hold with full audit logging.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[#111827]">Strict Tenant Scoping</h3>
              <p className="text-[#6B7280]">
                Every seller API query is scoped from the authenticated server context so one seller
                can never access or mutate another store’s records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="max-w-[900px] mx-auto w-full px-6 pb-20">
        <h2 className="font-display text-3xl font-bold text-[#111827] text-center mb-10">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-[#111827] hover:bg-[#F8FAFC] transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#6B7280] transition-transform shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-[#6B7280] leading-relaxed border-t border-[#E5E7EB] pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Final CTA & Quiet Footer */}
      <section className="bg-[#111827] text-white py-16 px-6 mt-auto">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-display text-3xl font-bold">
              Ready to claim your branded storefront?
            </h2>
            <p className="text-sm text-gray-300">
              Complete setup payment, verify your email OTP, and publish your store in minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/create-store"
              className="px-6 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[12px] transition-colors whitespace-nowrap"
            >
              Create Your Store
            </Link>
            <Link
              to="/pricing"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-[12px] transition-colors whitespace-nowrap"
            >
              View Setup Plans & Pricing
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-[#E5E7EB] py-8 px-6 text-xs text-[#6B7280]">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-display font-bold text-[#111827]">Velora Commerce Platform</div>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/pricing" className="hover:text-[#111827]">
              Pricing
            </Link>
            <Link to="/create-store" className="hover:text-[#111827]">
              Seller Onboarding
            </Link>
            <Link to="/velora" className="hover:text-[#111827]">
              Velora Demo Store
            </Link>
            <Link to="/app/dashboard" className="hover:text-[#111827]">
              Seller Dashboard
            </Link>
            <Link to="/admin" className="hover:text-[#111827]">
              Admin Console
            </Link>
          </div>
          <div>© 2026 Entrepreneur Store Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
