import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

type AdminTabId =
  | 'dashboard'
  | 'sellers'
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

export default function AdminConsolePage() {
  const location = useLocation();
  const { session, signOutUser, loginAdminWith2FA, authFetch } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [banner, setBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Admin 2FA In-Page Authentication Gate state
  const [adminLoginUser, setAdminLoginUser] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [adminLogin2fa, setAdminLogin2fa] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');

  // Payment Gateways management state
  const [gwUpdating, setGwUpdating] = useState(false);
  const [gwTestFeedback, setGwTestFeedback] = useState<Record<string, string>>({});

  // Confirmation modal state for sensitive admin actions
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    actionType:
      | 'toggle_store_suspension'
      | 'toggle_wallet_hold'
      | 'approve_payout'
      | 'verify_payout_account';
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

  useEffect(() => {
    const p = location.pathname;
    if (p.includes('/admin/sellers')) setActiveTab('sellers');
    else if (p.includes('/admin/orders')) setActiveTab('orders');
    else if (p.includes('/admin/payouts')) setActiveTab('payouts');
    else if (p.includes('/admin/gateways')) setActiveTab('gateways');
    else if (p.includes('/admin/audit')) setActiveTab('audit');
  }, [location.pathname]);

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

  const handleTogglePlatformGateway = async (gatewayKey: string, currentEnabled: boolean) => {
    setGwUpdating(true);
    try {
      const res = await authFetch('/api/admin/payment-gateways', {
        method: 'PUT',
        body: JSON.stringify({
          gatewayKey,
          enabled: !currentEnabled,
          environment: 'sandbox',
          keyId: 'pl_admin_default',
        }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Failed to update gateway');
      setData(updated);
      setBanner(`Platform gateway ${gatewayKey.toUpperCase()} status updated.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to update gateway.');
    } finally {
      setGwUpdating(false);
    }
  };

  const handleTestPlatformGateway = async (gatewayKey: string) => {
    try {
      const res = await authFetch('/api/admin/payment-gateways/test', {
        method: 'POST',
        body: JSON.stringify({ gatewayKey }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gateway test failed');
      setGwTestFeedback((prev) => ({
        ...prev,
        [gatewayKey]: result.message || 'Signature handshake nominal.',
      }));
      setBanner(`Connection verified for ${gatewayKey.toUpperCase()}. Audit log recorded.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Connection test failed.');
    }
  };

  // Specification v2.0 Section 2: Strict fail-closed In-Page 2FA Gate
  if (!session || session.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col justify-between">
        {/* Top Security Banner */}
        <header className="h-16 border-b border-slate-800 px-6 sm:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
            <span className="font-display font-bold text-base tracking-tight text-white">
              Velora & Ara Platform Governance Portal
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              2FA MANDATORY
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              Platform Home
            </Link>
            <Link
              to="/app/dashboard"
              className="px-3 py-1.5 rounded-[8px] bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Seller Workspace
            </Link>
          </div>
        </header>

        {/* 2FA Login Form Card */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[20px] p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-[#2563EB]">
                <Lock className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h1 className="font-display text-xl font-bold text-white">
                Admin Governance 2FA Gateway
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Multi-Factor TOTP (RFC 6238) authentication is required to access risk management, financial rails, and platform audits.
              </p>
            </div>

            {adminLoginError && (
              <div className="p-3.5 rounded-[10px] bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Administrator Username / Email
                </label>
                <input
                  type="text"
                  value={adminLoginUser}
                  onChange={(e) => setAdminLoginUser(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-[10px] text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Root Admin Password
                </label>
                <input
                  type="password"
                  value={adminLoginPassword}
                  onChange={(e) => setAdminLoginPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-[10px] text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">
                    6-Digit 2FA Code (TOTP)
                  </label>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={adminLogin2fa}
                  onChange={(e) => setAdminLogin2fa(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-[10px] text-white font-mono tracking-widest text-center text-base focus:outline-none focus:border-blue-500"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={adminLoggingIn}
                className="w-full py-3 bg-[#2563EB] hover:bg-blue-600 font-semibold text-white rounded-[10px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                {adminLoggingIn ? (
                  <span>Verifying TOTP Code...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Verify 2FA & Access Console</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800 flex flex-col items-center gap-3">
              <div className="text-[11px] text-slate-500 text-center">
                Active persona: <span className="text-slate-400 font-medium">{session?.displayName || 'Signed Out'}</span> ({session?.role || 'Guest'}).
              </div>
            </div>
          </div>
        </main>

        <footer className="h-12 border-t border-slate-800 px-6 flex items-center justify-between text-[11px] text-slate-500">
          <span>Enterprise Zero-Trust Authentication Architecture</span>
          <span>Fail-Closed Enforced</span>
        </footer>
      </div>
    );
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

  const navLinks: { id: AdminTabId; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: '1. Overview Dashboard', icon: LayoutDashboard },
    { id: 'sellers', label: '2. Sellers & KYC', icon: Users },
    { id: 'stores', label: '3. Stores & Slugs', icon: Store },
    { id: 'products', label: '4. Products (≥4 Photos)', icon: Package },
    { id: 'orders', label: '5. Orders & Payments', icon: ShoppingBag },
    { id: 'wallet', label: '6. Wallet & Ledger', icon: WalletIcon },
    { id: 'payouts', label: '7. Payouts & Holds', icon: Landmark },
    { id: 'gateways', label: '8. Payment Gateways & Rails', icon: CreditCard },
    {
      id: 'returns',
      label: '9. Returns & Disputes',
      icon: RotateCcw,
      badge: metrics.openReturnsCount,
    },
    {
      id: 'tickets',
      label: '10. Support Tickets',
      icon: LifeBuoy,
      badge: metrics.unresolvedTicketsCount,
    },
    { id: 'rbac', label: '11. Roles & Permissions', icon: KeyRound },
    {
      id: 'agent',
      label: '12. Co-Worker Agent',
      icon: Bot,
      badge: metrics.pendingAgentApprovalsCount,
    },
    { id: 'seo', label: '13. SEO Control Panel', icon: Globe },
    { id: 'ads', label: '14. Ads & Analytics', icon: Megaphone },
    { id: 'audit', label: '15. Immutable Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex">
      {/* Left Admin Sidebar (15 Specification v2.0 Modules) */}
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
                onClick={() => setActiveTab(item.id)}
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
          {/* MODULE 1, 2 & 3: OVERVIEW / SELLERS / STORES                   */}
          {/* ============================================================== */}
          {(activeTab === 'dashboard' || activeTab === 'sellers' || activeTab === 'stores') && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
              <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-[#111827]">
                    Seller Accounts, Storefront Slugs & Wallet Governance
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    Sensitive actions (suspending a store, placing a wallet hold, verifying bank
                    changes) require explicit confirmation and write to the immutable audit log.
                  </p>
                </div>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                    <th className="py-3.5 px-4 font-semibold">Store & Public Slug</th>
                    <th className="py-3.5 px-4 font-semibold">Setup Plan & KYC</th>
                    <th className="py-3.5 px-4 font-semibold">Payout Destination (Masked)</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Available / Held</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Governance Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {sellers
                    .filter(
                      (s: any) =>
                        !searchTerm ||
                        s.store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.store.slug.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item: any) => {
                      const st = item.store;
                      const prof = item.profile || {};
                      const wal = item.wallet || {};
                      const pa = item.payoutAccount || {};
                      return (
                        <tr key={st.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#111827]">{st.name}</div>
                            <Link
                              to={`/${st.slug}`}
                              className="font-mono text-[#2563EB] hover:underline"
                            >
                              platform.com/{st.slug}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-[#111827]">
                              {prof.setupPlan} (₹{prof.setupFeeAmount})
                            </div>
                            <div className="font-mono text-[11px] text-[#16A34A]">
                              OTP Verified · {prof.kycStatus}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <div>
                              {pa.method === 'upi'
                                ? `UPI: ${pa.upiId}`
                                : `${pa.bankName} (${pa.maskedAccountNumber})`}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">
                              {pa.verificationStatus}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-right">
                            <div className="font-bold text-[#16A34A]">
                              Avail: ₹{Number(wal.availableBalance || 0).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[#D97706]">
                              Held: ₹{Number(wal.heldBalance || 0).toLocaleString('en-IN')}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div
                              className={`font-semibold ${
                                st.status === 'active' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                              }`}
                            >
                              Store: {st.status.toUpperCase()}
                            </div>
                            <div className="text-[11px] text-[#6B7280]">
                              Wallet: {wal.isOnHold ? 'ON HOLD' : 'Active'}
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
                                      ? `Suspend Store /${st.slug}`
                                      : `Reactivate Store /${st.slug}`,
                                  actionType: 'toggle_store_suspension',
                                  storeId: st.id,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] hover:border-[#DC2626] text-[#111827] font-semibold"
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
                              className="px-2.5 py-1.5 rounded-[6px] border border-[#E5E7EB] hover:border-[#D97706] text-[#111827] font-semibold"
                            >
                              {wal.isOnHold ? 'Lift Wallet Hold' : 'Hold Wallet'}
                            </button>
                            {pa.verificationStatus !== 'Verified' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmModal({
                                    open: true,
                                    title: `Verify Payout Account (/ ${st.slug})`,
                                    actionType: 'verify_payout_account',
                                    storeId: st.id,
                                  })
                                }
                                className="px-2.5 py-1.5 rounded-[6px] bg-[#2563EB] text-white font-semibold"
                              >
                                Verify Bank
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
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
                  {[
                    {
                      key: 'razorpay',
                      name: 'Razorpay Payment Rails',
                      desc: 'Primary domestic rail for UPI Intent, RuPay, Visa, Mastercard & Netbanking',
                      keyId: 'rzp_test_platform_root_2026',
                      env: 'sandbox',
                      enabled: true,
                      fee: '10%',
                      methods: 'UPI, Cards, Netbanking',
                    },
                    {
                      key: 'cashfree',
                      name: 'Cashfree Payments Engine',
                      desc: 'Secondary high-throughput checkout rail with instant UPI intent QR',
                      keyId: 'cf_app_platform_sandbox_882',
                      env: 'sandbox',
                      enabled: true,
                      fee: '10%',
                      methods: 'UPI, Cards',
                    },
                    {
                      key: 'stripe',
                      name: 'Stripe Global Gateway',
                      desc: 'International multi-currency cross-border card checkout & fraud radar',
                      keyId: 'pk_test_platform_global_900',
                      env: 'sandbox',
                      enabled: false,
                      fee: '10%',
                      methods: 'Global Cards, Apple Pay',
                    },
                    {
                      key: 'upi',
                      name: 'Direct UPI Instant Settlement',
                      desc: 'Zero-fee VPA rail with dynamic merchant QR generation',
                      keyId: 'platform@okaxis',
                      env: 'live',
                      enabled: true,
                      fee: '10%',
                      methods: 'BHIM, GPay, PhonePe, Paytm',
                    },
                  ].map((gw) => (
                    <div key={gw.key} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-display font-bold text-sm text-[#111827]">{gw.name}</span>
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
                            {gw.env}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280]">{gw.desc}</p>
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[#4B5563]">
                          <span>Key: {gw.keyId}</span>
                          <span>•</span>
                          <span>Platform Fee: {gw.fee}</span>
                          <span>•</span>
                          <span>Methods: {gw.methods}</span>
                        </div>
                        {gwTestFeedback[gw.key] && (
                          <div className="text-[11px] text-emerald-600 font-semibold pt-1">
                            ✓ {gwTestFeedback[gw.key]}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleTestPlatformGateway(gw.key)}
                          className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] hover:bg-slate-100 rounded-[8px] text-xs font-semibold text-[#111827]"
                        >
                          Test Handshake
                        </button>
                        <button
                          type="button"
                          disabled={gwUpdating}
                          onClick={() => handleTogglePlatformGateway(gw.key, gw.enabled)}
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
