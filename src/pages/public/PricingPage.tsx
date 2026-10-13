import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../../components/PublicHeader.tsx';
import { Check, ArrowRight } from 'lucide-react';

export default function PricingPage() {
  const [samplePrice, setSamplePrice] = useState(2000);
  const fee = Math.round(samplePrice * 0.1);
  const customerTotal = samplePrice + fee;

  const plans = [
    {
      id: 'Starter Setup',
      name: 'Starter Setup',
      audience: 'For solo makers & home entrepreneurs launching their first catalogue',
      setupFee: 999,
      cadence: 'One-time setup & verification fee',
      features: [
        'Branded URL at platform.com/{storeSlug}',
        'Up to 50 published products with size/colour variants',
        '3 controlled theme presets (Classic, Minimal, Modern)',
        'Direct WhatsApp order reference generator',
        '10% customer-paid platform fee (100% seller price entitlement)',
        'Weekly UPI & Bank NEFT payout settlements',
      ],
    },
    {
      id: 'Growth Annual',
      name: 'Growth Annual',
      audience: 'For established independent brands scaling via Instagram & WhatsApp',
      setupFee: 1999,
      cadence: 'One-time setup + priority onboarding',
      highlighted: true,
      features: [
        'Everything in Starter Setup + Unlimited products',
        'All 6 theme presets including Luxury, Fashion & Boutique',
        'Full return/exchange request workflow with automated wallet hold protection',
        'Append-only ledger export & reconciliation reports',
        'Priority weekly payout batch processing',
        'Dedicated WhatsApp payment link checkout page',
      ],
    },
    {
      id: 'Studio Pro',
      name: 'Studio Pro',
      audience: 'For multi-collection ateliers and high-volume D2C studios',
      setupFee: 3499,
      cadence: 'One-time setup + bespoke store review',
      features: [
        'Everything in Growth Annual',
        'Multi-warehouse shipping policy & custom courier tracking links',
        'High-value order risk & webhook verification audit trail',
        'Dedicated onboarding specialist & catalogue migration',
        'Custom return window governance per product category',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col">
      <PublicHeader />

      <main className="max-w-[1240px] mx-auto w-full px-6 py-16 space-y-20">
        <div className="max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-[#2563EB]">
            Simple Setup Fee · Transparent 10% Platform Fee
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111827] text-balance">
            Predictable pricing built for independent entrepreneurs.
          </h1>
          <p className="text-base sm:text-lg text-[#6B7280]">
            Pay a one-time onboarding setup fee to verify your store and claim your slug. When you
            sell, the customer pays your exact product price plus a 10% platform fee.
          </p>
        </div>

        {/* Setup Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-[18px] p-8 flex flex-col justify-between border ${
                plan.highlighted
                  ? 'border-[#2563EB] ring-1 ring-[#2563EB]'
                  : 'border-[#E5E7EB]'
              }`}
            >
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-medium text-[#6B7280] mb-1">{plan.audience}</div>
                  <h2 className="font-display text-2xl font-bold text-[#111827]">{plan.name}</h2>
                </div>

                <div className="pt-2 border-t border-[#E5E7EB]">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-bold text-[#111827]">
                      ₹{plan.setupFee.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-[#6B7280]">{plan.cadence}</span>
                  </div>
                  <div className="text-xs text-[#16A34A] font-medium mt-1">
                    0% deduction from your seller price · Customer pays +10% platform fee
                  </div>
                </div>

                <ul className="space-y-3 pt-4 text-sm text-[#111827]">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#2563EB] mt-1 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8 mt-8 border-t border-[#E5E7EB]">
                <Link
                  to={`/create-store?plan=${encodeURIComponent(plan.id)}`}
                  className={`w-full py-3 px-4 rounded-[12px] text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                    plan.highlighted
                      ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                      : 'bg-[#111827] hover:bg-[#1F2937] text-white'
                  }`}
                >
                  Select {plan.name}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed 10% Commercial Model Breakdown */}
        <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              How the 10% Platform Fee & Weekly Payouts Work
            </h2>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Unlike marketplaces that deduct 20–35% from your margin, our commercial engine adds a
              transparent 10% platform fee to compute the customer price. Because all payments are
              collected via platform payment links and verified by server-side gateway webhooks,
              every transaction reconciles automatically.
            </p>
            <div className="space-y-2 text-sm pt-2">
              <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB]">
                <strong>1. Payment Collection:</strong> Customer pays ₹{customerTotal.toLocaleString('en-IN')} via platform checkout link.
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB]">
                <strong>2. Wallet Entitlement:</strong> Your ₹{samplePrice.toLocaleString('en-IN')} enters Pending Balance and moves to Available upon order completion.
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB]">
                <strong>3. Weekly Settlement:</strong> Available balance (net of any active return holds) is paid every week to your verified UPI or Bank account.
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[12px] p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#111827]">
                Test Your Product Pricing
              </span>
              <span className="font-mono text-xs text-[#6B7280]">Server Formula: P × 1.10</span>
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1.5">
                Enter Seller Price (INR)
              </label>
              <input
                type="number"
                min={100}
                step={100}
                value={samplePrice}
                onChange={(e) => setSamplePrice(Math.max(100, Number(e.target.value) || 0))}
                className="w-full px-4 py-2.5 bg-white border border-[#E5E7EB] rounded-[8px] font-mono text-base font-bold text-[#111827]"
              />
            </div>
            <div className="space-y-2.5 text-sm border-t border-[#E5E7EB] pt-4">
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Seller Wallet Credit</span>
                <span className="font-mono font-semibold text-[#16A34A]">
                  ₹{samplePrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B7280]">Platform Fee (10%)</span>
                <span className="font-mono font-semibold text-[#2563EB]">
                  ₹{fee.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E5E7EB] font-bold text-base">
                <span>Storefront Customer Price</span>
                <span className="font-mono">₹{customerTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
