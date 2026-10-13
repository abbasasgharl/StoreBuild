import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { SafeImage } from '../../components/SafeImage.tsx';
import {
  MessageCircle,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  ExternalLink,
  Check,
  Images,
} from 'lucide-react';

export default function StorefrontProductPage() {
  const { storeSlug, productSlug } = useParams<{ storeSlug: string; productSlug: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>('Standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);

  // WhatsApp Enquiry Modal & Generated Order Reference state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState('Aarav Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 98204 55190');
  const [customerEmail, setCustomerEmail] = useState('aarav@example.com');
  const [shippingAddress, setShippingAddress] = useState(
    '14B, Defence Colony, New Delhi - 110024'
  );
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdEnquiry, setCreatedEnquiry] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setActiveImageIdx(0);
    fetch(`/api/storefront/${storeSlug}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        const found = resData?.products?.find(
          (p: any) => p.slug === productSlug || String(p.id) === productSlug
        );
        if (found) {
          document.title =
            found.seoTitle || `${found.title} | ${resData?.store?.name || 'Storefront'}`;
          try {
            const parsed = JSON.parse(found.variantsJson || '["Standard"]');
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSelectedVariant(parsed[0]);
            }
          } catch {
            setSelectedVariant('Standard');
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [storeSlug, productSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading product showcase...
      </div>
    );
  }

  const store = data?.store;
  const branding = data?.branding;
  const product = data?.products?.find(
    (p: any) => p.slug === productSlug || String(p.id) === productSlug
  );

  if (!store || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Product Not Found</h1>
        <Link
          to={`/${storeSlug || 'velora'}`}
          className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-[10px]"
        >
          Back to Storefront
        </Link>
      </div>
    );
  }

  let variants: string[] = ['Standard'];
  try {
    const parsed = JSON.parse(product.variantsJson || '["Standard"]');
    if (Array.isArray(parsed) && parsed.length > 0) variants = parsed;
  } catch {
    variants = ['Standard'];
  }

  const galleryImages: string[] =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.primaryImageUrl];

  const activeImageUrl = galleryImages[activeImageIdx] || product.primaryImageUrl;
  const cropClass =
    product.imageCropPosition === 'top'
      ? 'object-top'
      : product.imageCropPosition === 'bottom'
      ? 'object-bottom'
      : 'object-center';

  const unitCustomerPrice = Number(product.customerPrice);
  const totalPayable = unitCustomerPrice * quantity;

  const handleGenerateWhatsAppOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOrder(true);
    try {
      const res = await fetch('/api/storefront/whatsapp-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: store.slug,
          productId: product.id,
          selectedVariant,
          quantity,
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setCreatedEnquiry(result);
      }
    } finally {
      setCreatingOrder(false);
    }
  };

  const whatsappMessageText = createdEnquiry
    ? `Hello ${store.name}, I would like to order:\n• Product: ${product.title} (ID: #${product.id} / SKU: ${product.sku})\n• Variant: ${selectedVariant} (Qty: ${quantity})\n• Order/Enquiry Ref: ${createdEnquiry.order.orderRef} (${createdEnquiry.whatsappEnquiryRef})\n• Payable Amount: ₹${createdEnquiry.order.customerTotalPayable.toLocaleString('en-IN')}\nPlease confirm availability and share my platform payment link.`
    : `Hello ${store.name}, I'm interested in ${product.title} (SKU: ${product.sku}, Variant: ${selectedVariant}).`;

  const whatsappDeepLink = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
    whatsappMessageText
  )}`;

  // Specification v2.0 Section 10: Product + Offer + BreadcrumbList JSON-LD
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    sku: product.sku,
    description: product.seoDescription || product.description,
    image: galleryImages,
    brand: {
      '@type': 'Brand',
      name: store.name,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: String(unitCustomerPrice),
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${window.location.origin}/${store.slug}/product/${product.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-white text-[#111827] pb-24 md:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E5E7EB] px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link
          to={`/${store.slug}`}
          className="text-sm font-semibold text-[#111827] flex items-center gap-2 hover:text-[#2563EB]"
        >
          <ArrowLeft className="w-4 h-4" />
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={store.name}
              className="w-6 h-6 rounded-[5px] object-cover border border-[#E5E7EB]"
            />
          ) : null}
          <span>{store.name}</span>
        </Link>
        <div className="font-mono text-xs text-[#6B7280]">
          SKU: {product.sku} · {galleryImages.length} Verified Photos (4:5)
        </div>
      </header>

      {/* Main Contiguous Product Detail Module */}
      <main className="max-w-[1200px] mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left 4:5 Portrait Gallery + Multi-Photo Thumbnails */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/5] max-h-[640px] w-full rounded-[18px] overflow-hidden border border-[#E5E7EB] bg-[#F8FAFC] relative">
              <SafeImage
                src={activeImageUrl}
                alt={`${product.title} — Photo ${activeImageIdx + 1}`}
                className={`w-full h-full object-cover ${cropClass}`}
              />
              <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur px-3 py-1 rounded-[8px] border border-[#E5E7EB] text-[11px] font-mono font-semibold text-[#111827] flex items-center gap-1.5">
                <Images className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>
                  Photo {activeImageIdx + 1} of {galleryImages.length} · 4:5 Portrait
                </span>
              </div>
            </div>

            {/* Thumbnail Strip (Minimum 4 Photos per Spec v2.0 Section 5) */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`aspect-[4/5] rounded-[10px] overflow-hidden border-2 transition-all ${
                    activeImageIdx === idx
                      ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20'
                      : 'border-[#E5E7EB] opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={imgUrl}
                    alt={`${product.title} thumbnail ${idx + 1}`}
                    className={`w-full h-full object-cover ${cropClass}`}
                  />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs text-[#6B7280] pt-2">
              <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB]">
                <strong className="block text-[#111827] mb-0.5">Authentic Craft</strong>
                Direct from {store.name}
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB]">
                <strong className="block text-[#111827] mb-0.5">Weight</strong>
                {product.weightGrams}g archival pack
              </div>
              <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB]">
                <strong className="block text-[#111827] mb-0.5">Protected Payment</strong>
                Verified via Platform Link
              </div>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[18px] p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="text-xs font-medium text-[#6B7280]">
                {product.category} · {product.stock} in stock · ID #{product.id}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111827]">
                {product.title}
              </h1>
              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-mono text-2xl sm:text-3xl font-bold text-[#111827]">
                  ₹{unitCustomerPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#6B7280]">
                  Inclusive of ₹{Number(product.sellerPrice).toLocaleString('en-IN')} seller price +
                  10% platform protection fee
                </span>
              </div>
            </div>

            <p className="text-sm text-[#6B7280] leading-relaxed">{product.description}</p>

            {/* Variant Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#111827]">
                Select Variant / Size
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3.5 py-2 rounded-[8px] text-xs font-semibold border transition-colors ${
                      selectedVariant === v
                        ? 'bg-[#111827] text-white border-[#111827]'
                        : 'bg-white text-[#111827] border-[#E5E7EB] hover:border-[#111827]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center justify-between border-y border-[#E5E7EB] py-3.5">
              <span className="text-xs font-semibold text-[#111827]">Quantity</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E7EB] font-mono font-bold text-sm"
                >
                  -
                </button>
                <span className="font-mono text-sm font-bold w-6 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 10, q + 1))}
                  className="w-8 h-8 rounded-[8px] bg-white border border-[#E5E7EB] font-mono font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary CTA: Order on WhatsApp */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowOrderModal(true)}
                style={{ backgroundColor: branding?.primaryColor || '#2563EB' }}
                className="w-full py-4 px-6 text-white text-sm font-semibold rounded-[12px] shadow-xs hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order on WhatsApp · ₹{totalPayable.toLocaleString('en-IN')}</span>
              </button>
              <div className="text-[11px] text-[#6B7280] text-center">
                Generates a unique order reference & verified platform payment link
              </div>
            </div>

            {/* Delivery & Return Policies */}
            <div className="space-y-3 pt-2 border-t border-[#E5E7EB] text-xs text-[#6B7280]">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-[#111827] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827]">Delivery:</strong>{' '}
                  {product.shippingNotes || store.shippingPolicy}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <RotateCcw className="w-4 h-4 text-[#111827] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827]">Returns & Exchanges:</strong>{' '}
                  {product.returnExchangePolicy || store.returnPolicy}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827]">Buyer Protection:</strong> Payment is held in
                  the platform ledger through fulfilment and return policy windows.
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Prominent Bottom Action Bar (<= 15% viewport height) */}
      <div className="fixed bottom-0 inset-x-0 z-20 md:hidden bg-white border-t border-[#E5E7EB] px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] text-[#6B7280] truncate">{product.title}</div>
          <div className="font-mono text-base font-bold text-[#111827]">
            ₹{totalPayable.toLocaleString('en-IN')}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowOrderModal(true)}
          style={{ backgroundColor: branding?.primaryColor || '#2563EB' }}
          className="px-5 py-3 text-white text-xs font-semibold rounded-[10px] flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Order on WhatsApp</span>
        </button>
      </div>

      {/* Contextual WhatsApp Order + Platform Payment Link Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-[18px] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">
                  Customer + WhatsApp Order Flow
                </div>
                <h2 className="font-display text-xl font-bold text-[#111827]">
                  {createdEnquiry
                    ? `Order Reference ${createdEnquiry.order.orderRef} Generated`
                    : 'Confirm Details for WhatsApp Order'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowOrderModal(false);
                  setCreatedEnquiry(null);
                }}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
              >
                Close ✕
              </button>
            </div>

            {!createdEnquiry ? (
              <form onSubmit={handleGenerateWhatsAppOrder} className="space-y-4">
                <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB] text-xs space-y-1">
                  <div className="font-semibold text-[#111827]">
                    {product.title} ({selectedVariant} × {quantity})
                  </div>
                  <div className="font-mono text-[#6B7280]">
                    Store: {store.name} · Product ID #{product.id} · Total: ₹
                    {totalPayable.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">WhatsApp Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="w-full py-3.5 px-5 bg-[#16A34A] hover:bg-emerald-700 text-white text-sm font-semibold rounded-[10px] flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {creatingOrder
                    ? 'Generating Unique Order Reference...'
                    : 'Generate WhatsApp Enquiry & Payment Link'}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#16A34A]">
                    <Check className="w-4 h-4" />
                    <span>Contextual WhatsApp Message & Platform Payment Link Ready</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-[11px] text-[#111827] bg-white p-3 rounded-[8px] border border-emerald-200">
                    {whatsappMessageText}
                  </pre>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={whatsappDeepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold rounded-[10px] flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>1. Open WhatsApp Chat</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => navigate(createdEnquiry.checkoutPath)}
                    className="py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[10px] flex items-center justify-center gap-2"
                  >
                    <span>2. Proceed to Payment Link →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
