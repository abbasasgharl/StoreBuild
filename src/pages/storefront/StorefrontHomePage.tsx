import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SafeImage } from '../../components/SafeImage.tsx';
import {
  MessageCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowLeft,
  LifeBuoy,
  CheckCircle2,
} from 'lucide-react';

export default function StorefrontHomePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Buyer-to-Seller Support Ticket Modal (Spec v2.0 Section 8)
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [ticketName, setTicketName] = useState('');
  const [ticketContact, setTicketContact] = useState('');
  const [ticketOrderRef, setTicketOrderRef] = useState('');
  const [ticketCategory, setTicketCategory] = useState('Order Status');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [ticketError, setTicketError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/storefront/${storeSlug}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
        if (resData?.store) {
          document.title =
            resData.store.seoTitle || `${resData.store.name} — Official Branded Storefront`;
        }
      })
      .catch(() => setLoading(false));
  }, [storeSlug]);

  const handleCreateBuyerTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError('');
    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/support/buyer-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: data?.store?.slug || storeSlug,
          requesterName: ticketName,
          requesterContact: ticketContact,
          relatedRef: ticketOrderRef,
          category: ticketCategory,
          subject: ticketSubject || `${ticketCategory} Enquiry`,
          message: ticketMessage,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not submit support ticket');
      setCreatedTicket(json);
    } catch (err: any) {
      setTicketError(err.message || 'Support request failed');
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading branded storefront...
      </div>
    );
  }

  if (!data || data.error || !data.store) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#111827]">Storefront Not Found</h1>
        <p className="text-sm text-[#6B7280] max-w-md">
          No published entrepreneur store exists at <span className="font-mono">/{storeSlug}</span>.
        </p>
        <div className="flex gap-3">
          <Link
            to="/velora"
            className="px-4 py-2.5 bg-[#2563EB] text-white text-xs font-semibold rounded-[10px]"
          >
            Visit /velora Storefront
          </Link>
          <Link
            to="/"
            className="px-4 py-2.5 bg-white border border-[#E5E7EB] text-xs font-semibold rounded-[10px]"
          >
            Platform Home
          </Link>
        </div>
      </div>
    );
  }

  const { store, branding, products = [] } = data;
  const primaryColor = branding?.primaryColor || '#2563EB';
  const buttonRadius =
    branding?.buttonStyle === 'pill'
      ? 'rounded-full'
      : branding?.buttonStyle === 'sharp'
      ? 'rounded-none'
      : 'rounded-[10px]';

  const categories = ['All', ...Array.from(new Set(products.map((p: any) => p.category)))];

  const filteredProducts = products.filter((p: any) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const directStoreWhatsApp = `https://wa.me/${store.whatsappNumber}?text=${encodeURIComponent(
    `Hi ${store.name}, I am browsing your online store at platform.com/${store.slug} and have a question.`
  )}`;

  // Specification v2.0 Section 10: Schema.org OnlineStore + ItemList JSON-LD
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: store.name,
    description: store.seoDescription || store.about,
    url: `${window.location.origin}/${store.slug}`,
    telephone: store.contactPhone,
    email: store.contactEmail,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${store.name} Catalogue`,
      itemListElement: products.map((p: any, idx: number) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${window.location.origin}/${store.slug}/product/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827] flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />

      {/* Slim Informative Top Bar */}
      <div className="bg-[#111827] text-white text-xs px-6 py-2 flex items-center justify-between">
        <span className="truncate">
          Complimentary shipping on orders over ₹
          {(store.freeShippingThreshold || 1500).toLocaleString('en-IN')} ·{' '}
          {store.returnWindowDays || 7}-day easy return & exchange
        </span>
        <Link
          to="/"
          className="text-gray-300 hover:text-white flex items-center gap-1 whitespace-nowrap shrink-0 ml-4"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Platform Home</span>
        </Link>
      </div>

      {/* Storefront Brand Header (3-Zone Contract) */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E5E7EB] px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link
          to={`/${store.slug}`}
          className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-[#111827] whitespace-nowrap shrink-0"
        >
          {branding?.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={store.name}
              className="w-8 h-8 rounded-[8px] object-cover border border-[#E5E7EB]"
            />
          ) : null}
          <span>{store.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6B7280]">
          <a href="#collection" className="hover:text-[#111827] transition-colors whitespace-nowrap">
            Collection
          </a>
          <a href="#about-brand" className="hover:text-[#111827] transition-colors whitespace-nowrap">
            About
          </a>
          <a href="#policies" className="hover:text-[#111827] transition-colors whitespace-nowrap">
            Shipping & Returns
          </a>
          <button
            type="button"
            onClick={() => {
              setCreatedTicket(null);
              setShowSupportModal(true);
            }}
            className="hover:text-[#111827] transition-colors whitespace-nowrap"
          >
            Buyer Support
          </button>
          <Link
            to="/app/dashboard"
            className="hover:text-[#111827] transition-colors whitespace-nowrap"
          >
            Seller View
          </Link>
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setCreatedTicket(null);
              setShowSupportModal(true);
            }}
            className="px-3 py-2 text-xs font-semibold text-[#111827] bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB] rounded-[10px] hidden sm:flex items-center gap-1.5 whitespace-nowrap"
          >
            <LifeBuoy className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Support Desk</span>
          </button>
          <a
            href={directStoreWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: primaryColor }}
            className={`px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 ${buttonRadius}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Storefront Editorial Hero */}
      <section className="max-w-[1240px] mx-auto w-full px-6 pt-10 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-[#F8FAFC] border border-[#E5E7EB] rounded-[18px] p-6 sm:p-10">
          <div className="lg:col-span-6 space-y-5">
            <div className="text-xs font-medium text-[#6B7280]">
              {branding?.preset || 'Luxury'} Storefront · Verified Independent Seller
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111827] leading-[1.1] text-balance">
              {store.tagline || store.name}
            </h1>
            <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">{store.about}</p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#collection"
                style={{ backgroundColor: primaryColor }}
                className={`px-6 py-3.5 text-sm font-semibold text-white ${buttonRadius}`}
              >
                Explore Collection
              </a>
              <a
                href={directStoreWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-3.5 text-sm font-semibold bg-white border border-[#E5E7EB] text-[#111827] hover:border-[#111827] ${buttonRadius}`}
              >
                Enquire on WhatsApp
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="aspect-[16/10] rounded-[12px] overflow-hidden border border-[#E5E7EB] bg-white">
              <SafeImage
                src={branding?.bannerUrl}
                alt={store.name}
                className={`w-full h-full object-cover ${
                  (() => {
                    try {
                      const parsed = branding?.bannerCropJson ? JSON.parse(branding.bannerCropJson) : null;
                      if (parsed?.position === 'top') return 'object-top';
                      if (parsed?.position === 'bottom') return 'object-bottom';
                    } catch {}
                    return 'object-center';
                  })()
                }`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection Grid (4:5 Portrait Product Cards per Specification v2.0 Section 5) */}
      <section id="collection" className="max-w-[1240px] mx-auto w-full px-6 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          {/* Interactive Category Filter Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] overflow-x-auto">
            {categories.map((cat: any) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-[8px] transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-[#111827] shadow-2xs border border-[#E5E7EB]'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-xs text-[#111827] w-full sm:w-64 focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {filteredProducts.map((product: any) => {
            const cropPos =
              product.imageCropPosition === 'top'
                ? 'object-top'
                : product.imageCropPosition === 'bottom'
                ? 'object-bottom'
                : 'object-center';
            const photoCount = Array.isArray(product.images) ? product.images.length : 4;
            return (
              <Link
                key={product.id}
                to={`/${store.slug}/product/${product.slug}`}
                className={`group flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 ${
                  branding?.cardStyle === 'bordered'
                    ? 'border border-[#E5E7EB] rounded-[12px] p-4 bg-white'
                    : branding?.cardStyle === 'minimal'
                    ? 'bg-white'
                    : 'border border-[#E5E7EB] rounded-[12px] overflow-hidden bg-white'
                }`}
              >
                <div>
                  <div className="aspect-[4/5] bg-[#F8FAFC] overflow-hidden relative">
                    <SafeImage
                      src={product.primaryImageUrl}
                      alt={product.title}
                      className={`w-full h-full object-cover ${cropPos} group-hover:scale-105 transition-transform duration-300`}
                    />
                    <div className="absolute bottom-2.5 right-2.5 bg-black/70 text-white font-mono text-[10px] px-2 py-0.5 rounded-[6px]">
                      {photoCount} photos · 4:5
                    </div>
                  </div>
                  <div className={branding?.cardStyle === 'minimal' ? 'pt-4' : 'p-5'}>
                    <div className="text-xs text-[#6B7280] mb-1">
                      {product.category} · {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </div>
                    <h2 className="font-display text-base font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors">
                      {product.title}
                    </h2>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="font-mono text-base font-bold text-[#111827]">
                        ₹{Number(product.customerPrice).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-[#2563EB]">
                        Order on WhatsApp →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* About, Trust, Shipping & Return Policy Section */}
      <section
        id="policies"
        className="max-w-[1240px] mx-auto w-full px-6 py-16 border-t border-[#E5E7EB] mt-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            id="about-brand"
            className="p-6 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-2"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>About {store.name}</span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">{store.about}</p>
            <div className="pt-2 text-xs text-[#111827] font-mono">
              Contact: {store.contactEmail || 'care@store.in'} · {store.contactPhone}
            </div>
          </div>

          <div className="p-6 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
              <Truck className="w-4 h-4 text-[#2563EB]" />
              <span>Shipping & Fulfilment Policy</span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">{store.shippingPolicy}</p>
            <div className="pt-2 text-xs text-[#111827]">
              Free shipping above ₹{(store.freeShippingThreshold || 1500).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-6 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
              <RotateCcw className="w-4 h-4 text-[#2563EB]" />
              <span>Return & Exchange Policy ({store.returnWindowDays} Days)</span>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">{store.returnPolicy}</p>
            <div className="pt-2 text-xs text-[#16A34A] font-medium">
              Protected by Platform Wallet Escrow & Return Reserve
            </div>
          </div>
        </div>
      </section>

      {/* Buyer-to-Seller Support Ticket Modal (Spec v2.0 Section 8) */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-[18px] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div>
                <div className="text-xs font-semibold text-[#2563EB]">
                  Buyer-to-Seller Support Desk
                </div>
                <h2 className="font-display text-lg font-bold text-[#111827]">
                  Contact {store.name} Support
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
              >
                Close ✕
              </button>
            </div>

            {ticketError && (
              <div className="p-3 rounded-[8px] bg-red-50 border border-red-200 text-xs text-[#DC2626]">
                {ticketError}
              </div>
            )}

            {createdTicket ? (
              <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#16A34A]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Support Ticket {createdTicket.ticketRef} Created</span>
                </div>
                <p className="text-[#111827]">
                  Your enquiry has been routed to <strong>{store.name}</strong>’s Seller Support
                  Queue. Keep reference <span className="font-mono font-bold">{createdTicket.ticketRef}</span> for tracking.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateBuyerTicket} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      placeholder="Meera Krishnan"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Email or WhatsApp Phone *</label>
                    <input
                      type="text"
                      required
                      value={ticketContact}
                      onChange={(e) => setTicketContact(e.target.value)}
                      placeholder="meera@example.com"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Issue Category *</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    >
                      <option value="Order Status">Order Status</option>
                      <option value="Payment Issue">Payment Issue</option>
                      <option value="Return / Exchange">Return / Exchange</option>
                      <option value="Product Enquiry">Product Enquiry</option>
                      <option value="Shipping Problem">Shipping Problem</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Order Ref (Optional)</label>
                    <input
                      type="text"
                      value={ticketOrderRef}
                      onChange={(e) => setTicketOrderRef(e.target.value)}
                      placeholder="e.g., ORD-84925"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Delivery status or product sizing question"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Message *</label>
                  <textarea
                    rows={3}
                    required
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Share your question or order details..."
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-[10px]"
                >
                  {submittingTicket ? 'Creating Ticket...' : 'Submit Support Ticket'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <footer className="bg-[#F8FAFC] border-t border-[#E5E7EB] py-8 px-6 text-xs text-[#6B7280] mt-auto">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <strong className="text-[#111827]">{store.name}</strong> · Official Storefront at
            platform.com/{store.slug}
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => {
                setCreatedTicket(null);
                setShowSupportModal(true);
              }}
              className="hover:text-[#111827] font-semibold"
            >
              Raise Support Ticket
            </button>
            <a
              href={directStoreWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111827]"
            >
              WhatsApp Support
            </a>
            <Link to="/" className="hover:text-[#111827]">
              Powered by Velora Commerce
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
