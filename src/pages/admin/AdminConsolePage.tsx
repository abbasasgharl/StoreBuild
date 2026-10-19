import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  ShieldCheck,
  Users,
  Store,
  Package,
  ShoppingBag,
  Landmark,
  FileText,
  LayoutDashboard,
  ExternalLink,
  AlertTriangle,
  Lock,
  Check,
  RotateCcw,
  Wallet as WalletIcon,
  LifeBuoy,
  KeyRound,
  Bot,
  Globe,
  Megaphone,
  Power,
  Play,
  CreditCard,
  LogOut,
  RefreshCw,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  ArrowUpRight,
} from 'lucide-react';

export type AdminTabId =
  | 'dashboard'
  | 'sellers'
  | 'kyc'
  | 'stores'
  | 'products'
  | 'orders'
  | 'wallet'
  | 'payouts'
  | 'gateways'
  | 'returns'
  | 'tickets'
  | 'rbac'
  | 'agent'
  | 'seo'
  | 'ads'
  | 'audit';

export default function AdminConsolePage({ initialTab }: { initialTab?: AdminTabId }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOutUser, loginAdminWith2FA, authFetch } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab || 'dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [banner, setBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Dedicated filter states for Sellers, KYC, and Store Links
  const [sellerStatusFilter, setSellerStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [kycStatusFilter, setKycStatusFilter] = useState<'all' | 'Pending Review' | 'Verified' | 'Rejected'>('all');
  const [storeVisibilityFilter, setStoreVisibilityFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Admin 2FA In-Page Authentication Gate state
  const [adminLoginUser, setAdminLoginUser] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [adminLogin2fa, setAdminLogin2fa] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');

  // Payment Gateways management state
  const [gwUpdating, setGwUpdating] = useState(false);
  const [gwTestFeedback, setGwTestFeedback] = useState<Record<string, string>>({});
  const [editingGwKey, setEditingGwKey] = useState<string | null>(null);
  const [gwFormData, setGwFormData] = useState<{
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    environment: 'sandbox' | 'live';
  }>({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    environment: 'sandbox',
  });

  // Confirmation modal state for sensitive admin actions
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    actionType:
      | 'toggle_store_suspension'
      | 'toggle_wallet_hold'
      | 'approve_payout'
      | 'verify_payout_account'
      | 'approve_kyc'
      | 'reject_kyc'
      | 'toggle_store_publish';
    storeId: number;
    payoutId?: number;
  } | null>(null);
  const [confirmReason, setConfirmReason] = useState(
    'Verified via Admin Compliance & Reconciliation Review'
  );
  const [submittingAction, setSubmittingAction] = useState(false);

  // Support ticket reply state
  const [adminReplyText, setAdminReplyText] = useState<Record<number, string>>({});
  const [internalNoteMode, setInternalNoteMode] = useState<Record<number, boolean>>({});

  // Co-Worker Agent Runner state
  const [agentModule, setAgentModule] = useState<
    'system_health' | 'support_tickets' | 'catalog_audit' | 'seo_audit'
  >('system_health');
  const [agentMode, setAgentMode] = useState<'read_only' | 'propose_change'>('read_only');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [runningAgent, setRunningAgent] = useState(false);

  // SEO Control Panel form state
  const [seoSiteTitle, setSeoSiteTitle] = useState('');
  const [seoSiteDescription, setSeoSiteDescription] = useState('');
  const [seoCanonicalBase, setSeoCanonicalBase] = useState('https://platform.com');
  const [seoRobotsDirectives, setSeoRobotsDirectives] = useState('');
  const [seoSitemapEnabled, setSeoSitemapEnabled] = useState(true);
  const [seoNoindexPrivate, setSeoNoindexPrivate] = useState(true);
  const [seoGoogleVerify, setSeoGoogleVerify] = useState('');
  const [seoBingVerify, setSeoBingVerify] = useState('');

  // Synchronize route with active tab (Deep Linking & direct URL refresh support)
  useEffect(() => {
    const p = location.pathname;
    if (p === '/admin/sellers' || p.startsWith('/admin/sellers')) setActiveTab('sellers');
    else if (p === '/admin/kyc' || p.startsWith('/admin/kyc')) setActiveTab('kyc');
    else if (p === '/admin/stores' || p.startsWith('/admin/stores')) setActiveTab('stores');
    else if (p === '/admin/products' || p.startsWith('/admin/products')) setActiveTab('products');
    else if (p === '/admin/orders' || p.startsWith('/admin/orders')) setActiveTab('orders');
    else if (p === '/admin/wallet' || p.startsWith('/admin/wallet')) setActiveTab('wallet');
    else if (p === '/admin/payouts' || p.startsWith('/admin/payouts')) setActiveTab('payouts');
    else if (p === '/admin/gateways' || p.startsWith('/admin/gateways')) setActiveTab('gateways');
    else if (p === '/admin/disputes' || p.startsWith('/admin/disputes') || p === '/admin/returns') setActiveTab('returns');
    else if (p === '/admin/tickets' || p.startsWith('/admin/tickets')) setActiveTab('tickets');
    else if (p === '/admin/rbac' || p.startsWith('/admin/rbac')) setActiveTab('rbac');
    else if (p === '/admin/agent' || p.startsWith('/admin/agent')) setActiveTab('agent');
    else if (p === '/admin/seo' || p.startsWith('/admin/seo')) setActiveTab('seo');
    else if (p === '/admin/ads' || p.startsWith('/admin/ads')) setActiveTab('ads');
    else if (p === '/admin/audit' || p.startsWith('/admin/audit')) setActiveTab('audit');
    else if (p === '/admin') setActiveTab('dashboard');
    else if (initialTab) setActiveTab(initialTab);
  }, [location.pathname, initialTab]);

  const syncSeoState = (overview: any) => {
    if (overview?.seoSettings) {
      setSeoSiteTitle(overview.seoSettings.siteTitle || '');
      setSeoSiteDescription(overview.seoSettings.siteDescription || '');
      setSeoCanonicalBase(overview.seoSettings.canonicalBaseUrl || 'https://platform.com');
      setSeoRobotsDirectives(overview.seoSettings.robotsTxtDirectives || '');
      setSeoSitemapEnabled(Boolean(overview.seoSettings.sitemapEnabled));
      setSeoNoindexPrivate(Boolean(overview.seoSettings.noindexPrivatePages));
      setSeoGoogleVerify(overview.seoSettings.googleVerificationCode || '');
      setSeoBingVerify(overview.seoSettings.bingVerificationCode || '');
    }
  };

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/overview');
      const json = await res.json();
      setData(json);
      syncSeoState(json);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  const handleConfirmSensitiveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModal) return;
    setSubmittingAction(true);
    setErrorBanner('');
    try {
      if (confirmModal.actionType === 'approve_kyc' || confirmModal.actionType === 'reject_kyc') {
        const res = await authFetch('/api/admin/kyc/review', {
          method: 'POST',
          body: JSON.stringify({
            storeId: confirmModal.storeId,
            status: confirmModal.actionType === 'approve_kyc' ? 'Approved' : 'Rejected',
            reason: confirmReason,
          }),
        });
        const result = await res.json();
        if (res.ok) {
          await loadAdminOverview();
          setBanner(
            `Merchant KYC decision "${result.finalStatus}" recorded with audit reasoning.`
          );
          setConfirmModal(null);
        } else {
          setErrorBanner(result.error || 'KYC review failed');
        }
      } else {
        const res = await authFetch('/api/admin/action', {
          method: 'POST',
          body: JSON.stringify({
            actionType: confirmModal.actionType,
            storeId: confirmModal.storeId,
            payoutId: confirmModal.payoutId,
            reason: confirmReason,
          }),
        });
        const updated = await res.json();
        if (res.ok) {
          setData(updated);
          setBanner(
            `Admin action "${confirmModal.title}" executed and recorded in the immutable Audit Trail.`
          );
          setConfirmModal(null);
        } else {
          setErrorBanner(updated.error || 'Action failed');
        }
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAdminTicketReply = async (ticketId: number, nextStatus?: string) => {
    setErrorBanner('');
    const msg = adminReplyText[ticketId] || '';
    const isInternal = Boolean(internalNoteMode[ticketId]);
    const res = await authFetch(`/api/support/tickets/${ticketId}/reply`, {
      method: 'POST',
      body: JSON.stringify({
        actorRole: 'admin',
        message: msg,
        nextStatus,
        isInternalNote: isInternal,
      }),
    });
    const updated = await res.json();
    if (res.ok) {
      setData(updated);
      setAdminReplyText((prev) => ({ ...prev, [ticketId]: '' }));
      setBanner(
        isInternal
          ? 'Internal admin note attached to support ticket.'
          : 'Support ticket updated and reply dispatched.'
      );
    } else {
      setErrorBanner(updated.error || 'Failed to update ticket');
    }
  };

  const handleRunAgentTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningAgent(true);
    setErrorBanner('');
    setBanner('');
    try {
      const res = await authFetch('/api/admin/agent/run', {
        method: 'POST',
        body: JSON.stringify({
          moduleName: agentModule,
          mode: agentMode,
          customPrompt: agentPrompt,
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Agent execution failed');
      setData(updated);
      setBanner(
        agentMode === 'read_only'
          ? `Co-Worker Agent completed Read-Only diagnostic on ${agentModule}.`
          : `Co-Worker Agent queued a diff proposal for ${agentModule} — awaiting human Admin approval.`
      );
    } catch (err: any) {
      setErrorBanner(err.message);
    } finally {
      setRunningAgent(false);
    }
  };

  const handleAgentDecision = async (
    actionId: number,
    decision: 'approve' | 'reject' | 'rollback'
  ) => {
    setErrorBanner('');
    const res = await authFetch(`/api/admin/agent/actions/${actionId}`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
    const updated = await res.json();
    if (res.ok) {
      setData(updated);
      setBanner(`Co-Worker Agent proposal ${decision.toUpperCase()}D and logged in Audit Trail.`);
    } else {
      setErrorBanner(updated.error || 'Failed to process agent decision');
    }
  };

  const handleToggleKillSwitch = async (disable: boolean) => {
    setErrorBanner('');
    const res = await authFetch('/api/admin/agent/kill-switch', {
      method: 'POST',
      body: JSON.stringify({ disable }),
    });
    const updated = await res.json();
    if (res.ok) {
      setData(updated);
      setBanner(
        disable
          ? 'EMERGENCY DISABLE SWITCH ACTIVATED: All Co-Worker Agent operations halted.'
          : 'Co-Worker Agent re-enabled in default Read-Only mode.'
      );
    }
  };

  const handleSaveGlobalSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner('');
    const res = await authFetch('/api/admin/seo', {
      method: 'PUT',
      body: JSON.stringify({
        siteTitle: seoSiteTitle,
        siteDescription: seoSiteDescription,
        canonicalBaseUrl: seoCanonicalBase,
        robotsTxtDirectives: seoRobotsDirectives,
        sitemapEnabled: seoSitemapEnabled,
        noindexPrivatePages: seoNoindexPrivate,
        googleVerificationCode: seoGoogleVerify,
        bingVerificationCode: seoBingVerify,
      }),
    });
    const updated = await res.json();
    if (res.ok) {
      setData(updated);
      setBanner('Global SEO, robots.txt, and sitemap settings updated.');
    } else {
      setErrorBanner(updated.error || 'Failed to save SEO settings');
    }
  };

  const handleUpdateAdProvider = async (provider: any, overrides: Partial<any>) => {
    setErrorBanner('');
    const res = await authFetch('/api/admin/ads', {
      method: 'PUT',
      body: JSON.stringify({
        providerKey: provider.providerKey,
        enabled: overrides.enabled ?? provider.enabled,
        testMode: overrides.testMode ?? provider.testMode,
        consentRequired: overrides.consentRequired ?? provider.consentRequired,
        publicAccountId: overrides.publicAccountId ?? provider.publicAccountId,
        conversionLabel: overrides.conversionLabel ?? provider.conversionLabel,
        adsTxtContent: overrides.adsTxtContent ?? provider.adsTxtContent,
      }),
    });
    const updated = await res.json();
    if (res.ok) {
      setData(updated);
      setBanner(`Updated ${provider.displayName} configuration.`);
    } else {
      setErrorBanner(updated.error || 'Failed to update ad provider');
    }
  };

  const handleAdminLoginFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoggingIn(true);
    try {
      await loginAdminWith2FA({
        usernameOrEmail: adminLoginUser,
        password: adminLoginPassword,
        twoFactorCode: adminLogin2fa,
      });
      setBanner('Multi-Factor Authentication verified. Access granted to Governance Console.');
      await loadAdminOverview();
    } catch (err: any) {
      setAdminLoginError(err.message || 'Admin 2FA authentication failed.');
    } finally {
      setAdminLoggingIn(false);
    }
  };

  const handleTogglePlatformGateway = async (gw: any) => {
    setGwUpdating(true);
    try {
      const res = await authFetch('/api/admin/payment-gateways', {
        method: 'PUT',
        body: JSON.stringify({
          gatewayKey: gw.gatewayKey,
          enabled: !gw.enabled,
          environment: gw.environment || 'sandbox',
          keyId: gw.keyId || '',
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to update gateway');
      setData(updated);
      setBanner(`Platform gateway ${gw.displayName || gw.gatewayKey.toUpperCase()} status updated.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update gateway.');
    } finally {
      setGwUpdating(false);
    }
  };

  const handleSavePlatformGateway = async (gatewayKey: string) => {
    setGwUpdating(true);
    try {
      const res = await authFetch('/api/admin/payment-gateways', {
        method: 'PUT',
        body: JSON.stringify({
          gatewayKey,
          enabled: true,
          environment: gwFormData.environment,
          keyId: gwFormData.keyId.trim(),
          keySecret: gwFormData.keySecret.trim(),
          webhookSecret: gwFormData.webhookSecret.trim(),
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to save gateway credentials');
      setData(updated);
      setEditingGwKey(null);
      setBanner(`Credentials for ${gatewayKey.toUpperCase()} encrypted with AES-256-GCM and saved.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to save gateway credentials.');
    } finally {
      setGwUpdating(false);
    }
  };

  const handleTestPlatformGateway = async (gatewayKey: string) => {
    try {
      setGwTestFeedback((prev) => ({
        ...prev,
        [gatewayKey]: 'Testing remote connection...',
      }));
      const res = await authFetch('/api/admin/payment-gateways/test', {
        method: 'POST',
        body: JSON.stringify({ gatewayKey }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gateway test failed');
      setGwTestFeedback((prev) => ({
        ...prev,
        [gatewayKey]: result.message || 'Remote handshake nominal.',
      }));
      setBanner(`Remote connection verified for ${gatewayKey.toUpperCase()}. Audit log recorded.`);
    } catch (err: any) {
      setGwTestFeedback((prev) => ({
        ...prev,
        [gatewayKey]: `Error: ${err.message || 'Remote connection test failed.'}`,
      }));
      setErrorBanner(`Connection test failed: ${err.message}`);
    }
  };

  // Non-negotiable N001 & Task 4: Protected views must immediately trigger a hard redirect to /login
  if (!session || session.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading RBAC + 2FA Admin Governance Console (15 Modules)...
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const sellers = data?.sellers || [];
  const products = data?.products || [];
  const orders = data?.orders || [];
  const payments = data?.payments || [];
  const payouts = data?.payouts || [];
  const returns = data?.returns || [];
  const supportTickets = data?.supportTickets || [];
  const roles = data?.roles || [];
  const permissions = data?.permissions || [];
  const agentActions = data?.agentActions || [];
  const agentStatus = data?.agentStatus || {};
  const adIntegrations = data?.adIntegrations || [];
  const ledger = data?.ledger || [];
  const auditLogs = data?.auditLogs || [];

  const isKycPending = (k?: string) => !k || k === 'Pending Review' || k === 'Pending_Review';
  const isKycVerified = (k?: string) => k === 'Verified' || k === 'Approved';
  const isKycRejected = (k?: string) => k === 'Rejected';

  const pendingKycCount = sellers.filter(
    (s: any) => isKycPending(s.profile?.kycStatus)
  ).length;

  const handleTabClick = (tabId: AdminTabId) => {
    setActiveTab(tabId);
    const routeMap: Record<AdminTabId, string> = {
      dashboard: '/admin',
      sellers: '/admin/sellers',
      kyc: '/admin/kyc',
      stores: '/admin/stores',
      products: '/admin/products',
      orders: '/admin/orders',
      wallet: '/admin/wallet',
      payouts: '/admin/payouts',
      gateways: '/admin/gateways',
      returns: '/admin/disputes',
      tickets: '/admin/tickets',
      rbac: '/admin/rbac',
      agent: '/admin/agent',
      seo: '/admin/seo',
      ads: '/admin/ads',
      audit: '/admin/audit',
    };
    const target = routeMap[tabId] || '/admin';
    if (location.pathname !== target) {
      navigate(target);
    }
  };

  const navLinks: { id: AdminTabId; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: '1. Overview Dashboard', icon: LayoutDashboard },
    { id: 'sellers', label: '2. Seller Accounts', icon: Users },
    { id: 'kyc', label: '3. KYC Review Queue', icon: ShieldCheck, badge: pendingKycCount },
    { id: 'stores', label: '4. Stores & Slugs', icon: Store },
    { id: 'products', label: '5. Products (≥4 Photos)', icon: Package },
    { id: 'orders', label: '6. Orders & Payments', icon: ShoppingBag },
    { id: 'wallet', label: '7. Wallet & Ledger', icon: WalletIcon },
    { id: 'payouts', label: '8. Payouts & Holds', icon: Landmark },
    { id: 'gateways', label: '9. Payment Gateways & Rails', icon: CreditCard },
    {
      id: 'returns',
      label: '10. Returns & Disputes',
      icon: RotateCcw,
      badge: metrics.openReturnsCount,
    },
    {
      id: 'tickets',
      label: '11. Support Tickets',
      icon: LifeBuoy,
      badge: metrics.unresolvedTicketsCount,
    },
    { id: 'rbac', label: '12. Roles & Permissions', icon: KeyRound },
    {
      id: 'agent',
      label: '13. Co-Worker Agent',
      icon: Bot,
      badge: metrics.pendingAgentApprovalsCount,
    },
    { id: 'seo', label: '14. SEO Control Panel', icon: Globe },
    { id: 'ads', label: '15. Ads & Analytics', icon: Megaphone },
    { id: 'audit', label: '16. Immutable Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex">
      {/* Left Admin Sidebar (16 Specification v2.0 Modules) */}
      <aside className="w-64 bg-[#111827] text-white hidden lg:flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
            <span className="font-display font-bold text-base">Admin Governance</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">2FA + RBAC</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] bg-amber-500/20 text-amber-300">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2 text-xs">
          <Link
            to="/app/dashboard"
            className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 rounded-[8px] text-gray-200 flex items-center justify-between"
          >
            <span>Seller Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/"
            className="w-full py-2 px-3 text-gray-400 hover:text-white flex items-center justify-between"
          >
            <span>Public Platform Home</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
              <span className="font-semibold text-[#111827]">
                Platform Governance & Security Console (15 Modules)
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-slate-100 border border-slate-200 text-[11px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[#374151]">{session?.displayName || 'Root Admin'}</span>
              <span className="text-[#9CA3AF]">· 2FA Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter sellers, orders, SKUs..."
              className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs w-44 sm:w-60"
            />
            <button
              type="button"
              onClick={() => signOutUser()}
              title="Sign Out of Admin Console"
              className="px-2.5 py-1.5 rounded-[8px] bg-red-50 hover:bg-red-100 text-[#DC2626] text-xs font-semibold flex items-center gap-1 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
          {navLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap ${
                activeTab === item.id ? 'bg-[#2563EB] text-white' : 'bg-[#F8FAFC] text-[#6B7280]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="p-6 lg:p-8 max-w-[1320px] w-full mx-auto space-y-6">
          {banner && (
            <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs font-medium text-[#111827] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A]" />
                <span>{banner}</span>
              </div>
              <button type="button" onClick={() => setBanner('')}>
                ✕
              </button>
            </div>
          )}

          {errorBanner && (
            <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 text-xs font-medium text-[#DC2626] flex items-center justify-between">
              <span>{errorBanner}</span>
              <button type="button" onClick={() => setErrorBanner('')}>
                ✕
              </button>
            </div>
          )}

          {/* Top Global Financial & Operational KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4">
              <div className="text-[11px] text-[#6B7280]">Gross Platform GMV</div>
              <div className="font-mono text-lg font-bold text-[#111827] mt-1">
                ₹{Number(metrics.totalGmv || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4">
              <div className="text-[11px] text-[#6B7280]">10% Platform Fee Revenue</div>
              <div className="font-mono text-lg font-bold text-[#2563EB] mt-1">
                ₹{Number(metrics.platformRevenue || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4">
              <div className="text-[11px] text-[#6B7280]">Active / Total Stores</div>
              <div className="font-mono text-lg font-bold text-[#16A34A] mt-1">
                {metrics.activeSellers} / {metrics.totalSellers}
              </div>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4">
              <div className="text-[11px] text-[#6B7280]">Eligible Payout Pool</div>
              <div className="font-mono text-lg font-bold text-[#111827] mt-1">
                ₹{Number(metrics.pendingPayoutTotal || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4">
              <div className="text-[11px] text-[#6B7280]">Held Reserve / Disputed</div>
              <div className="font-mono text-lg font-bold text-[#D97706] mt-1">
                ₹{Number(metrics.heldFundsTotal || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-4">
              <div className="text-[11px] text-[#6B7280]">Open Tickets / AI Proposals</div>
              <div className="font-mono text-lg font-bold text-[#2563EB] mt-1">
                {metrics.unresolvedTicketsCount || 0} / {metrics.pendingAgentApprovalsCount || 0}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* MODULE 1: PLATFORM OVERVIEW DASHBOARD                          */}
          {/* ============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6B7280]">Seller Accounts</span>
                      <Users className="w-4 h-4 text-[#2563EB]" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#111827] mt-2">
                      {sellers.length}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      {sellers.filter((s: any) => s.store?.status === 'active').length} active stores ·{' '}
                      {sellers.filter((s: any) => s.store?.status === 'suspended').length} suspended
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabClick('sellers')}
                    className="mt-4 text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 pt-2 border-t border-[#F1F5F9]"
                  >
                    <span>Manage Seller Accounts</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6B7280]">KYC Compliance Queue</span>
                      <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#D97706] mt-2">
                      {pendingKycCount}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      {pendingKycCount > 0
                        ? `${pendingKycCount} pending administrative identity reviews`
                        : 'All seller compliance reviews up to date'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabClick('kyc')}
                    className="mt-4 text-xs font-semibold text-[#D97706] hover:underline flex items-center gap-1 pt-2 border-t border-[#F1F5F9]"
                  >
                    <span>Open KYC Verification Queue</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#6B7280]">Storefront Slugs & URLs</span>
                      <Store className="w-4 h-4 text-[#16A34A]" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#16A34A] mt-2">
                      {sellers.filter((s: any) => s.store?.isPublished).length} / {sellers.length}
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Live published storefronts across platform
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabClick('stores')}
                    className="mt-4 text-xs font-semibold text-[#16A34A] hover:underline flex items-center gap-1 pt-2 border-t border-[#F1F5F9]"
                  >
                    <span>View Store Links & Visibility</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recent Activity & Core Operations Overview */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E7EB]">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#111827]">
                      Platform Operations & Settlement Health
                    </h2>
                    <p className="text-xs text-[#6B7280]">
                      System-wide status of seller earnings, collection gateway rails, and governance events.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTabClick('wallet')}
                      className="px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] text-xs font-semibold hover:bg-[#F8FAFC]"
                    >
                      Ledger & Wallets
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTabClick('gateways')}
                      className="px-3 py-1.5 rounded-[6px] bg-[#2563EB] text-white text-xs font-semibold hover:bg-blue-700"
                    >
                      Gateway Rails
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-[#F8FAFC] rounded-[8px] border border-[#E5E7EB]">
                    <div className="text-[#6B7280]">Total Orders Processed</div>
                    <div className="text-base font-bold font-mono text-[#111827] mt-1">{orders.length}</div>
                  </div>
                  <div className="p-3.5 bg-[#F8FAFC] rounded-[8px] border border-[#E5E7EB]">
                    <div className="text-[#6B7280]">Settled Payouts</div>
                    <div className="text-base font-bold font-mono text-[#16A34A] mt-1">
                      ₹{Number(metrics.paidOutTotal || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3.5 bg-[#F8FAFC] rounded-[8px] border border-[#E5E7EB]">
                    <div className="text-[#6B7280]">Open Returns & Disputes</div>
                    <div className="text-base font-bold font-mono text-[#DC2626] mt-1">
                      {returns.filter((r: any) => r.status === 'Return Requested').length}
                    </div>
                  </div>
                  <div className="p-3.5 bg-[#F8FAFC] rounded-[8px] border border-[#E5E7EB]">
                    <div className="text-[#6B7280]">Audit Trail Records</div>
                    <div className="text-base font-bold font-mono text-[#111827] mt-1">{auditLogs.length}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 2: SELLERS PAGE (Spec v2.0 Section 10)                  */}
          {/* ============================================================== */}
          {activeTab === 'sellers' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#2563EB]" />
                    <h2 className="font-display text-base font-bold text-[#111827]">
                      Seller Accounts Management
                    </h2>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Direct seller accounts registry. Tracks owner identity, verified email status, business name, registration timestamp, account state, and lifecycle controls.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B7280]">State Filter:</span>
                  <div className="inline-flex rounded-[8px] border border-[#E5E7EB] p-0.5 bg-[#F8FAFC] text-xs">
                    <button
                      type="button"
                      onClick={() => setSellerStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        sellerStatusFilter === 'all'
                          ? 'bg-white shadow-xs text-[#111827]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      All ({sellers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellerStatusFilter('active')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        sellerStatusFilter === 'active'
                          ? 'bg-white shadow-xs text-[#16A34A]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      Active ({sellers.filter((s: any) => s.store.status === 'active').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSellerStatusFilter('suspended')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        sellerStatusFilter === 'suspended'
                          ? 'bg-white shadow-xs text-[#DC2626]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      Suspended ({sellers.filter((s: any) => s.store.status === 'suspended').length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                      <th className="py-3.5 px-4 font-semibold">Seller & Owner</th>
                      <th className="py-3.5 px-4 font-semibold">Business Name & Plan</th>
                      <th className="py-3.5 px-4 font-semibold">Signed-Up Date</th>
                      <th className="py-3.5 px-4 font-semibold">Email & OTP Status</th>
                      <th className="py-3.5 px-4 font-semibold">Current Account State</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Lifecycle Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {sellers
                      .filter((s: any) => {
                        const matchesSearch =
                          !searchTerm ||
                          s.store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.store.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.profile?.businessName &&
                            s.profile.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.user?.email && s.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (s.user?.fullName && s.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
                        const matchesFilter =
                          sellerStatusFilter === 'all' || s.store.status === sellerStatusFilter;
                        return matchesSearch && matchesFilter;
                      })
                      .map((item: any) => {
                        const st = item.store;
                        const prof = item.profile || {};
                        const usr = item.user || {};
                        const wal = item.wallet || {};
                        const signedUp = usr.createdAt || prof.createdAt || st.createdAt;
                        return (
                          <tr key={st.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#111827]">
                                {usr.fullName || st.name}
                              </div>
                              <div className="text-[11px] text-[#6B7280]">
                                {usr.email || st.contactEmail || 'No email registered'}
                              </div>
                              <div className="font-mono text-[10px] text-[#9CA3AF] mt-0.5">
                                UID: {st.uid}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#111827]">
                                {prof.businessName || st.name}
                              </div>
                              <div className="text-[11px] text-[#4B5563]">
                                Plan: <span className="font-medium text-[#2563EB]">{prof.setupPlan || 'Standard'}</span> (₹{prof.setupFeeAmount || 1999})
                              </div>
                              <div className="font-mono text-[10px] text-[#6B7280] mt-0.5">
                                {prof.setupFeePaid ? (
                                  <span className="text-[#16A34A] font-semibold">Fee Paid</span>
                                ) : (
                                  <span className="text-[#D97706]">Fee Pending · {prof.setupPaymentRef || 'No Ref'}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[#4B5563]">
                              {signedUp ? new Date(signedUp).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }) : '—'}
                            </td>
                            <td className="py-3.5 px-4">
                              <div>
                                {prof.otpVerified ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                                    <CheckCircle className="w-3 h-3" />
                                    OTP Verified
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 font-semibold text-[11px]">
                                    <Clock className="w-3 h-3" />
                                    Pending Verification
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B7280] mt-1">
                                User Account: {usr.status || 'active'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    st.status === 'active' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                                  }`}
                                ></span>
                                <span
                                  className={`font-semibold capitalize ${
                                    st.status === 'active' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                                  }`}
                                >
                                  {st.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#6B7280] mt-0.5">
                                Wallet: {wal.isOnHold ? (
                                  <span className="text-[#D97706] font-semibold">On Hold</span>
                                ) : (
                                  <span className="text-[#16A34A]">Active</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    title:
                                      st.status === 'active'
                                        ? `Suspend Seller /${st.slug}`
                                        : `Reactivate Seller /${st.slug}`,
                                    actionType: 'toggle_store_suspension',
                                    storeId: st.id,
                                  })
                                }
                                className={`px-2.5 py-1.5 rounded-[6px] border text-xs font-semibold transition-colors ${
                                  st.status === 'active'
                                    ? 'border-[#E5E7EB] hover:border-[#DC2626] text-[#DC2626] hover:bg-rose-50'
                                    : 'border-emerald-300 text-[#16A34A] hover:bg-emerald-50'
                                }`}
                              >
                                {st.status === 'active' ? 'Suspend Store' : 'Reactivate'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    title: wal.isOnHold
                                      ? `Release Wallet Hold (/ ${st.slug})`
                                      : `Place Wallet Hold (/ ${st.slug})`,
                                    actionType: 'toggle_wallet_hold',
                                    storeId: st.id,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] hover:border-[#D97706] text-[#4B5563] hover:text-[#D97706] text-xs font-semibold"
                              >
                                {wal.isOnHold ? 'Release Hold' : 'Place Hold'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 3: KYC COMPLIANCE QUEUE (Spec v2.0 Section 10)          */}
          {/* ============================================================== */}
          {activeTab === 'kyc' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#D97706]" />
                    <h2 className="font-display text-base font-bold text-[#111827]">
                      KYC Compliance & Verification Queue
                    </h2>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Dedicated compliance queue for seller identity reviews. Defaults to 'Pending Review'. Only explicit authorized administrative review can mark Verified.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B7280]">Review Filter:</span>
                  <div className="inline-flex rounded-[8px] border border-[#E5E7EB] p-0.5 bg-[#F8FAFC] text-xs">
                    <button
                      type="button"
                      onClick={() => setKycStatusFilter('all')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        kycStatusFilter === 'all'
                          ? 'bg-white shadow-xs text-[#111827]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      All ({sellers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setKycStatusFilter('Pending Review')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        kycStatusFilter === 'Pending Review'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-[#D97706] hover:bg-amber-50'
                      }`}
                    >
                      Pending Review ({pendingKycCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setKycStatusFilter('Verified')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        kycStatusFilter === 'Verified'
                          ? 'bg-[#16A34A] text-white shadow-xs'
                          : 'text-[#16A34A] hover:bg-emerald-50'
                      }`}
                    >
                      Verified ({sellers.filter((s: any) => isKycVerified(s.profile?.kycStatus)).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setKycStatusFilter('Rejected')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        kycStatusFilter === 'Rejected'
                          ? 'bg-[#DC2626] text-white shadow-xs'
                          : 'text-[#DC2626] hover:bg-rose-50'
                      }`}
                    >
                      Rejected ({sellers.filter((s: any) => isKycRejected(s.profile?.kycStatus)).length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                      <th className="py-3.5 px-4 font-semibold">Seller & Store Entity</th>
                      <th className="py-3.5 px-4 font-semibold">Submitted Identity Records</th>
                      <th className="py-3.5 px-4 font-semibold">Timestamp Details</th>
                      <th className="py-3.5 px-4 font-semibold">Compliance Status & Notes</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Administrative Triggers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {sellers
                      .filter((s: any) => {
                        const rawStatus = s.profile?.kycStatus;
                        let matchesFilter = true;
                        if (kycStatusFilter === 'Pending Review') {
                          matchesFilter = isKycPending(rawStatus);
                        } else if (kycStatusFilter === 'Verified') {
                          matchesFilter = isKycVerified(rawStatus);
                        } else if (kycStatusFilter === 'Rejected') {
                          matchesFilter = isKycRejected(rawStatus);
                        }
                        const matchesSearch =
                          !searchTerm ||
                          s.store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.store.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.profile?.businessName &&
                            s.profile.businessName.toLowerCase().includes(searchTerm.toLowerCase()));
                        return matchesFilter && matchesSearch;
                      })
                      .map((item: any) => {
                        const st = item.store;
                        const prof = item.profile || {};
                        const pa = item.payoutAccount || {};
                        const currentKyc = prof.kycStatus;

                        return (
                          <tr key={st.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#111827]">{st.name}</div>
                              <div className="text-[11px] text-[#4B5563]">
                                Business: {prof.businessName || st.name}
                              </div>
                              <div className="font-mono text-[10px] text-[#9CA3AF] mt-0.5">
                                UID: {st.uid}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-[#111827]">
                                Entity Type: {prof.setupPlan || 'Sole Proprietorship'}
                              </div>
                              <div className="font-mono text-[11px] text-[#4B5563]">
                                Payout Link: {pa.method === 'upi' ? `UPI: ${pa.upiId}` : `${pa.bankName || 'Bank'} (${pa.maskedAccountNumber || 'Unlinked'})`}
                              </div>
                              <div className="text-[10px] text-[#6B7280] mt-0.5">
                                Onboarding Progress: Step {prof.onboardingStep || 8} of 8
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[#4B5563]">
                              <div>
                                Reg: {prof.createdAt ? new Date(prof.createdAt).toLocaleDateString('en-IN') : '—'}
                              </div>
                              <div className="text-[10px] text-[#9CA3AF]">
                                {prof.createdAt ? new Date(prof.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div>
                                {isKycVerified(currentKyc) && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-emerald-50 text-[#16A34A] font-bold text-xs border border-emerald-200">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Verified
                                  </span>
                                )}
                                {isKycPending(currentKyc) && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-amber-50 text-[#D97706] font-bold text-xs border border-amber-200">
                                    <Clock className="w-3.5 h-3.5" />
                                    Pending Review
                                  </span>
                                )}
                                {isKycRejected(currentKyc) && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-rose-50 text-[#DC2626] font-bold text-xs border border-rose-200">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Rejected
                                  </span>
                                )}
                              </div>
                              {prof.suspendedReason && (
                                <div className="text-[11px] text-[#DC2626] mt-1 bg-rose-50/50 p-1 rounded-[4px] border border-rose-100">
                                  Note: {prof.suspendedReason}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                              {!isKycVerified(currentKyc) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      title: `Approve KYC Verification (/ ${st.slug})`,
                                      actionType: 'approve_kyc',
                                      storeId: st.id,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-[6px] bg-[#16A34A] hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                                >
                                  Approve KYC
                                </button>
                              )}
                              {!isKycRejected(currentKyc) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      title: `Reject KYC Submission (/ ${st.slug})`,
                                      actionType: 'reject_kyc',
                                      storeId: st.id,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-[6px] border border-rose-200 hover:border-[#DC2626] text-[#DC2626] hover:bg-rose-50 text-xs font-semibold"
                                >
                                  Reject
                                </button>
                              )}
                              {isKycVerified(currentKyc) && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      title: `Request KYC Resubmission (/ ${st.slug})`,
                                      actionType: 'reject_kyc',
                                      storeId: st.id,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] hover:border-amber-400 text-[#4B5563] text-xs font-semibold"
                                >
                                  Request Re-Review
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 4: STORE LINKS & SLUG REGISTRY (Spec v2.0 Section 10)  */}
          {/* ============================================================== */}
          {activeTab === 'stores' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#16A34A]" />
                    <h2 className="font-display text-base font-bold text-[#111827]">
                      Store Slug Registry & Storefront Visibility
                    </h2>
                  </div>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Manages independent storefront shop names, canonical slugs, live storefront URLs, total catalog product count, and public visibility switches.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B7280]">Visibility:</span>
                  <div className="inline-flex rounded-[8px] border border-[#E5E7EB] p-0.5 bg-[#F8FAFC] text-xs">
                    <button
                      type="button"
                      onClick={() => setStoreVisibilityFilter('all')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        storeVisibilityFilter === 'all'
                          ? 'bg-white shadow-xs text-[#111827]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      All ({sellers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreVisibilityFilter('published')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        storeVisibilityFilter === 'published'
                          ? 'bg-white shadow-xs text-[#16A34A]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      Published ({sellers.filter((s: any) => s.store.isPublished).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStoreVisibilityFilter('unpublished')}
                      className={`px-2.5 py-1 rounded-[6px] font-semibold transition-colors ${
                        storeVisibilityFilter === 'unpublished'
                          ? 'bg-white shadow-xs text-[#D97706]'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      Draft / Hidden ({sellers.filter((s: any) => !s.store.isPublished).length})
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                      <th className="py-3.5 px-4 font-semibold">Independent Shop Name</th>
                      <th className="py-3.5 px-4 font-semibold">Active Store URL (StoreLink Layout)</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Total Catalog Count</th>
                      <th className="py-3.5 px-4 font-semibold">Visibility Switch</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Store Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {sellers
                      .filter((s: any) => {
                        const isPub = Boolean(s.store.isPublished);
                        const matchesVis =
                          storeVisibilityFilter === 'all' ||
                          (storeVisibilityFilter === 'published' && isPub) ||
                          (storeVisibilityFilter === 'unpublished' && !isPub);
                        const matchesSearch =
                          !searchTerm ||
                          s.store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.store.slug.toLowerCase().includes(searchTerm.toLowerCase());
                        return matchesVis && matchesSearch;
                      })
                      .map((item: any) => {
                        const st = item.store;
                        const isPub = Boolean(st.isPublished);
                        const storeProds = products.filter((p: any) => p.storeId === st.id);
                        const compliantProds = storeProds.filter((p: any) => (p.photoCount || 0) >= 4);

                        return (
                          <tr key={st.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#111827] text-sm">{st.name}</div>
                              {st.tagline && (
                                <div className="text-[11px] text-[#6B7280] italic mt-0.5 line-clamp-1">
                                  "{st.tagline}"
                                </div>
                              )}
                              <div className="font-mono text-[10px] text-[#6B7280] mt-1">
                                WhatsApp: {st.whatsappNumber || 'Not set'}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              {/* StoreLink module component layout */}
                              <div className="inline-flex items-center gap-2 p-2 rounded-[8px] bg-[#F1F5F9] border border-[#E2E8F0]">
                                <span className="font-mono font-medium text-[#2563EB]">
                                  platform.com/{st.slug}
                                </span>
                                <Link
                                  to={`/${st.slug}`}
                                  target="_blank"
                                  title="Open live storefront"
                                  className="p-1 rounded-[4px] hover:bg-white text-[#2563EB] transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fullUrl = `${window.location.origin}/${st.slug}`;
                                    navigator.clipboard.writeText(fullUrl);
                                    setCopiedSlug(st.slug);
                                    setTimeout(() => setCopiedSlug(null), 2000);
                                  }}
                                  title="Copy Store URL"
                                  className="p-1 rounded-[4px] hover:bg-white text-[#4B5563] hover:text-[#111827] transition-colors flex items-center gap-1"
                                >
                                  {copiedSlug === st.slug ? (
                                    <span className="text-[10px] font-semibold text-[#16A34A]">Copied!</span>
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <div className="text-[10px] text-[#6B7280] mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Unique Reserved Slug · DNS / Sitemap Active</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="font-mono text-base font-bold text-[#111827]">
                                {item.productCount || storeProds.length}
                              </div>
                              <div className="text-[10px] text-[#6B7280]">
                                {compliantProds.length}/{storeProds.length} photos compliant
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-[6px] font-bold text-xs border ${
                                    isPub
                                      ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                                      : 'bg-slate-100 text-[#6B7280] border-slate-200'
                                  }`}
                                >
                                  {isPub ? 'Published (Live)' : 'Draft (Hidden)'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmModal({
                                      open: true,
                                      title: isPub
                                        ? `Unpublish Storefront /${st.slug}`
                                        : `Publish Storefront /${st.slug}`,
                                      actionType: 'toggle_store_publish',
                                      storeId: st.id,
                                    })
                                  }
                                  className="px-2 py-1 rounded-[6px] border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[11px] font-semibold text-[#111827]"
                                >
                                  {isPub ? 'Unpublish' : 'Make Live'}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                              <Link
                                to={`/${st.slug}`}
                                target="_blank"
                                className="px-2.5 py-1.5 rounded-[6px] bg-[#2563EB] text-white font-semibold text-xs inline-flex items-center gap-1 shadow-xs"
                              >
                                <span>Preview</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    title:
                                      st.status === 'active'
                                        ? `Suspend Storefront /${st.slug}`
                                        : `Reactivate Storefront /${st.slug}`,
                                    actionType: 'toggle_store_suspension',
                                    storeId: st.id,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] hover:border-[#DC2626] text-[#DC2626] font-semibold text-xs hover:bg-rose-50"
                              >
                                {st.status === 'active' ? 'Suspend' : 'Reactivate'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 4: PRODUCTS CATALOGUE & 4-PHOTO COMPLIANCE              */}
          {/* ============================================================== */}
          {activeTab === 'products' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  Global Product Catalogue & 4-Photo Rule Compliance (Spec v2.0 Section 5)
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Verifies that every published product has ≥4 photos (≤1 MB each, 4:5 portrait) and
                  accurate +10% platform fee calculation.
                </p>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                    <th className="py-3.5 px-4 font-semibold">SKU & Title</th>
                    <th className="py-3.5 px-4 font-semibold">Category</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Seller Price</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Customer Price (+10%)</th>
                    <th className="py-3.5 px-4 font-semibold">Photo Compliance (≥4)</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {products.map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#111827]">{p.title}</div>
                        <div className="font-mono text-[11px] text-[#6B7280]">
                          {p.sku} · Crop: {p.imageCropPosition}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{p.category}</td>
                      <td className="py-3.5 px-4 font-mono text-right">
                        ₹{Number(p.sellerPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-right text-[#16A34A]">
                        ₹{Number(p.customerPrice).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={
                            p.photoCount >= 4
                              ? 'text-[#16A34A] font-semibold'
                              : 'text-[#D97706] font-semibold'
                          }
                        >
                          {p.photoCount} Photos · 4:5 Portrait
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 5: GLOBAL ORDERS & WEBHOOK PAYMENTS                     */}
          {/* ============================================================== */}
          {(activeTab === 'dashboard' || activeTab === 'orders') && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  Global Orders, Gateway Webhook Verification & Commercial Split
                </h2>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                    <th className="py-3.5 px-4 font-semibold">Order Ref</th>
                    <th className="py-3.5 px-4 font-semibold">Customer & WhatsApp Ref</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Seller Subtotal</th>
                    <th className="py-3.5 px-4 font-semibold text-right">10% Platform Fee</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Customer Total</th>
                    <th className="py-3.5 px-4 font-semibold">Order State</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {orders
                    .filter(
                      (o: any) =>
                        !searchTerm ||
                        o.orderRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((ord: any) => {
                      const pay = payments.find((p: any) => p.orderId === ord.id);
                      return (
                        <tr key={ord.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <div>{ord.orderRef}</div>
                            {pay?.webhookSignature && (
                              <div className="text-[10px] text-[#16A34A]">
                                HMAC: {pay.webhookSignature.slice(0, 16)}...
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#111827]">{ord.customerName}</div>
                            <div className="font-mono text-[11px] text-[#6B7280]">
                              {ord.whatsappEnquiryRef}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right text-[#16A34A]">
                            ₹{Number(ord.sellerSubtotal).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right text-[#2563EB]">
                            ₹{Number(ord.platformFeeTotal).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-right">
                            ₹{Number(ord.customerTotalPayable).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-semibold">{ord.orderState}</td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              to={`/checkout/${ord.orderRef}`}
                              className="text-[#2563EB] font-semibold hover:underline"
                            >
                              Checkout Link →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 6: APPEND-ONLY WALLET LEDGER                            */}
          {/* ============================================================== */}
          {activeTab === 'wallet' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  Global Append-Only Wallet Ledger
                </h2>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                    <th className="py-3.5 px-4 font-semibold">Transaction Ref</th>
                    <th className="py-3.5 px-4 font-semibold">Order / Payout Ref</th>
                    <th className="py-3.5 px-4 font-semibold">Type & Bucket</th>
                    <th className="py-3.5 px-4 font-semibold">Description</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {ledger.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-3.5 px-4 font-mono font-bold">{tx.transactionRef}</td>
                      <td className="py-3.5 px-4 font-mono text-[#2563EB]">{tx.orderRef}</td>
                      <td className="py-3.5 px-4 font-semibold">
                        {tx.type} ({tx.bucketAffected})
                      </td>
                      <td className="py-3.5 px-4 text-[#6B7280]">{tx.description}</td>
                      <td
                        className={`py-3.5 px-4 font-mono font-bold text-right ${
                          tx.direction === 'credit' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {tx.direction === 'credit' ? '+' : '-'}₹
                        {Number(tx.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 7: PAYOUTS & SETTLEMENT BATCHES                         */}
          {/* ============================================================== */}
          {activeTab === 'payouts' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  Weekly Payout Batches & Admin Approvals
                </h2>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                    <th className="py-3.5 px-4 font-semibold">Payout Ref</th>
                    <th className="py-3.5 px-4 font-semibold">Cycle</th>
                    <th className="py-3.5 px-4 font-semibold">Destination</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {payouts.map((po: any) => (
                    <tr key={po.id}>
                      <td className="py-3.5 px-4 font-mono font-bold">{po.payoutRef}</td>
                      <td className="py-3.5 px-4">{po.cycleLabel}</td>
                      <td className="py-3.5 px-4 font-mono">{po.destinationSummary}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-right">
                        ₹{Number(po.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#16A34A]">{po.status}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              title: `Re-Verify & Approve Payout ${po.payoutRef}`,
                              actionType: 'approve_payout',
                              storeId: po.storeId,
                              payoutId: po.id,
                            })
                          }
                          className="px-3 py-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[6px] font-semibold text-[#2563EB]"
                        >
                          Audit & Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 8: PAYMENT GATEWAYS & SETTLEMENT RAILS                  */}
          {/* ============================================================== */}
          {activeTab === 'gateways' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#111827] flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#2563EB]" />
                      <span>Platform Payment Rails & Gateway Governance</span>
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-1 max-w-2xl leading-relaxed">
                      Supervises server-authoritative checkout rails for all independent seller storefronts.
                      A standard 10% platform fee is deducted server-side before crediting seller wallet ledgers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-3 py-1.5 rounded-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                      Server Fee: 10% GMV
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-[#E5E7EB]">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]">
                    <div className="text-[11px] text-[#6B7280]">Settlement Protocol</div>
                    <div className="font-bold text-xs text-[#111827] mt-0.5">T+0 Internal Ledger</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]">
                    <div className="text-[11px] text-[#6B7280]">Webhook Security</div>
                    <div className="font-bold text-xs text-[#16A34A] mt-0.5">HMAC-SHA256 Verified</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]">
                    <div className="text-[11px] text-[#6B7280]">Default P2M Method</div>
                    <div className="font-bold text-xs text-[#2563EB] mt-0.5">UPI Intent + Cards</div>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]">
                    <div className="text-[11px] text-[#6B7280]">Auto Capture</div>
                    <div className="font-bold text-xs text-[#111827] mt-0.5">Enabled (Strict)</div>
                  </div>
                </div>
              </div>

              {/* Gateway Rails Listing */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-hidden">
                <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-[#111827]">
                    Configured Platform Payment Gateways
                  </h3>
                  <span className="text-xs text-[#6B7280]">
                    Fail-closed status check active
                  </span>
                </div>

                <div className="divide-y divide-[#E5E7EB]">
                  {(data?.paymentGateways || []).map((gw: any) => (
                    <div key={gw.gatewayKey || gw.id} className="p-5 flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-display font-bold text-sm text-[#111827]">
                              {gw.displayName || `${gw.gatewayKey.toUpperCase()} Gateway`}
                            </span>
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded-[4px] font-semibold ${
                                gw.enabled
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {gw.enabled ? 'ACTIVE' : 'DISABLED'}
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                              {gw.environment || 'sandbox'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[#4B5563]">
                            <span>Key ID: <strong className="text-[#111827]">{gw.maskedKeyId || gw.keyId || 'Not Configured'}</strong></span>
                            <span>•</span>
                            <span>Key Secret: <strong className="text-[#111827]">{gw.maskedKeySecret || '•••• ••••'}</strong></span>
                            <span>•</span>
                            <span>Webhook Secret: <strong className="text-[#111827]">{gw.maskedWebhookSecret || '•••• ••••'}</strong></span>
                          </div>
                          {gwTestFeedback[gw.gatewayKey] && (
                            <div
                              className={`text-[11px] font-semibold pt-1 ${
                                gwTestFeedback[gw.gatewayKey].startsWith('Error')
                                  ? 'text-red-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {gwTestFeedback[gw.gatewayKey].startsWith('Error') ? '✗ ' : '✓ '}
                              {gwTestFeedback[gw.gatewayKey]}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (editingGwKey === gw.gatewayKey) {
                                setEditingGwKey(null);
                              } else {
                                setEditingGwKey(gw.gatewayKey);
                                setGwFormData({
                                  keyId: gw.keyId || '',
                                  keySecret: '',
                                  webhookSecret: '',
                                  environment: gw.environment || 'sandbox',
                                });
                              }
                            }}
                            className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-slate-100 rounded-[8px] text-xs font-semibold text-[#111827]"
                          >
                            {editingGwKey === gw.gatewayKey ? 'Close' : 'Configure Secrets'}
                          </button>
                          <button
                            type="button"
                            disabled={gwUpdating}
                            onClick={() => handleTestPlatformGateway(gw.gatewayKey)}
                            className="px-3 py-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-[8px] text-xs font-semibold text-[#2563EB]"
                          >
                            Test Handshake
                          </button>
                          <button
                            type="button"
                            disabled={gwUpdating}
                            onClick={() => handleTogglePlatformGateway(gw)}
                            className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border ${
                              gw.enabled
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {gw.enabled ? 'Disable Rail' : 'Enable Rail'}
                          </button>
                        </div>
                      </div>

                      {editingGwKey === gw.gatewayKey && (
                        <div className="p-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] space-y-3 mt-1">
                          <div className="font-semibold text-xs text-[#111827]">
                            Configure {gw.displayName} Credentials (Encrypted via AES-256-GCM)
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[#6B7280] mb-1">Key ID / App ID</label>
                              <input
                                type="text"
                                value={gwFormData.keyId}
                                onChange={(e) => setGwFormData({ ...gwFormData, keyId: e.target.value })}
                                placeholder="rzp_test_..."
                                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[8px] font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[#6B7280] mb-1">Environment</label>
                              <select
                                value={gwFormData.environment}
                                onChange={(e) => setGwFormData({ ...gwFormData, environment: e.target.value as any })}
                                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-xs"
                              >
                                <option value="sandbox">Sandbox / Test Mode</option>
                                <option value="live">Production / Live Mode</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[#6B7280] mb-1">Key Secret (Encrypted)</label>
                              <input
                                type="password"
                                value={gwFormData.keySecret}
                                onChange={(e) => setGwFormData({ ...gwFormData, keySecret: e.target.value })}
                                placeholder="Enter new secret or leave blank to keep unchanged"
                                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[8px] font-mono text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[#6B7280] mb-1">Webhook Secret (HMAC SHA-256)</label>
                              <input
                                type="password"
                                value={gwFormData.webhookSecret}
                                onChange={(e) => setGwFormData({ ...gwFormData, webhookSecret: e.target.value })}
                                placeholder="Enter webhook secret or leave blank to keep unchanged"
                                className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[8px] font-mono text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingGwKey(null)}
                              className="px-3 py-1.5 rounded-[8px] text-xs font-semibold bg-white border border-[#E5E7EB] hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={gwUpdating}
                              onClick={() => handleSavePlatformGateway(gw.gatewayKey)}
                              className="px-4 py-1.5 rounded-[8px] text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                            >
                              {gwUpdating ? 'Saving...' : 'Save & Encrypt Keys'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 9: RETURNS & DISPUTES                                   */}
          {/* ============================================================== */}
          {activeTab === 'returns' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  Customer Returns, Exchanges & Wallet Exposure Holds
                </h2>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                    <th className="py-3.5 px-4 font-semibold">Return Ref</th>
                    <th className="py-3.5 px-4 font-semibold">Order Ref & Customer</th>
                    <th className="py-3.5 px-4 font-semibold">Resolution Type</th>
                    <th className="py-3.5 px-4 font-semibold">Reason</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Wallet Hold</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {returns.map((ret: any) => (
                    <tr key={ret.id}>
                      <td className="py-3.5 px-4 font-mono font-bold">{ret.returnRef}</td>
                      <td className="py-3.5 px-4">
                        {ret.orderRef} · {ret.customerName}
                      </td>
                      <td className="py-3.5 px-4 uppercase font-mono">{ret.resolutionType}</td>
                      <td className="py-3.5 px-4 text-[#6B7280]">{ret.reason}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-right text-[#D97706]">
                        ₹{Number(ret.holdAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{ret.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 9: SUPPORT TICKETS (BUYER->SELLER & SELLER->ADMIN)      */}
          {/* ============================================================== */}
          {activeTab === 'tickets' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  Unified Support Ticketing Queue (Specification v2.0 Section 8)
                </h2>
                <p className="text-[#6B7280]">
                  View both Seller-to-Admin operational tickets and Buyer-to-Seller store tickets,
                  add internal admin notes, update status, and send replies.
                </p>
              </div>

              {supportTickets.map((tkt: any) => (
                <div
                  key={tkt.id}
                  className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                    <div>
                      <span className="font-mono font-bold text-[#2563EB] mr-2">
                        {tkt.ticketRef}
                      </span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-[4px] bg-[#F8FAFC] border border-[#E5E7EB] mr-2">
                        {tkt.ticketScope}
                      </span>
                      <strong className="text-sm text-[#111827]">{tkt.subject}</strong>
                      <div className="text-[#6B7280] mt-1">
                        Requester: <strong>{tkt.requesterName}</strong> ({tkt.requesterContact}) ·
                        Category: {tkt.category} · Priority:{' '}
                        <strong className="text-[#D97706]">{tkt.priority}</strong>{' '}
                        {tkt.relatedRef ? `· Ref: ${tkt.relatedRef}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-bold px-2.5 py-1 rounded-[6px] bg-blue-50 text-[#2563EB]">
                        {tkt.status}
                      </span>
                      {['In Progress', 'Waiting for Customer', 'Resolved', 'Closed'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleAdminTicketReply(tkt.id, st)}
                          className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB] rounded-[6px] font-semibold"
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 bg-[#F8FAFC] p-4 rounded-[10px] border border-[#E5E7EB]">
                    {tkt.messages?.map((m: any) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-[6px] ${
                          m.isInternalNote ? 'bg-amber-50 border border-amber-200' : 'bg-white'
                        }`}
                      >
                        <div className="font-semibold text-[#111827]">
                          {m.senderName}{' '}
                          <span className="font-mono text-[10px] text-[#6B7280] uppercase">
                            [{m.senderRole}{m.isInternalNote ? ' · INTERNAL NOTE' : ''}]
                          </span>
                        </div>
                        <p className="text-[#6B7280] mt-0.5">{m.message}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <input
                      type="text"
                      value={adminReplyText[tkt.id] || ''}
                      onChange={(e) =>
                        setAdminReplyText((prev) => ({ ...prev, [tkt.id]: e.target.value }))
                      }
                      placeholder="Write admin response or internal compliance note..."
                      className="flex-1 w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    />
                    <label className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(internalNoteMode[tkt.id])}
                        onChange={(e) =>
                          setInternalNoteMode((prev) => ({
                            ...prev,
                            [tkt.id]: e.target.checked,
                          }))
                        }
                      />
                      <span>Internal Note Only</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAdminTicketReply(tkt.id, 'In Progress')}
                      className="px-4 py-2 bg-[#111827] text-white font-semibold rounded-[8px] whitespace-nowrap"
                    >
                      Post Reply / Note
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 10: ROLES & PERMISSIONS (4-ROLE RBAC MATRIX)            */}
          {/* ============================================================== */}
          {activeTab === 'rbac' && (
            <div className="space-y-6 text-xs">
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  4-Role RBAC Matrix (Specification v2.0 Section 1 & 2)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-sm font-display text-[#111827]">
                          {r.displayName}
                        </strong>
                        <span className="font-mono text-[#2563EB] uppercase">{r.roleKey}</span>
                      </div>
                      <p className="text-[#6B7280]">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
                <div className="p-5 border-b border-[#E5E7EB] font-display font-bold text-sm">
                  Granular Permission Keys & Guardrail Enforcement
                </div>
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Permission Key</th>
                      <th className="py-3 px-4 font-semibold">Scope</th>
                      <th className="py-3 px-4 font-semibold">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {permissions.map((perm: any) => (
                      <tr key={perm.id}>
                        <td className="py-3 px-4 font-mono font-bold uppercase text-[#2563EB]">
                          {perm.roleKey}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">{perm.permissionKey}</td>
                        <td className="py-3 px-4 font-mono text-[#6B7280]">{perm.scope}</td>
                        <td className="py-3 px-4 text-[#6B7280]">{perm.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 11: CO-WORKER AGENT CONTROL CENTER (SPEC V2.0 SEC 9)    */}
          {/* ============================================================== */}
          {activeTab === 'agent' && (
            <div className="space-y-6 text-xs">
              {/* Agent Status, Rate-Limit Telemetry & Emergency Kill Switch */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[#2563EB]" />
                    <h2 className="font-display text-lg font-bold text-[#111827]">
                      Co-Worker Agent ({agentStatus.agentIdentity || 'agent-ops-copilot'}) ·
                      Bounded Least-Privilege Assistant
                    </h2>
                  </div>
                  <p className="text-[#6B7280]">
                    Operates in <strong>Read-Only mode by default</strong>. Cannot execute direct
                    database writes, payouts, or account suspensions without human Admin approval.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-[#111827]">
                    <span>
                      Status:{' '}
                      <strong
                        className={
                          agentStatus.emergencyDisabled ? 'text-[#DC2626]' : 'text-[#16A34A]'
                        }
                      >
                        {agentStatus.emergencyDisabled
                          ? 'HALTED BY KILL SWITCH'
                          : 'ACTIVE (BOUNDED)'}
                      </strong>
                    </span>
                    <span>
                      Model: {agentStatus.rateLimitTelemetry?.lastModelUsed || 'gemini-3.8-flash'}
                    </span>
                    <span>
                      Bounded Queue Concurrency: 1 (Queue Depth:{' '}
                      {agentStatus.rateLimitTelemetry?.queueDepth || 0})
                    </span>
                    <span>
                      429 Backoff Retries: {agentStatus.rateLimitTelemetry?.rateLimitedRetries || 0}
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleToggleKillSwitch(!agentStatus.emergencyDisabled)}
                    className={`px-4 py-3 rounded-[10px] font-semibold flex items-center gap-2 whitespace-nowrap ${
                      agentStatus.emergencyDisabled
                        ? 'bg-[#16A34A] text-white'
                        : 'bg-[#DC2626] text-white'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>
                      {agentStatus.emergencyDisabled
                        ? 'Re-Enable Co-Worker Agent'
                        : 'Emergency Disable Kill Switch'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Run Bounded Agent Task Form */}
              <form
                onSubmit={handleRunAgentTask}
                className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4"
              >
                <div className="font-display font-bold text-sm text-[#111827]">
                  Dispatch Segmented Task to Co-Worker Agent (Rate-Limit Safe)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Segmented Module Target</label>
                    <select
                      value={agentModule}
                      onChange={(e) => setAgentModule(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    >
                      <option value="system_health">1. System Health & Webhook Audit</option>
                      <option value="support_tickets">2. Support Tickets Triage & Draft</option>
                      <option value="catalog_audit">3. Catalog & 4-Photo Compliance</option>
                      <option value="seo_audit">4. Storefront SEO & JSON-LD Audit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Execution Mode</label>
                    <select
                      value={agentMode}
                      onChange={(e) => setAgentMode(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    >
                      <option value="read_only">Read-Only Diagnostic (Default Allowlist)</option>
                      <option value="propose_change">
                        Propose Change with Before/After Diff (Requires Approval)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Optional Focus Instruction</label>
                    <input
                      type="text"
                      value={agentPrompt}
                      onChange={(e) => setAgentPrompt(e.target.value)}
                      placeholder="e.g., Check TKT-1041 or VLR-SLK-001 SEO"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={runningAgent || agentStatus.emergencyDisabled}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold rounded-[8px] flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {runningAgent
                      ? 'Running Bounded Agent Analysis...'
                      : 'Run Co-Worker Agent Task'}
                  </span>
                </button>
              </form>

              {/* Agent Approval Queue & Before/After Diff Previews */}
              <div className="space-y-4">
                {agentActions.map((act: any) => (
                  <div
                    key={act.id}
                    className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                      <div>
                        <span className="font-mono font-bold text-[#2563EB] mr-2">
                          {act.actionRef}
                        </span>
                        <span className="font-mono px-2 py-0.5 rounded-[4px] bg-[#F8FAFC] border border-[#E5E7EB] mr-2">
                          {act.moduleName}
                        </span>
                        <strong className="text-sm text-[#111827]">{act.summary}</strong>
                        <div className="text-[#6B7280] mt-1">
                          Reason: {act.reason} · Target: <span className="font-mono">{act.targetRef}</span> ·
                          Confidence: <strong className="text-[#16A34A]">{act.confidenceScore}%</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold px-2.5 py-1 rounded-[6px] bg-[#F8FAFC] border border-[#E5E7EB]">
                          {act.status}
                        </span>
                        {act.status === 'Pending Approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleAgentDecision(act.id, 'approve')}
                              className="px-3 py-1.5 bg-[#16A34A] text-white font-semibold rounded-[6px]"
                            >
                              Approve Diff
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAgentDecision(act.id, 'reject')}
                              className="px-3 py-1.5 bg-red-50 text-[#DC2626] border border-red-200 font-semibold rounded-[6px]"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {act.status === 'Approved & Applied' && (
                          <button
                            type="button"
                            onClick={() => handleAgentDecision(act.id, 'rollback')}
                            className="px-3 py-1.5 bg-amber-50 text-[#D97706] border border-amber-200 font-semibold rounded-[6px]"
                          >
                            Rollback Change
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
                      <div className="p-3 rounded-[8px] bg-red-50/50 border border-red-200">
                        <div className="font-bold text-[#DC2626] mb-1">— BEFORE STATE</div>
                        <pre className="whitespace-pre-wrap text-[#111827]">{act.beforeDiff}</pre>
                      </div>
                      <div className="p-3 rounded-[8px] bg-emerald-50/50 border border-emerald-200">
                        <div className="font-bold text-[#16A34A] mb-1">+ PROPOSED AFTER DIFF</div>
                        <pre className="whitespace-pre-wrap text-[#111827]">{act.afterDiff}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 12: SEO CONTROL PANEL (SPEC V2.0 SECTION 10)            */}
          {/* ============================================================== */}
          {activeTab === 'seo' && (
            <form
              onSubmit={handleSaveGlobalSeo}
              className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#111827]">
                    Platform SEO Control Panel, Sitemap & Robots.txt Directives
                  </h2>
                  <p className="text-[#6B7280]">
                    Manage crawlable public storefront indexing, structured data, and strict noindex
                    guards on private `/app`, `/admin`, and `/checkout` routes.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono font-semibold text-[#2563EB]"
                  >
                    View /robots.txt ↗
                  </a>
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono font-semibold text-[#2563EB]"
                  >
                    View /sitemap.xml ↗
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Global Platform SEO Title</label>
                  <input
                    type="text"
                    value={seoSiteTitle}
                    onChange={(e) => setSeoSiteTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Canonical Base URL</label>
                  <input
                    type="text"
                    value={seoCanonicalBase}
                    onChange={(e) => setSeoCanonicalBase(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Global Meta Description</label>
                  <input
                    type="text"
                    value={seoSiteDescription}
                    onChange={(e) => setSeoSiteDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Google Search Console Verification Tag
                  </label>
                  <input
                    type="text"
                    value={seoGoogleVerify}
                    onChange={(e) => setSeoGoogleVerify(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Bing Webmaster Verification Tag</label>
                  <input
                    type="text"
                    value={seoBingVerify}
                    onChange={(e) => setSeoBingVerify(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">robots.txt Directives</label>
                  <textarea
                    rows={4}
                    value={seoRobotsDirectives}
                    onChange={(e) => setSeoRobotsDirectives(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E7EB]">
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={seoSitemapEnabled}
                      onChange={(e) => setSeoSitemapEnabled(e.target.checked)}
                    />
                    <span>Dynamic XML Sitemap Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 font-semibold">
                    <input
                      type="checkbox"
                      checked={seoNoindexPrivate}
                      onChange={(e) => setSeoNoindexPrivate(e.target.checked)}
                    />
                    <span>Enforce noindex on /app, /admin, /checkout</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2563EB] text-white font-semibold rounded-[8px]"
                >
                  Save Global SEO Configuration
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* MODULE 13: ADS & ANALYTICS SETTINGS (SPEC V2.0 SECTION 11)     */}
          {/* ============================================================== */}
          {activeTab === 'ads' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#111827]">
                    Ads, Analytics & Attribution Architecture (Specification v2.0 Section 11)
                  </h2>
                  <p className="text-[#6B7280]">
                    Configure Google Ads/GA4, AdSense (`ads.txt`), Google Ad Manager, and Meta Pixel +
                    CAPI. Server secrets are stored strictly server-side.
                  </p>
                </div>
                <a
                  href="/ads.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono font-semibold text-[#2563EB]"
                >
                  View /ads.txt ↗
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {adIntegrations.map((ad: any) => (
                  <div
                    key={ad.id}
                    className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <div>
                        <strong className="font-display text-sm text-[#111827]">
                          {ad.displayName}
                        </strong>
                        <div className="font-mono text-[11px] text-[#2563EB]">
                          {ad.verificationStatus}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateAdProvider(ad, { enabled: !ad.enabled })}
                        className={`px-3 py-1.5 rounded-[6px] font-semibold ${
                          ad.enabled ? 'bg-[#16A34A] text-white' : 'bg-[#F8FAFC] border border-[#E5E7EB]'
                        }`}
                      >
                        {ad.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="block font-semibold">Public Account / Pixel / Slot ID</label>
                      <input
                        type="text"
                        defaultValue={ad.publicAccountId}
                        onBlur={(e) =>
                          handleUpdateAdProvider(ad, { publicAccountId: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                      />
                    </div>

                    {ad.providerKey === 'google_adsense' && (
                      <div className="space-y-1.5">
                        <label className="block font-semibold">ads.txt Publisher Record</label>
                        <textarea
                          rows={2}
                          defaultValue={ad.adsTxtContent}
                          onBlur={(e) =>
                            handleUpdateAdProvider(ad, { adsTxtContent: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 text-[11px] text-[#6B7280]">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(ad.testMode)}
                          onChange={(e) =>
                            handleUpdateAdProvider(ad, { testMode: e.target.checked })
                          }
                        />
                        <span>Safe Test Mode</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(ad.consentRequired)}
                          onChange={(e) =>
                            handleUpdateAdProvider(ad, { consentRequired: e.target.checked })
                          }
                        />
                        <span>Consent-Mode Gate Required</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODULE 14: IMMUTABLE AUDIT TRAIL                               */}
          {/* ============================================================== */}
          {(activeTab === 'dashboard' || activeTab === 'audit') && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
              <div className="p-5 border-b border-[#E5E7EB]">
                <h2 className="font-display text-base font-bold text-[#111827]">
                  Immutable Platform Audit Log (Logins, OTPs, Webhooks, Bank Changes, Agent Actions)
                </h2>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                    <th className="py-3.5 px-4 font-semibold">Actor & Role</th>
                    <th className="py-3.5 px-4 font-semibold">Action Type</th>
                    <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                    <th className="py-3.5 px-4 font-semibold">Audit Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {auditLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-mono">
                        <strong className="text-[#111827]">{log.actorUid}</strong> ·{' '}
                        <span className="uppercase text-[#2563EB]">{log.actorRole}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#111827]">
                        {log.actionType}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#6B7280]">
                        {log.targetEntity}: {log.targetRef}
                      </td>
                      <td className="py-3.5 px-4 text-[#6B7280]">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Explicit Confirmation Modal for Sensitive Admin Actions */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmSensitiveAction}
            className="bg-white border border-[#E5E7EB] rounded-[18px] max-w-md w-full p-6 space-y-5 shadow-xl"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[#D97706]">
              <AlertTriangle className="w-4 h-4" />
              <span>Sensitive Governance Action Confirmation</span>
            </div>
            <h3 className="font-display text-lg font-bold text-[#111827]">{confirmModal.title}</h3>
            <p className="text-xs text-[#6B7280]">
              This action will immediately update tenant state and record an immutable entry in the
              Platform Audit Log.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Mandatory Audit Reason / Compliance Reference *
              </label>
              <textarea
                rows={2}
                required
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-[#E5E7EB] rounded-[8px] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingAction}
                className="px-4 py-2 bg-[#111827] text-white rounded-[8px] text-xs font-semibold"
              >
                {submittingAction ? 'Recording Audit Log...' : 'Confirm & Execute'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
