import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicHeader } from '../../components/PublicHeader.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { GENERATED_ASSETS, THEME_PRESETS } from '../../constants/assets.ts';
import { Check, AlertCircle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const WIZARD_STEPS = [
  'Brand',
  'Store details',
  'WhatsApp',
  'Shipping',
  'Returns',
  'Payout',
  'First product',
  'Publish',
];

export default function CreateStorePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { switchDemoPersona, authFetch } = useAuth();

  // Onboarding Phases: 'signup_and_payment' -> 'otp_verification' -> 'guided_wizard'
  const [phase, setPhase] = useState<'signup_and_payment' | 'otp_verification' | 'guided_wizard'>(
    'signup_and_payment'
  );

  // Phase 1 fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Velora@2026');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('+91 ');
  const [businessName, setBusinessName] = useState('');
  const [storeSlug, setStoreSlug] = useState(searchParams.get('slug') || '');
  const [setupPlan, setSetupPlan] = useState(searchParams.get('plan') || 'Growth Annual');
  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    reason: string;
  }>({ checking: false, available: null, reason: '' });

  // Phase 2 fields (OTP)
  const [dispatchedOtp, setDispatchedOtp] = useState('');
  const [setupPaymentRef, setSetupPaymentRef] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [createdUid, setCreatedUid] = useState('');

  // Phase 3 fields (8-step Guided Wizard)
  const [wizardStep, setWizardStep] = useState(0); // 0..7
  const [preset, setPreset] = useState('Modern');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [tagline, setTagline] = useState('Handcrafted Small-Batch Goods');
  const [about, setAbout] = useState(
    'Every piece is designed and packed directly in our independent studio.'
  );
  const [whatsappNumber, setWhatsappNumber] = useState('919820144910');
  const [flatShippingRate, setFlatShippingRate] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1500);
  const [shippingPolicy, setShippingPolicy] = useState(
    'Dispatched within 24–48 hours via insured courier with live tracking.'
  );
  const [returnWindowDays, setReturnWindowDays] = useState(7);
  const [returnPolicy, setReturnPolicy] = useState(
    '7-day return or size exchange on unused items in original packaging.'
  );
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  // First product fields
  const [prodTitle, setProdTitle] = useState('Signature Handcrafted Linen Shirt');
  const [prodSku, setProdSku] = useState('ST-LIN-001');
  const [prodCategory, setProdCategory] = useState('Apparel');
  const [prodSellerPrice, setProdSellerPrice] = useState(2000);
  const [prodStock, setProdStock] = useState(15);
  const [prodDescription, setProdDescription] = useState(
    'Breathable pure Belgian flax linen tailored for relaxed everyday wear.'
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setupFeeAmount =
    setupPlan === 'Starter Setup' ? 999 : setupPlan === 'Studio Pro' ? 3499 : 1999;

  useEffect(() => {
    if (!storeSlug || storeSlug.trim().length < 2) {
      setSlugStatus({ checking: false, available: null, reason: '' });
      return;
    }
    const timer = setTimeout(async () => {
      setSlugStatus((prev) => ({ ...prev, checking: true }));
      try {
        const res = await fetch(`/api/slug-check?slug=${encodeURIComponent(storeSlug)}`);
        const data = await res.json();
        setSlugStatus({
          checking: false,
          available: Boolean(data.available),
          reason: data.reason || '',
        });
      } catch {
        setSlugStatus({ checking: false, available: null, reason: '' });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [storeSlug]);

  const handleRegisterAndPaySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (slugStatus.available === false) {
      setError(slugStatus.reason || 'Please choose an available store slug.');
      return;
    }
    setSubmitting(true);
    try {
      const generatedUid = `seller-${storeSlug.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`;
      const res = await fetch('/api/onboarding/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: generatedUid,
          username: username || storeSlug,
          password,
          fullName,
          email,
          mobile,
          businessName,
          storeSlug,
          setupPlan,
          setupFeeAmount,
          whatsappNumber: mobile.replace(/[^0-9]/g, '') || '919820144910',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not complete setup payment.');
      }
      setCreatedUid(generatedUid);
      setSetupPaymentRef(data.setupPaymentRef);
      setDispatchedOtp(data.otpCode);
      setEnteredOtp(data.otpCode);
      setWhatsappNumber(mobile.replace(/[^0-9]/g, '') || '919820144910');
      setUpiId(`${storeSlug.toLowerCase()}@okaxis`);
      setPhase('otp_verification');
    } catch (err: any) {
      setError(err.message || 'Onboarding registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: enteredOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OTP verification failed.');
      }
      // Switch active auth session to the newly activated seller!
      switchDemoPersona({
        uid: createdUid,
        email,
        name: `${fullName} (${businessName})`,
      });
      setPhase('guided_wizard');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteWizardAndPublish = async () => {
    setError('');
    setSubmitting(true);
    try {
      // 1. Save branding & store policies
      await authFetch('/api/seller/branding', {
        method: 'PUT',
        body: JSON.stringify({
          preset,
          primaryColor,
          name: businessName,
          tagline,
          about,
          whatsappNumber,
          shippingPolicy,
          flatShippingRate,
          freeShippingThreshold,
          returnPolicy,
          returnWindowDays,
          isPublished: true,
          onboardingStep: 8,
        }),
      });

      // 2. Save payout profile
      await authFetch('/api/seller/payout-profile', {
        method: 'PUT',
        body: JSON.stringify({
          method: payoutMethod,
          upiId,
          accountHolderName: fullName || businessName,
          bankAccountNumber,
          ifscCode,
          bankName,
        }),
      });

      // 3. Create first published product (with minimum 4 photos per Spec v2.0 Section 5)
      await authFetch('/api/seller/products', {
        method: 'POST',
        body: JSON.stringify({
          title: prodTitle,
          sku: prodSku,
          category: prodCategory,
          description: prodDescription,
          sellerPrice: prodSellerPrice,
          stock: prodStock,
          variants: ['S', 'M', 'L'],
          weightGrams: 400,
          shippingNotes: shippingPolicy,
          returnExchangePolicy: returnPolicy,
          status: 'Published',
          primaryImageUrl: GENERATED_ASSETS.silkDress,
          imageUrls: [
            GENERATED_ASSETS.silkDress,
            GENERATED_ASSETS.heroStudio,
            GENERATED_ASSETS.leatherTote,
            GENERATED_ASSETS.botanicalSerum,
          ],
        }),
      });

      navigate(`/${storeSlug.toLowerCase().trim()}`);
    } catch (err: any) {
      setError(err.message || 'Could not publish store.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col">
      <PublicHeader />

      <main className="max-w-[960px] mx-auto w-full px-6 py-12">
        {/* Progress Indicator */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div>
            <div className="text-xs font-semibold text-[#2563EB]">
              Seller Onboarding & Store Activation
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111827]">
              {phase === 'signup_and_payment' && 'Step 1: Claim Your Store Slug & Setup Plan'}
              {phase === 'otp_verification' && 'Step 2: Verify Activation Email OTP'}
              {phase === 'guided_wizard' && 'Step 3: Guided Store Launch Wizard'}
            </h1>
          </div>
          <div className="text-xs font-mono text-[#6B7280]">
            {phase === 'signup_and_payment' && 'Phase 1 of 3 · Details & Setup Fee'}
            {phase === 'otp_verification' && 'Phase 2 of 3 · Webhook Verified → OTP Gate'}
            {phase === 'guided_wizard' && `Phase 3 of 3 · Wizard (${wizardStep + 1}/8)`}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-[12px] bg-red-50 border border-red-200 flex items-center gap-3 text-sm text-[#DC2626]">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PHASE 1: DETAILS, SLUG CHECK & SETUP PAYMENT */}
        {phase === 'signup_and_payment' && (
          <form
            onSubmit={handleRegisterAndPaySetup}
            className="bg-white border border-[#E5E7EB] rounded-[18px] p-8 space-y-6 shadow-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Riya Kapoor"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Email Address (For Activation OTP) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="riya@kapoorstudio.in"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Seller Login Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  }
                  placeholder="riya_kapoor"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Account Password (Salted Scrypt) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 98201 11223"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (!storeSlug) {
                      setStoreSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '')
                          .slice(0, 18)
                      );
                    }
                  }}
                  placeholder="e.g., Kora Handloom Studio"
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                />
              </div>
            </div>

            {/* Store Slug Availability Checker */}
            <div className="p-5 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
              <label className="block text-xs font-semibold text-[#111827]">
                Desired Branded Storefront URL *
              </label>
              <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5">
                <span className="font-mono text-sm text-[#6B7280] select-none">
                  platform.com/
                </span>
                <input
                  type="text"
                  required
                  value={storeSlug}
                  onChange={(e) =>
                    setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  placeholder="korastudio"
                  className="font-mono text-sm font-bold text-[#111827] bg-transparent focus:outline-none w-full"
                />
              </div>
              {slugStatus.reason && (
                <div
                  className={`text-xs font-medium flex items-center gap-1.5 pt-1 ${
                    slugStatus.available ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}
                >
                  <span>{slugStatus.reason}</span>
                </div>
              )}
              <div className="text-[11px] text-[#6B7280]">
                Reserved system paths (such as <span className="font-mono">admin</span>,{' '}
                <span className="font-mono">app</span>, <span className="font-mono">login</span>,
                or existing stores like <span className="font-mono">velora</span>) are protected.
              </div>
            </div>

            {/* Setup Plan Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#111827]">
                Select Setup Plan *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: 'Starter Setup', price: 999, desc: 'Up to 50 products · 3 themes' },
                  { name: 'Growth Annual', price: 1999, desc: 'Unlimited products · All 6 themes' },
                  { name: 'Studio Pro', price: 3499, desc: 'Multi-collection + Priority batch' },
                ].map((pl) => (
                  <button
                    key={pl.name}
                    type="button"
                    onClick={() => setSetupPlan(pl.name)}
                    className={`p-4 rounded-[12px] border text-left transition-all ${
                      setupPlan === pl.name
                        ? 'border-[#2563EB] bg-blue-50/30 ring-1 ring-[#2563EB]'
                        : 'border-[#E5E7EB] bg-[#F8FAFC] hover:border-slate-300'
                    }`}
                  >
                    <div className="font-display font-bold text-sm text-[#111827]">{pl.name}</div>
                    <div className="font-mono text-lg font-bold text-[#2563EB] mt-1">
                      ₹{pl.price.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-[#6B7280] mt-1">{pl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-xs text-[#6B7280]">
                Account remains inactive until setup fee webhook succeeds and Email OTP is verified.
              </div>
              <button
                type="submit"
                disabled={submitting || slugStatus.available === false}
                className="px-6 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-sm font-semibold rounded-[12px] transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                {submitting
                  ? 'Verifying Gateway Setup Payment...'
                  : `Pay Setup Fee (₹${setupFeeAmount.toLocaleString('en-IN')}) & Send OTP`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PHASE 2: EMAIL OTP VERIFICATION AFTER SETUP FEE WEBHOOK */}
        {phase === 'otp_verification' && (
          <form
            onSubmit={handleVerifyOtp}
            className="bg-white border border-[#E5E7EB] rounded-[18px] p-8 space-y-6 shadow-xs"
          >
            <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#16A34A]">
                <ShieldCheck className="w-4 h-4" />
                <span>Setup Fee Webhook Confirmed ({setupPaymentRef})</span>
              </div>
              <p className="text-xs text-[#111827]">
                We dispatched a 6-digit activation OTP to <strong>{email}</strong>. For immediate
                evaluation in this environment, your generated code is{' '}
                <span className="font-mono font-bold underline">{dispatchedOtp}</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-2">
                Enter 6-Digit Email OTP to Activate Account
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value)}
                className="w-full max-w-xs px-4 py-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-xl font-bold tracking-widest text-[#111827]"
              />
              <p className="text-xs text-[#6B7280] mt-2">
                Short 10-minute expiry · Hashed server storage · Rate limited (max 5 attempts)
              </p>
            </div>

            <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPhase('signup_and_payment')}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[12px] transition-colors flex items-center gap-2"
              >
                {submitting ? 'Activating Account...' : 'Verify OTP & Launch Guided Wizard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* PHASE 3: 8-STEP GUIDED ONBOARDING WIZARD */}
        {phase === 'guided_wizard' && (
          <div className="bg-white border border-[#E5E7EB] rounded-[18px] p-8 space-y-8 shadow-xs">
            {/* Step Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E5E7EB]">
              {WIZARD_STEPS.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setWizardStep(idx)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-colors ${
                    wizardStep === idx
                      ? 'bg-[#2563EB] text-white'
                      : idx < wizardStep
                      ? 'bg-emerald-50 text-[#16A34A]'
                      : 'bg-[#F8FAFC] text-[#6B7280]'
                  }`}
                >
                  {idx + 1}. {label}
                </button>
              ))}
            </div>

            {/* Step 0: Brand */}
            {wizardStep === 0 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold">
                  1. Choose Controlled Brand Theme Preset
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {THEME_PRESETS.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => {
                        setPreset(tp.id);
                        setPrimaryColor(tp.primaryColor);
                      }}
                      className={`p-4 rounded-[12px] border text-left ${
                        preset === tp.id
                          ? 'border-[#2563EB] bg-blue-50/20 ring-1 ring-[#2563EB]'
                          : 'border-[#E5E7EB] bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="font-display font-bold text-sm text-[#111827]">{tp.name}</div>
                      <p className="text-xs text-[#6B7280] mt-1">{tp.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Store Details */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">2. Storefront Editorial Details</h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">Store Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">About Your Brand</label>
                  <textarea
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 2: WhatsApp */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">
                  3. WhatsApp Order Enquiry Configuration
                </h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    WhatsApp Business Number (with country code, e.g., 919820144910)
                  </label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Shipping */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">4. Seller-Fulfilled Shipping</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Flat Shipping Rate (INR)
                    </label>
                    <input
                      type="number"
                      value={flatShippingRate}
                      onChange={(e) => setFlatShippingRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Free Shipping Threshold (INR)
                    </label>
                    <input
                      type="number"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Shipping Policy</label>
                  <textarea
                    rows={2}
                    value={shippingPolicy}
                    onChange={(e) => setShippingPolicy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Returns */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">5. Return & Exchange Policy</h2>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Return Eligibility Window (Days)
                  </label>
                  <input
                    type="number"
                    value={returnWindowDays}
                    onChange={(e) => setReturnWindowDays(Number(e.target.value))}
                    className="w-full max-w-xs px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Return & Exchange Policy Statement
                  </label>
                  <textarea
                    rows={2}
                    value={returnPolicy}
                    onChange={(e) => setReturnPolicy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Payout */}
            {wizardStep === 5 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">
                  6. Weekly Settlement Payout Destination
                </h2>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('upi')}
                    className={`px-4 py-2 rounded-[8px] text-xs font-semibold border ${
                      payoutMethod === 'upi'
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]'
                    }`}
                  >
                    Verified UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank')}
                    className={`px-4 py-2 rounded-[8px] text-xs font-semibold border ${
                      payoutMethod === 'bank'
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]'
                    }`}
                  >
                    Bank Account + IFSC
                  </button>
                </div>
                {payoutMethod === 'upi' ? (
                  <div>
                    <label className="block text-xs font-semibold mb-1">Verified UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourbrand@okaxis"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Bank Name"
                      className="px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                    />
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Account Number"
                      className="px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    />
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="IFSC Code"
                      className="px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 6: First Product */}
            {wizardStep === 6 && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">
                  7. Add Your First Product (Server Calculates +10% Customer Price)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Product Title</label>
                    <input
                      type="text"
                      value={prodTitle}
                      onChange={(e) => setProdTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">SKU</label>
                    <input
                      type="text"
                      value={prodSku}
                      onChange={(e) => setProdSku(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Your Seller Price (INR)
                    </label>
                    <input
                      type="number"
                      value={prodSellerPrice}
                      onChange={(e) => setProdSellerPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">
                      Calculated Customer Payable (+10% Fee)
                    </label>
                    <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[10px] font-mono text-sm font-bold text-[#16A34A]">
                      ₹{Math.round(prodSellerPrice * 1.1).toLocaleString('en-IN')} (Includes ₹
                      {Math.round(prodSellerPrice * 0.1)} fee)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Publish */}
            {wizardStep === 7 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-[#16A34A]">
                  <Sparkles className="w-5 h-5" />
                  <span>8. Ready to Publish Your Branded Storefront</span>
                </div>
                <p className="text-sm text-[#6B7280]">
                  Your storefront at{' '}
                  <span className="font-mono font-bold text-[#111827]">
                    platform.com/{storeSlug}
                  </span>{' '}
                  is configured with the <strong>{preset}</strong> theme preset, WhatsApp ordering,
                  and your first product.
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-[#E5E7EB] flex items-center justify-between">
              <button
                type="button"
                disabled={wizardStep === 0}
                onClick={() => setWizardStep((s) => Math.max(0, s - 1))}
                className="px-4 py-2 text-xs font-semibold text-[#6B7280] disabled:opacity-40"
              >
                ← Previous Step
              </button>

              {wizardStep < 7 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => s + 1)}
                  className="px-5 py-2.5 bg-[#111827] text-white text-xs font-semibold rounded-[10px]"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCompleteWizardAndPublish}
                  className="px-6 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[12px] flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {submitting ? 'Publishing Storefront...' : `Publish platform.com/${storeSlug}`}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
