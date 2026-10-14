import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  Smartphone,
  Monitor,
  Share2,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface SeoManagerProps {
  initialStoreSlug?: string;
  isSellerWorkspace?: boolean;
}

export default function SeoManager({ initialStoreSlug = 'velora', isSellerWorkspace = false }: SeoManagerProps) {
  const { authFetch } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState<'store' | 'product' | 'global'>('store');
  const [selectedSlug, setSelectedSlug] = useState(initialStoreSlug);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [twitterCard, setTwitterCard] = useState('summary_large_image');
  const [noIndex, setNoIndex] = useState(false);
  const [noFollow, setNoFollow] = useState(false);
  const [structuredDataJson, setStructuredDataJson] = useState('');

  // Health check state
  const [healthData, setHealthData] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewChannel, setPreviewChannel] = useState<'google' | 'social'>('google');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadSeoMeta = async () => {
    try {
      const res = await fetch(`/api/seo/meta/${selectedEntity}/${selectedSlug}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          setTitle(data.title || '');
          setDescription(data.description || '');
          setCanonicalUrl(data.canonicalUrl || '');
          setKeywords(data.keywords || '');
          setOgTitle(data.ogTitle || data.title || '');
          setOgDescription(data.ogDescription || data.description || '');
          setOgImageUrl(data.ogImageUrl || '');
          setTwitterCard(data.twitterCard || 'summary_large_image');
          setNoIndex(Boolean(data.noIndex));
          setNoFollow(Boolean(data.noFollow));
          setStructuredDataJson(data.structuredDataJson || '');
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(`/api/seo/health-check?storeSlug=${initialStoreSlug}`);
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {
      // Fallback
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    loadSeoMeta();
  }, [selectedEntity, selectedSlug]);

  useEffect(() => {
    loadHealthCheck();
  }, []);

  const handleGenerateStructuredData = () => {
    if (selectedEntity === 'store') {
      const json = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: title || 'Velora Atelier',
        url: canonicalUrl || `https://platform.com/${selectedSlug}`,
        description: description,
        currenciesAccepted: 'INR',
        paymentAccepted: 'UPI, Credit Card, Netbanking',
        priceRange: '₹₹',
      };
      setStructuredDataJson(JSON.stringify(json, null, 2));
    } else if (selectedEntity === 'product') {
      const json = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title || 'Handwoven Raw Mulberry Silk Wrap Dress',
        image: ogImageUrl || 'https://platform.com/assets/product_silk.jpg',
        description: description,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'INR',
          price: 4950,
          availability: 'https://schema.org/InStock',
        },
      };
      setStructuredDataJson(JSON.stringify(json, null, 2));
    }
    setMsg('Generated Schema.org JSON-LD compliant with Google Merchant rich snippets.');
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErrorMsg('');

    try {
      const res = await authFetch('/api/seo/meta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: selectedEntity,
          entityId: selectedSlug,
          title,
          description,
          canonicalUrl,
          keywords,
          ogTitle,
          ogDescription,
          ogImageUrl,
          twitterCard,
          noIndex,
          noFollow,
          structuredDataJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save SEO metadata.');
      setMsg(`SEO configuration for ${selectedEntity} "${selectedSlug}" saved successfully.`);
      loadHealthCheck();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save SEO metadata.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Header Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#2563EB]" />
              <h2 className="font-display text-lg font-bold text-[#111827]">
                Storefront & Catalog SEO Control Panel
              </h2>
            </div>
            <p className="text-xs text-[#6B7280]">
              Configure crawlable metadata, social share cards (OpenGraph/Twitter), canonical URLs, and Google Merchant Schema.org structured data.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono font-semibold text-[#2563EB] hover:bg-[#F1F5F9] flex items-center gap-1.5"
            >
              <span>/robots.txt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono font-semibold text-[#2563EB] hover:bg-[#F1F5F9] flex items-center gap-1.5"
            >
              <span>/sitemap.xml</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E7EB]">
          <span className="font-semibold text-[#4B5563] mr-1">Target Entity:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedEntity('store');
              setSelectedSlug('velora');
            }}
            className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors ${
              selectedEntity === 'store'
                ? 'bg-[#111827] text-white'
                : 'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]'
            }`}
          >
            Storefront Home (/velora)
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedEntity('product');
              setSelectedSlug('raw-mulberry-silk-wrap-dress');
            }}
            className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors ${
              selectedEntity === 'product' && selectedSlug === 'raw-mulberry-silk-wrap-dress'
                ? 'bg-[#111827] text-white'
                : 'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]'
            }`}
          >
            Product: Mulberry Silk Wrap Dress
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedEntity('product');
              setSelectedSlug('alabaster-brushed-brass-lamp');
            }}
            className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors ${
              selectedEntity === 'product' && selectedSlug === 'alabaster-brushed-brass-lamp'
                ? 'bg-[#111827] text-white'
                : 'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]'
            }`}
          >
            Product: Brass Table Lamp
          </button>
          {!isSellerWorkspace && (
            <button
              type="button"
              onClick={() => {
                setSelectedEntity('global');
                setSelectedSlug('platform');
              }}
              className={`px-3 py-1.5 rounded-[6px] font-semibold transition-colors ${
                selectedEntity === 'global'
                  ? 'bg-[#111827] text-white'
                  : 'bg-[#F8FAFC] text-[#6B7280] border border-[#E5E7EB]'
              }`}
            >
              Platform Root (/)
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[8px] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{msg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-[8px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Algorithmic SEO Health Score Widget */}
      {healthData && (
        <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-bold text-white border-2 border-white shadow ${
                  healthData.grade === 'A'
                    ? 'bg-emerald-600'
                    : healthData.grade === 'B'
                    ? 'bg-blue-600'
                    : 'bg-amber-600'
                }`}
              >
                <span className="text-lg font-display leading-none">{healthData.overallScore}</span>
                <span className="text-[10px] uppercase font-mono">Grade {healthData.grade}</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[#111827]">
                  Algorithmic SEO Content & Indexing Audit
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Evaluates titles, descriptions, OpenGraph social readiness, Schema.org validity, and sitemap crawling.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadHealthCheck}
              disabled={healthLoading}
              className="px-3 py-1.5 border border-[#E5E7EB] rounded-[6px] hover:bg-gray-50 flex items-center gap-1.5 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
              <span>Re-run Audit</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-[#F1F5F9]">
            {healthData.checks?.map((c: any) => (
              <div
                key={c.id}
                className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#111827]">{c.label}</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      c.passed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {c.score} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#4B5563]">{c.detail}</p>
                {c.recommendation && (
                  <p className="text-[10px] text-amber-700 font-medium pt-1">
                    Recommendation: {c.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Two-Column: Editor & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Editor (7 cols) */}
        <form onSubmit={handleSaveSeo} className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#111827] border-b border-[#E5E7EB] pb-2">
              Primary Search Engine Meta Tags
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#374151]">SEO Title Tag</label>
                <span
                  className={`font-mono text-[11px] ${
                    title.length >= 30 && title.length <= 65 ? 'text-emerald-600 font-bold' : 'text-amber-600'
                  }`}
                >
                  {title.length} / 65 characters
                </span>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Velora Atelier — Handcrafted Mulberry Silk Textiles"
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#374151]">Meta Description</label>
                <span
                  className={`font-mono text-[11px] ${
                    description.length >= 70 && description.length <= 160
                      ? 'text-emerald-600 font-bold'
                      : 'text-amber-600'
                  }`}
                >
                  {description.length} / 160 characters
                </span>
              </div>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write an enticing summary for Google search results..."
                className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">Canonical URL</label>
                <input
                  type="text"
                  value={canonicalUrl}
                  onChange={(e) => setCanonicalUrl(e.target.value)}
                  placeholder="https://platform.com/velora"
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Target Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="silk dress, artisan textiles, brass lamp"
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                />
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="rounded text-[#2563EB]"
                />
                <span>noindex (Block Google from indexing this page)</span>
              </label>
              <label className="flex items-center gap-2 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={noFollow}
                  onChange={(e) => setNoFollow(e.target.checked)}
                  className="rounded text-[#2563EB]"
                />
                <span>nofollow</span>
              </label>
            </div>
          </div>

          {/* Social Share & OpenGraph Card */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
            <h3 className="font-display font-bold text-sm text-[#111827] border-b border-[#E5E7EB] pb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#2563EB]" />
              <span>Social Media & OpenGraph Sharing Cards</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#374151] mb-1">OpenGraph Title</label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  placeholder="Social card title..."
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#374151] mb-1">Twitter Card Format</label>
                <select
                  value={twitterCard}
                  onChange={(e) => setTwitterCard(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                >
                  <option value="summary_large_image">summary_large_image (High Impact Banner)</option>
                  <option value="summary">summary (Standard Square Thumbnail)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-[#374151] mb-1">Social Card Image URL</label>
                <input
                  type="text"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                  placeholder="https://.../social_share.jpg (1200x630px recommended)"
                  className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Schema.org Structured Data */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
              <h3 className="font-display font-bold text-sm text-[#111827] flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#2563EB]" />
                <span>Schema.org JSON-LD Structured Data</span>
              </h3>
              <button
                type="button"
                onClick={handleGenerateStructuredData}
                className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Generate Schema</span>
              </button>
            </div>

            <textarea
              rows={5}
              value={structuredDataJson}
              onChange={(e) => setStructuredDataJson(e.target.value)}
              placeholder="Paste Schema.org JSON-LD structured data here..."
              className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono text-[11px]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-[8px] text-sm shadow transition-colors"
          >
            {saving ? 'Saving SEO Configuration...' : `Save SEO Configuration for /${selectedSlug}`}
          </button>
        </form>

        {/* Right Column: Live SERP & Social Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <h3 className="font-display font-bold text-sm text-[#111827]">
                Live Search & Social Simulator
              </h3>
              <div className="flex gap-1 bg-[#F1F5F9] p-0.5 rounded-[6px]">
                <button
                  type="button"
                  onClick={() => setPreviewChannel('google')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    previewChannel === 'google' ? 'bg-white shadow text-[#111827]' : 'text-[#6B7280]'
                  }`}
                >
                  Google SERP
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannel('social')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    previewChannel === 'social' ? 'bg-white shadow text-[#111827]' : 'text-[#6B7280]'
                  }`}
                >
                  Social Card
                </button>
              </div>
            </div>

            {previewChannel === 'google' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[#6B7280]">
                  <span className="text-[11px]">How this page appears on Google search:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-gray-200 text-[#111827]' : ''}`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-gray-200 text-[#111827]' : ''}`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Google SERP Snippet Box */}
                <div className="p-4 bg-white border border-[#D1D5DB] rounded-[10px] space-y-1 shadow-sm font-sans">
                  <div className="flex items-center gap-2 text-[11px] text-[#202124]">
                    <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center font-bold text-[9px] text-blue-800">
                      V
                    </div>
                    <div>
                      <div className="text-[12px] font-normal text-[#202124] leading-tight">platform.com</div>
                      <div className="text-[10px] text-[#5f6368] font-mono leading-tight">
                        https://platform.com/{selectedSlug}
                      </div>
                    </div>
                  </div>

                  <h4 className="text-[16px] text-[#1a0dab] hover:underline font-normal cursor-pointer line-clamp-1 leading-snug">
                    {title || 'Velora Atelier — Handcrafted Boutique'}
                  </h4>

                  <p className="text-[12px] text-[#4d5156] line-clamp-2 leading-relaxed">
                    {description || 'Ethically woven silk apparel and handcrafted living objects.'}
                  </p>
                </div>
              </div>
            )}

            {previewChannel === 'social' && (
              <div className="space-y-3">
                <span className="text-[11px] text-[#6B7280]">
                  How this page appears when shared on WhatsApp, LinkedIn, or Twitter:
                </span>

                {/* Social Card Preview */}
                <div className="border border-[#E5E7EB] rounded-[10px] overflow-hidden shadow-sm bg-[#F8FAFC]">
                  <div className="h-40 bg-[#E2E8F0] relative overflow-hidden flex items-center justify-center">
                    {ogImageUrl ? (
                      <img src={ogImageUrl} alt="Social Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        <Share2 className="w-8 h-8 mx-auto mb-1 opacity-50" />
                        <span className="text-[11px]">Upload social image (1200x630)</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-white space-y-1">
                    <span className="font-mono text-[10px] text-[#6B7280] uppercase">PLATFORM.COM</span>
                    <h5 className="font-bold text-xs text-[#111827] line-clamp-1">
                      {ogTitle || title || 'Velora Atelier'}
                    </h5>
                    <p className="text-[11px] text-[#6B7280] line-clamp-2">
                      {ogDescription || description || 'Handcrafted luxury apparel & sculptural home objects.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-[8px] text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>SEO Isolation Guarantee</span>
              </div>
              <p>
                Every merchant's SEO configurations and URLs remain strictly isolated. Saving these values directly updates the database and public storefront HTML tags.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
