import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { SafeImage } from '../../components/SafeImage.tsx';
import { GENERATED_ASSETS, THEME_PRESETS } from '../../constants/assets.ts';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet as WalletIcon,
  Landmark,
  Palette,
  Settings,
  Bell,
  HelpCircle,
  ExternalLink,
  Plus,
  Check,
  AlertTriangle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Monitor,
  ArrowRight,
  Image,
  Sparkles,
  Upload,
} from 'lucide-react';

const ORDER_LIFECYCLE_STATES = [
  'Payment Pending',
  'Paid',
  'Confirmed',
  'Packed',
  'Shipped',
  'Delivered',
  'Completed',
];

const ORDER_EXCEPTION_STATES = [
  'Payment Failed',
  'Cancelled',
  'RTO',
  'Return Requested',
  'Return Approved',
  'Return Rejected',
];

export default function SellerWorkspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const { session, authFetch } = useAuth();

  // Non-negotiable N001 & Task 4: Protected views must immediately trigger a hard redirect to /login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const [ctx, setCtx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bannerMsg, setBannerMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Product Filter & Editor state
  const [productStatusFilter, setProductStatusFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Apparel');
  const [prodDescription, setProdDescription] = useState('');
  const [prodSellerPrice, setProdSellerPrice] = useState(2500);
  const [prodStock, setProdStock] = useState(12);
  const [prodVariantsText, setProdVariantsText] = useState('S, M, L');
  const [prodWeight, setProdWeight] = useState(450);
  const [prodShippingNotes, setProdShippingNotes] = useState('Dispatched within 24–48 hours');
  const [prodReturnPolicy, setProdReturnPolicy] = useState('7-day easy return & size exchange');
  const [prodStatus, setProdStatus] = useState('Published');
  const [prodImageUrl, setProdImageUrl] = useState<string>(GENERATED_ASSETS.silkDress);
  const [prodGalleryUrls, setProdGalleryUrls] = useState<string[]>([
    GENERATED_ASSETS.silkDress,
    GENERATED_ASSETS.heroStudio,
    GENERATED_ASSETS.leatherTote,
    GENERATED_ASSETS.botanicalSerum,
  ]);
  const [prodCropPosition, setProdCropPosition] = useState<'center' | 'top' | 'bottom'>('center');
  const [prodSeoTitle, setProdSeoTitle] = useState('');
  const [prodSeoDescription, setProdSeoDescription] = useState('');

  // Order filter & shipping form state
  const [orderFilter, setOrderFilter] = useState('All');
  const [courierInput, setCourierInput] = useState('BlueDart Air');
  const [trackingInput, setTrackingInput] = useState('');

  // Branding & Settings state
  const [brandPreset, setBrandPreset] = useState('Luxury');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoCropPosition, setLogoCropPosition] = useState<'center' | 'top' | 'bottom'>('center');
  const [bannerCropPosition, setBannerCropPosition] = useState<'center' | 'top' | 'bottom'>('center');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#111827');
  const [buttonStyle, setButtonStyle] = useState('rounded');
  const [fontPreset, setFontPreset] = useState('Manrope & Plus Jakarta Sans');
  const [cardStyle, setCardStyle] = useState('editorial');
  const [bannerUrl, setBannerUrl] = useState<string>(GENERATED_ASSETS.heroStudio);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');


  const [storeName, setStoreName] = useState('');
  const [storeTagline, setStoreTagline] = useState('');
  const [storeAbout, setStoreAbout] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [returnWindowDays, setReturnWindowDays] = useState(7);
  const [flatShippingRate, setFlatShippingRate] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1500);
  const [instagramUrl, setInstagramUrl] = useState('');
  const [storeSeoTitle, setStoreSeoTitle] = useState('');
  const [storeSeoDescription, setStoreSeoDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Payout Profile state (with Section 6 Re-Authentication OTP)
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [reauthOtpCode, setReauthOtpCode] = useState(''); // Non-negotiable N002: Blank until manually entered

  // Account -> Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');
  const [pwErrorMsg, setPwErrorMsg] = useState('');

  // Support Ticketing state (Section 8: Buyer->Seller & Seller->Admin)
  const [supportTab, setSupportTab] = useState<'buyer_tickets' | 'admin_tickets'>('buyer_tickets');
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [newTicketCategory, setNewTicketCategory] = useState('Payout & Settlement');
  const [newTicketPriority, setNewTicketPriority] = useState('High');
  const [newTicketRef, setNewTicketRef] = useState('');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  const syncFormStateFromContext = (data: any) => {
    if (!data) return;
    if (data.branding) {
      setBrandPreset(data.branding.preset || 'Luxury');
      setLogoUrl(data.branding.logoUrl || '');
      setPrimaryColor(data.branding.primaryColor || '#2563EB');
      setSecondaryColor(data.branding.secondaryColor || '#111827');
      setButtonStyle(data.branding.buttonStyle || 'rounded');
      setFontPreset(data.branding.fontPreset || 'Manrope & Plus Jakarta Sans');
      setCardStyle(data.branding.cardStyle || 'editorial');
      setBannerUrl(data.branding.bannerUrl || GENERATED_ASSETS.heroStudio);
      if (data.branding.logoCropJson) {
        try {
          const parsed = JSON.parse(data.branding.logoCropJson);
          if (parsed.position) setLogoCropPosition(parsed.position);
        } catch {}
      }
      if (data.branding.bannerCropJson) {
        try {
          const parsed = JSON.parse(data.branding.bannerCropJson);
          if (parsed.position) setBannerCropPosition(parsed.position);
        } catch {}
      }
    }
    if (data.store) {
      setStoreName(data.store.name || '');
      setStoreTagline(data.store.tagline || '');
      setStoreAbout(data.store.about || '');
      setWhatsappNumber(data.store.whatsappNumber || '');
      setContactEmail(data.store.contactEmail || '');
      setContactPhone(data.store.contactPhone || '');
      setShippingPolicy(data.store.shippingPolicy || '');
      setReturnPolicy(data.store.returnPolicy || '');
      setReturnWindowDays(data.store.returnWindowDays ?? 7);
      setFlatShippingRate(data.store.flatShippingRate ?? 0);
      setFreeShippingThreshold(data.store.freeShippingThreshold ?? 1500);
      setInstagramUrl(data.store.instagramUrl || '');
      setStoreSeoTitle(data.store.seoTitle || '');
      setStoreSeoDescription(data.store.seoDescription || '');
      setIsPublished(Boolean(data.store.isPublished));
    }
    if (data.payoutAccount) {
      setPayoutMethod((data.payoutAccount.method as 'upi' | 'bank') || 'upi');
      setUpiId(data.payoutAccount.upiId || '');
      setAccountHolderName(data.payoutAccount.accountHolderName || '');
      setBankAccountNumber(data.payoutAccount.bankAccountNumber || '');
      setIfscCode(data.payoutAccount.ifscCode || '');
      setBankName(data.payoutAccount.bankName || '');
    }

  };

  const loadContext = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await authFetch('/api/seller/context');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load workspace');
      setCtx(data);
      syncFormStateFromContext(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load seller data.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const startNewProductForm = () => {
    setEditingProduct(null);
    setProdTitle('');
    setProdSku(`VLR-${Math.floor(100 + Math.random() * 899)}`);
    setProdCategory('Apparel');
    setProdDescription('');
    setProdSellerPrice(2500);
    setProdStock(12);
    setProdVariantsText('S, M, L');
    setProdWeight(450);
    setProdShippingNotes('Dispatched within 24–48 hours');
    setProdReturnPolicy('7-day easy return & size exchange');
    setProdStatus('Published');
    setProdImageUrl(GENERATED_ASSETS.silkDress);
    setProdGalleryUrls([
      GENERATED_ASSETS.silkDress,
      GENERATED_ASSETS.heroStudio,
      GENERATED_ASSETS.leatherTote,
      GENERATED_ASSETS.botanicalSerum,
    ]);
    setProdCropPosition('center');
    setProdSeoTitle('');
    setProdSeoDescription('');
    navigate('/app/products/new');
  };

  const startEditProductForm = (p: any) => {
    setEditingProduct(p);
    setProdTitle(p.title);
    setProdSku(p.sku);
    setProdCategory(p.category);
    setProdDescription(p.description);
    setProdSellerPrice(p.sellerPrice);
    setProdStock(p.stock);
    try {
      const arr = JSON.parse(p.variantsJson || '["Standard"]');
      setProdVariantsText(Array.isArray(arr) ? arr.join(', ') : 'Standard');
    } catch {
      setProdVariantsText('Standard');
    }
    setProdWeight(p.weightGrams || 450);
    setProdShippingNotes(p.shippingNotes || '');
    setProdReturnPolicy(p.returnExchangePolicy || '');
    setProdStatus(p.status || 'Published');
    setProdImageUrl(p.primaryImageUrl || GENERATED_ASSETS.silkDress);
    setProdGalleryUrls(
      Array.isArray(p.images) && p.images.length >= 4
        ? p.images
        : [
            p.primaryImageUrl || GENERATED_ASSETS.silkDress,
            GENERATED_ASSETS.heroStudio,
            GENERATED_ASSETS.leatherTote,
            GENERATED_ASSETS.botanicalSerum,
          ]
    );
    setProdCropPosition((p.imageCropPosition as 'center' | 'top' | 'bottom') || 'center');
    setProdSeoTitle(p.seoTitle || '');
    setProdSeoDescription(p.seoDescription || '');
    navigate('/app/products/new');
  };

  const handleUploadProductPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg('');
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Specification v2.0 Rule: Only JPG, PNG, and WebP image files are permitted.');
      return;
    }
    if (file.size > 1048576) {
      setErrorMsg(
        `Specification v2.0 Rule: Each product photo must be ≤ 1 MB (selected file is ${Math.round(
          file.size / 1024
        )} KB).`
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (result) {
        setProdGalleryUrls((prev) => [...prev, result]);
        setProdImageUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerMsg('');
    setErrorMsg('');
    try {
      const variants = prodVariantsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await authFetch('/api/seller/products', {
        method: 'POST',
        body: JSON.stringify({
          id: editingProduct?.id,
          title: prodTitle,
          sku: prodSku,
          category: prodCategory,
          description: prodDescription,
          sellerPrice: Number(prodSellerPrice),
          stock: Number(prodStock),
          variants,
          weightGrams: Number(prodWeight),
          shippingNotes: prodShippingNotes,
          returnExchangePolicy: prodReturnPolicy,
          status: prodStatus,
          primaryImageUrl: prodGalleryUrls[0] || prodImageUrl,
          imageUrls: prodGalleryUrls,
          imageCropPosition: prodCropPosition,
          seoTitle: prodSeoTitle,
          seoDescription: prodSeoDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');
      setBannerMsg(
        `Product "${data.title}" saved with ${prodGalleryUrls.length} verified photos! Server calculated Customer Price: ₹${Number(
          data.customerPrice
        ).toLocaleString('en-IN')}.`
      );
      await loadContext();
      navigate('/app/products');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBannerUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };



  const handleSaveBrandingOrSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch('/api/seller/branding', {
        method: 'PUT',
        body: JSON.stringify({
          preset: brandPreset,
          logoUrl,
          bannerUrl,
          logoCropJson: JSON.stringify({ position: logoCropPosition, zoom: 1 }),
          bannerCropJson: JSON.stringify({ position: bannerCropPosition, zoom: 1 }),
          primaryColor,
          secondaryColor,
          buttonStyle,
          fontPreset,
          cardStyle,
          name: storeName,
          tagline: storeTagline,
          about: storeAbout,
          whatsappNumber,
          contactEmail,
          contactPhone,
          shippingPolicy,
          returnPolicy,
          returnWindowDays: Number(returnWindowDays),
          flatShippingRate: Number(flatShippingRate),
          freeShippingThreshold: Number(freeShippingThreshold),
          instagramUrl,
          seoTitle: storeSeoTitle,
          seoDescription: storeSeoDescription,
          isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update branding');
      setCtx(data);
      setBannerMsg('Storefront branding and policies saved and published live!');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleOrderStateUpdate = async (orderId: number, nextState: string) => {
    setBannerMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch(`/api/seller/orders/${orderId}/state`, {
        method: 'POST',
        body: JSON.stringify({
          nextState,
          courierName: courierInput || undefined,
          trackingNumber: trackingInput || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order');
      setBannerMsg(
        `Order ${data.orderRef} transitioned to "${nextState}". ${
          nextState === 'Completed'
            ? 'Seller entitlement released from Pending to Available Wallet Balance!'
            : ''
        }`
      );
      await loadContext();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleReturnDecision = async (
    returnId: number,
    action: 'approve' | 'reject' | 'mark_received_and_settle'
  ) => {
    setBannerMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch(`/api/seller/returns/${returnId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update return');
      setCtx(data);
      setBannerMsg('Return status updated and wallet hold reconciled in the immutable ledger.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdatePayoutProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch('/api/seller/payout-profile', {
        method: 'PUT',
        body: JSON.stringify({
          method: payoutMethod,
          upiId,
          accountHolderName,
          bankAccountNumber,
          ifscCode,
          bankName,
          reauthOtpCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update payout destination');
      setCtx(data);
      setBannerMsg(
        'Re-authentication OTP verified! Payout destination updated, placed under 24-hour Security Hold, and logged in Audit Trail.'
      );
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwErrorMsg('');
    setPwSuccessMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwErrorMsg('Please fill in your current password, new password, and confirmation.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErrorMsg('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    setPwSubmitting(true);
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password update failed.');
      }
      setPwSuccessMsg(data.message || 'Your password has been updated successfully. Other active sessions were revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleCreateSellerTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setBannerMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch('/api/seller/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          category: newTicketCategory,
          priority: newTicketPriority,
          relatedRef: newTicketRef,
          subject: newTicketSubject,
          message: newTicketMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create support ticket');
      setCtx(data);
      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketRef('');
      setBannerMsg('Support ticket submitted to Platform Operations Admin Desk.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleReplySupportTicket = async (ticketId: number, nextStatus?: string) => {
    setBannerMsg('');
    setErrorMsg('');
    try {
      const msg = replyTexts[ticketId] || '';
      const res = await authFetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          actorRole: 'seller',
          message: msg,
          nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket');
      setCtx(data);
      setReplyTexts((prev) => ({ ...prev, [ticketId]: '' }));
      setBannerMsg('Support ticket updated and recorded in audit log.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRunWeeklyPayout = async () => {
    setBannerMsg('');
    setErrorMsg('');
    try {
      const res = await authFetch('/api/seller/payouts/run-weekly', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not run weekly payout');
      setCtx(data);
      setBannerMsg(
        'Weekly eligible balance settled to verified destination and recorded in append-only wallet ledger!'
      );
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  if (loading && !ctx) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 text-sm text-[#6B7280]">
        Loading tenant-scoped Seller Console...
      </div>
    );
  }

  const store = ctx?.store || {};
  const wallet = ctx?.wallet || {
    availableBalance: 0,
    pendingBalance: 0,
    heldBalance: 0,
    lifetimeEarnings: 0,
  };
  const products = ctx?.products || [];
  const orders = ctx?.orders || [];
  const ledger = ctx?.ledger || [];
  const payouts = ctx?.payouts || [];
  const returns = ctx?.returns || [];
  const supportTickets = ctx?.supportTickets || [];
  const notifications = ctx?.notifications || [];
  const payoutAccount = ctx?.payoutAccount || {};

  const unreadNotifications = notifications.filter((n: any) => !n.isRead).length;

  // Determine active view from route
  const pathname = location.pathname;
  const isOrderDetail = pathname.startsWith('/app/orders/') && Boolean(params.id);
  const activeOrder = isOrderDetail
    ? orders.find(
        (o: any) => String(o.id) === params.id || o.orderRef.toLowerCase() === params.id?.toLowerCase()
      )
    : null;

  // Compute Dashboard metrics & exception actions
  const paidOrders = orders.filter(
    (o: any) => o.orderState !== 'Payment Pending' && o.orderState !== 'Payment Failed'
  );
  const totalSalesGmv = paidOrders.reduce((acc: number, o: any) => acc + o.customerTotalPayable, 0);
  const ordersNeedingDispatch = orders.filter(
    (o: any) => o.orderState === 'Paid' || o.orderState === 'Confirmed' || o.orderState === 'Packed'
  );
  const openReturns = returns.filter(
    (r: any) => r.status === 'Return Requested' || r.status === 'Return Approved'
  );

  const navItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/app/products', icon: Package },
    { label: 'Orders', path: '/app/orders', icon: ShoppingBag, badge: ordersNeedingDispatch.length },
    { label: 'Wallet', path: '/app/wallet', icon: WalletIcon },
    { label: 'Payouts', path: '/app/payouts', icon: Landmark },
    { label: 'Branding', path: '/app/branding', icon: Palette },
    { label: 'Store Settings', path: '/app/settings', icon: Settings },
    {
      label: 'Notifications',
      path: '/app/notifications',
      icon: Bell,
      badge: unreadNotifications,
    },
    { label: 'Support', path: '/app/support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex">
      {/* Left Workspace Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] hidden lg:flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <Link to="/" className="font-display text-base font-extrabold text-[#111827]">
            Velora Commerce
          </Link>
        </div>

        {/* Active Storefront Info */}
        <div className="p-4 border-b border-[#E5E7EB] bg-[#F8FAFC] space-y-1">
          <div className="text-[11px] font-medium text-[#6B7280]">Your Branded Store</div>
          <div className="font-display font-bold text-sm text-[#111827] truncate">{store.name}</div>
          <a
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-[#2563EB] hover:underline truncate block"
          >
            /{store.slug} ↗
          </a>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.path ||
              (item.path === '/app/products' && pathname.startsWith('/app/products')) ||
              (item.path === '/app/orders' && pathname.startsWith('/app/orders'));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-[10px] text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded-[6px] ${
                      active ? 'bg-white/20 text-white' : 'bg-[#F8FAFC] text-[#111827]'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E5E7EB] space-y-2 text-xs">
          <Link
            to={`/${store.slug || 'velora'}`}
            className="w-full py-2.5 px-3 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB] rounded-[8px] font-semibold text-[#111827] flex items-center justify-between"
          >
            <span>View Live Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
          </Link>
          <Link
            to="/admin"
            className="w-full py-2 px-3 text-[#6B7280] hover:text-[#111827] flex items-center justify-between"
          >
            <span>Switch to Admin Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb left, Primary Actions right */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-[#6B7280] truncate">
            <span>Seller Console</span>
            <span>/</span>
            <span className="text-[#111827] font-semibold">{store.name}</span>
            <span>/</span>
            <span className="font-mono text-[#2563EB]">platform.com/{store.slug}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={startNewProductForm}
              className="px-3.5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[8px] flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
            <Link
              to={`/${store.slug || 'velora'}`}
              className="px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] hover:border-[#111827] text-[#111827] text-xs font-semibold rounded-[8px] flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Mobile Nav Strip */}
        <div className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap ${
                pathname === item.path ? 'bg-[#2563EB] text-white' : 'bg-[#F8FAFC] text-[#6B7280]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="p-6 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">
          {bannerMsg && (
            <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-xs font-medium text-[#111827] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>{bannerMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setBannerMsg('')}
                className="text-[#6B7280] hover:text-[#111827]"
              >
                ✕
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 text-xs font-medium text-[#DC2626] flex items-center justify-between">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg('')}>
                ✕
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 1: SELLER DASHBOARD (/app/dashboard)                      */}
          {/* ============================================================== */}
          {(pathname === '/app/dashboard' || pathname === '/app') && (
            <div className="space-y-8">
              {/* Top Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Gross Store Sales (GMV)</div>
                  <div className="font-mono text-2xl font-bold text-[#111827] mt-1">
                    ₹{totalSalesGmv.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">
                    Across {paidOrders.length} webhook-verified orders
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Available Wallet Balance</div>
                  <div className="font-mono text-2xl font-bold text-[#16A34A] mt-1">
                    ₹{Number(wallet.availableBalance).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1">
                    Eligible for weekly UPI/Bank payout
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Pending & Held Balance</div>
                  <div className="font-mono text-2xl font-bold text-[#111827] mt-1">
                    ₹{Number(wallet.pendingBalance + wallet.heldBalance).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-[#D97706] mt-1">
                    ₹{Number(wallet.pendingBalance).toLocaleString('en-IN')} Pending · ₹
                    {Number(wallet.heldBalance).toLocaleString('en-IN')} Return Hold
                  </div>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Published Products</div>
                  <div className="font-mono text-2xl font-bold text-[#111827] mt-1">
                    {products.filter((p: any) => p.status === 'Published').length} /{' '}
                    {products.length}
                  </div>
                  <div className="text-xs text-[#2563EB] mt-1">
                    <Link to="/app/products" className="hover:underline">
                      Manage catalogue →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Priority Actions & Exceptions (Prioritized over vanity metrics) */}
              <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#111827]">
                      Priority Actions & Exceptions
                    </h2>
                    <p className="text-xs text-[#6B7280]">
                      Orders awaiting dispatch, return approvals, and security alerts
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#D97706] font-semibold">
                    {ordersNeedingDispatch.length + openReturns.length} Actions Pending
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ordersNeedingDispatch.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                          <Truck className="w-4 h-4 text-[#2563EB]" />
                          <span>
                            {ord.orderRef} · {ord.orderState}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B7280]">
                          Customer {ord.customerName} paid ₹
                          {Number(ord.customerTotalPayable).toLocaleString('en-IN')}. Ready to pack
                          & ship.
                        </p>
                      </div>
                      <Link
                        to={`/app/orders/${ord.id}`}
                        className="px-3 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-[8px] whitespace-nowrap shrink-0"
                      >
                        Fulfil Order →
                      </Link>
                    </div>
                  ))}

                  {openReturns.map((ret: any) => (
                    <div
                      key={ret.id}
                      className="p-4 rounded-[10px] bg-amber-50/50 border border-amber-200 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#D97706]">
                          <RotateCcw className="w-4 h-4" />
                          <span>
                            Return {ret.returnRef} ({ret.orderRef}) · {ret.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#111827]">
                          {ret.reason} (₹{Number(ret.holdAmount).toLocaleString('en-IN')} held in
                          wallet)
                        </p>
                      </div>
                      <Link
                        to={`/app/orders/${ret.orderId}`}
                        className="px-3 py-2 bg-[#111827] text-white text-xs font-semibold rounded-[8px] whitespace-nowrap shrink-0"
                      >
                        Review Return →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Onboarding Checklist & Recent Ledger Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-[#111827]">
                      Seller Launch Checklist
                    </h3>
                    <span className="font-mono text-xs text-[#16A34A] font-semibold">
                      8 / 8 Complete
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {[
                      { step: '1. Brand Theme Preset Configured', route: '/app/branding' },
                      { step: '2. Store Details & Tagline Added', route: '/app/settings' },
                      {
                        step: `3. WhatsApp Connected (+${store.whatsappNumber})`,
                        route: '/app/settings',
                      },
                      { step: '4. Shipping Rates & Policy Published', route: '/app/settings' },
                      {
                        step: `5. Return Window (${store.returnWindowDays} Days) Active`,
                        route: '/app/settings',
                      },
                      {
                        step: `6. Payout Profile (${payoutAccount.verificationStatus || 'Verified'})`,
                        route: '/app/payouts',
                      },
                      {
                        step: `7. Catalogue Products (${products.length} Added)`,
                        route: '/app/products',
                      },
                      {
                        step: `8. Storefront Live at /${store.slug}`,
                        route: `/${store.slug}`,
                      },
                    ].map((item) => (
                      <Link
                        key={item.step}
                        to={item.route}
                        className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB]"
                      >
                        <div className="flex items-center gap-2 font-medium text-[#111827]">
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>{item.step}</span>
                        </div>
                        <span className="text-[#2563EB] font-semibold">Edit</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-[#111827]">
                      Recent Wallet Ledger & Order Activity
                    </h3>
                    <Link
                      to="/app/wallet"
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      Full Append-Only Ledger →
                    </Link>
                  </div>
                  <div className="divide-y divide-[#E5E7EB]">
                    {ledger.slice(0, 5).map((entry: any) => (
                      <div
                        key={entry.id}
                        className="py-3 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-[#111827]">
                            {entry.type} ·{' '}
                            <span className="font-mono text-[#6B7280]">
                              {entry.transactionRef}
                            </span>
                          </div>
                          <div className="text-[#6B7280]">{entry.description}</div>
                        </div>
                        <div
                          className={`font-mono font-bold whitespace-nowrap ${
                            entry.direction === 'credit' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {entry.direction === 'credit' ? '+' : '-'}₹
                          {Number(entry.amount).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: PRODUCTS CATALOGUE (/app/products)                     */}
          {/* ============================================================== */}
          {pathname === '/app/products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#111827]">
                    Product Catalogue
                  </h1>
                  <p className="text-xs text-[#6B7280]">
                    Platform fee (+10%) is calculated server-side for every product.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-white border border-[#E5E7EB] rounded-[10px]">
                    {['All', 'Published', 'Draft', 'Out of Stock', 'Archived'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setProductStatusFilter(st)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] ${
                          productStatusFilter === st
                            ? 'bg-[#111827] text-white'
                            : 'text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={startNewProductForm}
                    className="px-4 py-2.5 bg-[#2563EB] text-white text-xs font-semibold rounded-[10px] whitespace-nowrap"
                  >
                    + Add Product
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                      <th className="py-3.5 px-4 font-semibold">Product</th>
                      <th className="py-3.5 px-4 font-semibold">SKU & Category</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Seller Price</th>
                      <th className="py-3.5 px-4 font-semibold text-right">+10% Platform Fee</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Customer Price</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Stock</th>
                      <th className="py-3.5 px-4 font-semibold">State</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {products
                      .filter(
                        (p: any) =>
                          productStatusFilter === 'All' || p.status === productStatusFilter
                      )
                      .map((p: any) => {
                        const fee = Number(p.customerPrice) - Number(p.sellerPrice);
                        return (
                          <tr key={p.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-[8px] overflow-hidden border border-[#E5E7EB] shrink-0">
                                  <SafeImage
                                    src={p.primaryImageUrl}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="font-semibold text-[#111827]">{p.title}</div>
                                  <div className="text-[11px] text-[#6B7280]">
                                    Weight: {p.weightGrams}g
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[#6B7280]">
                              {p.sku} · {p.category}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-right text-[#111827]">
                              ₹{Number(p.sellerPrice).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-right text-[#2563EB]">
                              +₹{fee.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-right text-[#16A34A]">
                              ₹{Number(p.customerPrice).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-right">{p.stock}</td>
                            <td className="py-3.5 px-4 text-[#111827] font-medium">{p.status}</td>
                            <td className="py-3.5 px-4 text-right space-x-3">
                              <button
                                type="button"
                                onClick={() => startEditProductForm(p)}
                                className="font-semibold text-[#2563EB] hover:underline"
                              >
                                Edit
                              </button>
                              <Link
                                to={`/${store.slug}/product/${p.slug}`}
                                className="font-semibold text-[#6B7280] hover:text-[#111827]"
                              >
                                View
                              </Link>
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
          {/* VIEW 3: ADD / EDIT PRODUCT (/app/products/new)                 */}
          {/* ============================================================== */}
          {pathname === '/app/products/new' && (
            <form
              onSubmit={handleSaveProduct}
              className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 space-y-6 max-w-3xl"
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <h1 className="font-display text-xl font-bold text-[#111827]">
                    {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Product'}
                  </h1>
                  <p className="text-xs text-[#6B7280]">
                    Customer price is computed server-side (Seller Price + 10% Platform Fee).
                  </p>
                </div>
                <Link
                  to="/app/products"
                  className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
                >
                  ← Back to Catalogue
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    placeholder="e.g., Handspun Eri Silk Stole"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">SKU *</label>
                  <input
                    type="text"
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Category *</label>
                  <input
                    type="text"
                    required
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Your Seller Price (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    value={prodSellerPrice}
                    onChange={(e) => setProdSellerPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Server-Calculated Customer Price (+10% Fee)
                  </label>
                  <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[10px] font-mono text-sm font-bold text-[#16A34A]">
                    ₹{Math.round(prodSellerPrice * 1.1).toLocaleString('en-IN')} (Seller ₹
                    {prodSellerPrice.toLocaleString('en-IN')} + Fee ₹
                    {Math.round(prodSellerPrice * 0.1).toLocaleString('en-IN')})
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Inventory Stock *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Weight (Grams) *</label>
                  <input
                    type="number"
                    required
                    value={prodWeight}
                    onChange={(e) => setProdWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5">
                    Size / Colour Variants (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={prodVariantsText}
                    onChange={(e) => setProdVariantsText(e.target.value)}
                    placeholder="XS / Ivory, S / Ivory, M / Ivory"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div className="sm:col-span-2 p-4 rounded-[12px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#111827]">
                        Product Photo Gallery (Minimum 4 Photos Required Before Publishing · ≤ 1 MB Each · 4:5 Portrait)
                      </label>
                      <p className="text-[11px] text-[#6B7280]">
                        Currently attached: <strong>{prodGalleryUrls.length} photo(s)</strong>{' '}
                        {prodGalleryUrls.length >= 4
                          ? '✓ Compliant with Specification v2.0'
                          : `— Add ${4 - prodGalleryUrls.length} more photo(s) to publish`}
                      </p>
                    </div>
                    <label className="px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#2563EB] rounded-[8px] text-xs font-semibold text-[#2563EB] cursor-pointer whitespace-nowrap">
                      + Upload JPG/PNG/WebP (≤1MB)
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleUploadProductPhotoFile}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Active 4:5 Gallery Preview Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {prodGalleryUrls.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="p-2 rounded-[10px] bg-white border border-[#E5E7EB] space-y-1.5"
                      >
                        <div className="aspect-[4/5] rounded-[6px] overflow-hidden bg-[#F8FAFC] relative">
                          <SafeImage
                            src={url}
                            alt={`Gallery ${idx + 1}`}
                            className={`w-full h-full object-cover ${
                              prodCropPosition === 'top'
                                ? 'object-top'
                                : prodCropPosition === 'bottom'
                                ? 'object-bottom'
                                : 'object-center'
                            }`}
                          />
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-[#2563EB] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px]">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-[#6B7280]">Photo #{idx + 1}</span>
                          {prodGalleryUrls.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setProdGalleryUrls((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-[#DC2626] font-semibold hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Studio Photography Preset to Gallery & 4:5 Crop Positioning */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E7EB]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#6B7280] mr-1">
                        Add Studio Photo:
                      </span>
                      {[
                        { label: '+ Silk Dress', url: GENERATED_ASSETS.silkDress },
                        { label: '+ Brass Lamp', url: GENERATED_ASSETS.brassLamp },
                        { label: '+ Leather Tote', url: GENERATED_ASSETS.leatherTote },
                        { label: '+ Botanical Serum', url: GENERATED_ASSETS.botanicalSerum },
                        { label: '+ Ceramic Bowl', url: GENERATED_ASSETS.ceramicBowl },
                        { label: '+ Studio Hero', url: GENERATED_ASSETS.heroStudio },
                      ].map((img) => (
                        <button
                          key={img.label}
                          type="button"
                          onClick={() => setProdGalleryUrls((prev) => [...prev, img.url])}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-[#E5E7EB] rounded-[6px] text-[11px] font-semibold text-[#111827]"
                        >
                          {img.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#6B7280]">
                        4:5 Crop Position:
                      </span>
                      {(['center', 'top', 'bottom'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setProdCropPosition(pos)}
                          className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border ${
                            prodCropPosition === pos
                              ? 'bg-[#111827] text-white border-[#111827]'
                              : 'bg-white text-[#6B7280] border-[#E5E7EB]'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Shipping Notes</label>
                  <input
                    type="text"
                    value={prodShippingNotes}
                    onChange={(e) => setProdShippingNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    Return / Exchange Policy
                  </label>
                  <input
                    type="text"
                    value={prodReturnPolicy}
                    onChange={(e) => setProdReturnPolicy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    SEO Title (Optional Override)
                  </label>
                  <input
                    type="text"
                    value={prodSeoTitle}
                    onChange={(e) => setProdSeoTitle(e.target.value)}
                    placeholder="Custom search engine snippet title"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">
                    SEO Meta Description
                  </label>
                  <input
                    type="text"
                    value={prodSeoDescription}
                    onChange={(e) => setProdSeoDescription(e.target.value)}
                    placeholder="120-160 char summary for search & OpenGraph"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Catalogue State</label>
                  <select
                    value={prodStatus}
                    onChange={(e) => setProdStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  >
                    <option value="Published">Published (Requires ≥4 Photos)</option>
                    <option value="Draft">Draft</option>
                    <option value="Out of Stock">Out of Stock</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
                <Link
                  to="/app/products"
                  className="px-4 py-2.5 border border-[#E5E7EB] rounded-[10px] text-xs font-semibold"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[10px]"
                >
                  Save & Publish Product
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: ORDERS LIST (/app/orders)                              */}
          {/* ============================================================== */}
          {pathname === '/app/orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#111827]">
                    Orders, Fulfilment & Returns
                  </h1>
                  <p className="text-xs text-[#6B7280]">
                    Manage WhatsApp orders, shipping tracking, and return approvals.
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-white border border-[#E5E7EB] rounded-[10px] overflow-x-auto">
                  {[
                    'All',
                    'Payment Pending',
                    'Paid',
                    'Shipped',
                    'Completed',
                    'Return Requested',
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOrderFilter(st)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] whitespace-nowrap ${
                        orderFilter === st
                          ? 'bg-[#111827] text-white'
                          : 'text-[#6B7280] hover:text-[#111827]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                      <th className="py-3.5 px-4 font-semibold">Order Ref</th>
                      <th className="py-3.5 px-4 font-semibold">Customer & WhatsApp Ref</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Seller Entitlement</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Customer Paid (+10%)</th>
                      <th className="py-3.5 px-4 font-semibold">Order State</th>
                      <th className="py-3.5 px-4 font-semibold">Courier Tracking</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {orders
                      .filter((o: any) => orderFilter === 'All' || o.orderState === orderFilter)
                      .map((ord: any) => (
                        <tr key={ord.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3.5 px-4 font-mono font-bold text-[#111827]">
                            {ord.orderRef}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#111827]">{ord.customerName}</div>
                            <div className="font-mono text-[11px] text-[#6B7280]">
                              {ord.customerPhone} · {ord.whatsappEnquiryRef}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-right text-[#16A34A]">
                            ₹{Number(ord.sellerSubtotal).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-right text-[#111827]">
                            ₹{Number(ord.customerTotalPayable).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[#111827]">
                            {ord.orderState}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#6B7280]">
                            {ord.trackingNumber
                              ? `${ord.courierName} (${ord.trackingNumber})`
                              : 'Not shipped yet'}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-3">
                            <Link
                              to={`/app/orders/${ord.id}`}
                              className="font-semibold text-[#2563EB] hover:underline"
                            >
                              Order Detail →
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: ORDER DETAIL (/app/orders/:id)                         */}
          {/* ============================================================== */}
          {isOrderDetail && (
            <div className="space-y-6">
              {!activeOrder ? (
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-8 text-center">
                  <p className="text-sm text-[#6B7280] mb-4">Order not found in your store.</p>
                  <Link
                    to="/app/orders"
                    className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-[8px]"
                  >
                    Back to Orders
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        to="/app/orders"
                        className="text-xs font-semibold text-[#6B7280] hover:text-[#111827]"
                      >
                        ← Back to All Orders
                      </Link>
                      <h1 className="font-display text-2xl font-bold text-[#111827] mt-1">
                        Order {activeOrder.orderRef} · {activeOrder.orderState}
                      </h1>
                    </div>
                    <Link
                      to={`/checkout/${activeOrder.orderRef}`}
                      className="px-4 py-2 bg-white border border-[#E5E7EB] rounded-[8px] text-xs font-semibold text-[#2563EB]"
                    >
                      Open Customer Payment Link →
                    </Link>
                  </div>

                  {/* Order Lifecycle Timeline */}
                  <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                    <div className="text-xs font-semibold text-[#111827]">
                      Order Fulfilment Lifecycle & Exception Controls
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ORDER_LIFECYCLE_STATES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleOrderStateUpdate(activeOrder.id, st)}
                          className={`px-3.5 py-2 rounded-[8px] text-xs font-semibold border transition-colors ${
                            activeOrder.orderState === st
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-[#F8FAFC] text-[#111827] border-[#E5E7EB] hover:border-[#2563EB]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E5E7EB]">
                      <span className="text-xs text-[#6B7280] self-center mr-2">Exceptions:</span>
                      {ORDER_EXCEPTION_STATES.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => handleOrderStateUpdate(activeOrder.id, ex)}
                          className={`px-3 py-1.5 rounded-[8px] text-xs font-medium border ${
                            activeOrder.orderState === ex
                              ? 'bg-[#DC2626] text-white border-[#DC2626]'
                              : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:text-[#DC2626]'
                          }`}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                      <h2 className="font-display text-base font-bold">
                        Snapshotted Items & Commercial Split
                      </h2>
                      <div className="divide-y divide-[#E5E7EB] text-xs">
                        {activeOrder.items?.map((item: any) => (
                          <div key={item.id} className="py-3 flex justify-between">
                            <div>
                              <div className="font-semibold text-[#111827]">
                                {item.productTitleSnapshot} × {item.quantity}
                              </div>
                              <div className="font-mono text-[#6B7280]">
                                SKU: {item.skuSnapshot} · Variant: {item.selectedVariant}
                              </div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold text-[#111827]">
                                ₹{Number(item.customerPriceSnapshot).toLocaleString('en-IN')}
                              </div>
                              <div className="text-[#16A34A]">
                                Seller: ₹{Number(item.sellerPriceSnapshot).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB] space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span>Seller Wallet Entitlement:</span>
                          <span className="font-mono font-bold text-[#16A34A]">
                            ₹{Number(activeOrder.sellerSubtotal).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>10% Platform Fee:</span>
                          <span className="font-mono font-semibold text-[#2563EB]">
                            ₹{Number(activeOrder.platformFeeTotal).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold pt-1.5 border-t border-[#E5E7EB]">
                          <span>Customer Paid Total:</span>
                          <span className="font-mono">
                            ₹{Number(activeOrder.customerTotalPayable).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shipping & Return Management */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                        <h2 className="font-display text-base font-bold">
                          Seller Shipping & Tracking
                        </h2>
                        <div className="space-y-3 text-xs">
                          <input
                            type="text"
                            value={courierInput}
                            onChange={(e) => setCourierInput(e.target.value)}
                            placeholder="Courier Partner (e.g., BlueDart Air)"
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                          />
                          <input
                            type="text"
                            value={trackingInput}
                            onChange={(e) => setTrackingInput(e.target.value)}
                            placeholder={
                              activeOrder.trackingNumber || 'Enter AWB / Tracking Number'
                            }
                            className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleOrderStateUpdate(activeOrder.id, 'Shipped')}
                            className="w-full py-2.5 bg-[#111827] text-white font-semibold rounded-[8px]"
                          >
                            Save Tracking & Mark Shipped
                          </button>
                        </div>
                      </div>

                      {/* Return Requests for this Order */}
                      {returns
                        .filter((r: any) => r.orderId === activeOrder.id)
                        .map((ret: any) => (
                          <div
                            key={ret.id}
                            className="bg-white border border-amber-300 rounded-[12px] p-6 space-y-3 text-xs"
                          >
                            <div className="font-bold text-[#D97706]">
                              Return Request {ret.returnRef} · {ret.status}
                            </div>
                            <p className="text-[#111827]">{ret.reason}</p>
                            <div className="font-mono text-[#6B7280]">
                              Resolution: {ret.resolutionType.toUpperCase()} · Held in Wallet: ₹
                              {Number(ret.holdAmount).toLocaleString('en-IN')}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => handleReturnDecision(ret.id, 'approve')}
                                className="px-3 py-1.5 bg-[#2563EB] text-white font-semibold rounded-[6px]"
                              >
                                1. Approve Return
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleReturnDecision(ret.id, 'mark_received_and_settle')
                                }
                                className="px-3 py-1.5 bg-[#16A34A] text-white font-semibold rounded-[6px]"
                              >
                                2. Product Received & Settle Wallet
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReturnDecision(ret.id, 'reject')}
                                className="px-3 py-1.5 bg-red-50 text-[#DC2626] border border-red-200 font-semibold rounded-[6px]"
                              >
                                Reject & Release Hold
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: WALLET & APPEND-ONLY LEDGER (/app/wallet)              */}
          {/* ============================================================== */}
          {pathname === '/app/wallet' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#111827]">
                    Immutable Seller Wallet & Append-Only Ledger
                  </h1>
                  <p className="text-xs text-[#6B7280]">
                    Arbitrary balance edits are prohibited. Every balance change is reconciled from
                    append-only ledger transactions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunWeeklyPayout}
                  className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[10px] whitespace-nowrap"
                >
                  Settle Available Balance (₹{Number(wallet.availableBalance).toLocaleString('en-IN')})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Available Balance (Eligible Payout)</div>
                  <div className="font-mono text-2xl font-bold text-[#16A34A] mt-1">
                    ₹{Number(wallet.availableBalance).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Pending Balance (In Fulfilment)</div>
                  <div className="font-mono text-2xl font-bold text-[#2563EB] mt-1">
                    ₹{Number(wallet.pendingBalance).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Held Balance (Return Exposure)</div>
                  <div className="font-mono text-2xl font-bold text-[#D97706] mt-1">
                    ₹{Number(wallet.heldBalance).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5">
                  <div className="text-xs text-[#6B7280]">Lifetime Seller Earnings</div>
                  <div className="font-mono text-2xl font-bold text-[#111827] mt-1">
                    ₹{Number(wallet.lifetimeEarnings).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                      <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                      <th className="py-3.5 px-4 font-semibold">Order / Payout Ref</th>
                      <th className="py-3.5 px-4 font-semibold">Type & Bucket</th>
                      <th className="py-3.5 px-4 font-semibold">Description</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Credit / Debit</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {ledger.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#111827]">
                          {tx.transactionRef}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#2563EB]">
                          {tx.orderRef || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#111827]">{tx.type}</div>
                          <div className="text-[11px] text-[#6B7280]">
                            Bucket: {tx.bucketAffected}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#6B7280] max-w-md">{tx.description}</td>
                        <td
                          className={`py-3.5 px-4 font-mono font-bold text-right ${
                            tx.direction === 'credit' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {tx.direction === 'credit' ? '+' : '-'}₹
                          {Number(tx.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-right text-[#111827]">
                          ₹{Number(tx.balanceAfter).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 7: PAYOUTS & UPI/BANK PROFILE (/app/payouts)              */}
          {/* ============================================================== */}
          {pathname === '/app/payouts' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5">
                <div>
                  <h2 className="font-display text-lg font-bold text-[#111827]">
                    Verified Payout Destination Profile
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    Changing payout destination triggers automatic verification and a 24-hour
                    security hold.
                  </p>
                </div>

                <div className="p-3.5 rounded-[10px] bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between text-xs">
                  <span className="text-[#6B7280]">Destination Status:</span>
                  <span
                    className={`font-semibold ${
                      payoutAccount.verificationStatus === 'Verified'
                        ? 'text-[#16A34A]'
                        : 'text-[#D97706]'
                    }`}
                  >
                    {payoutAccount.verificationStatus || 'Verified'}
                  </span>
                </div>

                <form onSubmit={handleUpdatePayoutProfile} className="space-y-4 text-xs">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('upi')}
                      className={`px-3.5 py-2 rounded-[8px] font-semibold border ${
                        payoutMethod === 'upi'
                          ? 'bg-[#111827] text-white border-[#111827]'
                          : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]'
                      }`}
                    >
                      UPI ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('bank')}
                      className={`px-3.5 py-2 rounded-[8px] font-semibold border ${
                        payoutMethod === 'bank'
                          ? 'bg-[#111827] text-white border-[#111827]'
                          : 'bg-[#F8FAFC] text-[#6B7280] border-[#E5E7EB]'
                      }`}
                    >
                      Bank Account + IFSC
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    />
                  </div>

                  {payoutMethod === 'upi' ? (
                    <div>
                      <label className="block font-semibold mb-1">Verified UPI ID *</label>
                      <input
                        type="text"
                        required
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block font-semibold mb-1">Bank Name *</label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Bank Account Number *</label>
                        <input
                          type="text"
                          required
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">IFSC Code *</label>
                        <input
                          type="text"
                          required
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                        />
                      </div>
                    </>
                  )}

                  <div className="p-3 rounded-[8px] bg-amber-50/70 border border-amber-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-semibold text-[#111827]">
                        Re-Authentication OTP (Required to Change Payout Destination) *
                      </label>
                      <span className="font-mono text-[11px] text-[#16A34A]">Demo OTP: 123456</span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={reauthOtpCode}
                      onChange={(e) => setReauthOtpCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-[6px] font-mono tracking-widest"
                    />
                    {payoutAccount.maskedAccountNumber && (
                      <div className="font-mono text-[11px] text-[#6B7280]">
                        Current Masked Account: {payoutAccount.maskedAccountNumber}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#111827] hover:bg-[#1F2937] text-white font-semibold rounded-[10px]"
                  >
                    Verify OTP & Update Payout Destination (24h Security Hold)
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#6B7280]">
                      Eligible Weekly Settlement Balance (Net of ₹
                      {Number(wallet.heldBalance).toLocaleString('en-IN')} Holds)
                    </div>
                    <div className="font-mono text-2xl font-bold text-[#16A34A] mt-1">
                      ₹{Number(wallet.availableBalance).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunWeeklyPayout}
                    className="px-5 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[10px] whitespace-nowrap"
                  >
                    Execute Weekly Payout Batch Now
                  </button>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-[12px] overflow-x-auto">
                  <div className="p-4 border-b border-[#E5E7EB] font-display font-bold text-sm">
                    Weekly Payout History
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]">
                        <th className="py-3 px-4 font-semibold">Payout Ref</th>
                        <th className="py-3 px-4 font-semibold">Settlement Cycle</th>
                        <th className="py-3 px-4 font-semibold">Destination</th>
                        <th className="py-3 px-4 font-semibold text-right">Amount</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {payouts.map((po: any) => (
                        <tr key={po.id}>
                          <td className="py-3 px-4 font-mono font-semibold">{po.payoutRef}</td>
                          <td className="py-3 px-4">{po.cycleLabel}</td>
                          <td className="py-3 px-4 font-mono text-[#6B7280]">
                            {po.destinationSummary}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-right">
                            ₹{Number(po.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#16A34A]">{po.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 8: BRANDING SYSTEM + LIVE PREVIEW (/app/branding)         */}
          {/* ============================================================== */}
          {pathname === '/app/branding' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={handleSaveBrandingOrSettings}
                className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-5 text-xs"
              >
                <div>
                  <h1 className="font-display text-lg font-bold text-[#111827]">
                    Controlled Theme Presets & Brand System
                  </h1>
                  <p className="text-[#6B7280] mt-0.5">
                    Select from 6 curated presets and customize colours, buttons, and cards.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {THEME_PRESETS.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => {
                        setBrandPreset(tp.id);
                        setPrimaryColor(tp.primaryColor);
                        setSecondaryColor(tp.secondaryColor);
                        setButtonStyle(tp.buttonStyle);
                        setCardStyle(tp.cardStyle);
                      }}
                      className={`p-3 rounded-[10px] border text-left ${
                        brandPreset === tp.id
                          ? 'border-[#2563EB] bg-blue-50/20 ring-1 ring-[#2563EB]'
                          : 'border-[#E5E7EB] bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="font-display font-bold text-xs text-[#111827]">{tp.name}</div>
                      <div className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5">
                        {tp.description}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Primary Accent Colour</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-9 h-9 rounded-[6px] border border-[#E5E7EB] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Secondary Ink Colour</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-9 h-9 rounded-[6px] border border-[#E5E7EB] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Button Style</label>
                    <select
                      value={buttonStyle}
                      onChange={(e) => setButtonStyle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    >
                      <option value="rounded">Rounded (10px)</option>
                      <option value="sharp">Sharp Architectural (0px)</option>
                      <option value="pill">Capsule (Full Radius)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Product Card Style</label>
                    <select
                      value={cardStyle}
                      onChange={(e) => setCardStyle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                    >
                      <option value="editorial">Editorial Framed</option>
                      <option value="bordered">Padded Bordered</option>
                      <option value="minimal">Minimal Unboxed</option>
                    </select>
                  </div>
                </div>

                {/* Logo & Banner Customization Module */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-xs text-[#111827]">
                      Storefront Logo & Visual Identity
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      Upload your high-resolution store logo (square 1:1) or enter an image URL.
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] overflow-hidden shrink-0 flex items-center justify-center">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-[#9CA3AF] font-bold">NO LOGO</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          placeholder="https://example.com/logo.png or upload below"
                          className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs"
                        />
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="px-2 py-1.5 text-[11px] text-[#DC2626] hover:bg-red-50 rounded-[6px]"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[11px] font-medium text-[#111827] rounded-[6px]">
                          <Upload className="w-3 h-3 text-[#2563EB]" />
                          <span>Upload File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoFileUpload}
                            className="hidden"
                          />
                        </label>
                        <select
                          value={logoCropPosition}
                          onChange={(e) => setLogoCropPosition(e.target.value as any)}
                          className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-[6px] text-[11px]"
                        >
                          <option value="center">Align: Center</option>
                          <option value="top">Align: Top</option>
                          <option value="bottom">Align: Bottom</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Curated Logo Presets */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-[#6B7280]">
                      Curated Brand Logo Presets:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setLogoUrl(
                            'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80'
                          )
                        }
                        className="p-1.5 text-left border border-[#E5E7EB] rounded-[6px] hover:bg-gray-50 text-[10px]"
                      >
                        <div className="font-semibold text-[#111827]">Atelier Crest</div>
                        <div className="text-[#9CA3AF]">Gold foil emblem</div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLogoUrl(
                            'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=300&auto=format&fit=crop&q=80'
                          )
                        }
                        className="p-1.5 text-left border border-[#E5E7EB] rounded-[6px] hover:bg-gray-50 text-[10px]"
                      >
                        <div className="font-semibold text-[#111827]">Modern Monogram</div>
                        <div className="text-[#9CA3AF]">Minimalist studio</div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hero Banner Customization Module */}
                <div className="pt-3 border-t border-[#E5E7EB] space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-xs text-[#111827]">
                      Storefront Hero Banner (16:10 Wide)
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      Sets the prominent hero banner on your public storefront homepage.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="aspect-[16/7] w-full rounded-[10px] border border-[#E5E7EB] bg-[#F8FAFC] overflow-hidden">
                      <SafeImage
                        src={bannerUrl}
                        alt="Hero Banner Preview"
                        className={`w-full h-full object-cover ${
                          bannerCropPosition === 'top'
                            ? 'object-top'
                            : bannerCropPosition === 'bottom'
                            ? 'object-bottom'
                            : 'object-center'
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="Banner image URL..."
                        className="w-full px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] text-xs"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#E5E7EB] hover:bg-gray-50 text-[11px] font-medium text-[#111827] rounded-[8px] shrink-0">
                        <Upload className="w-3 h-3 text-[#2563EB]" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerFileUpload}
                          className="hidden"
                        />
                      </label>
                      <select
                        value={bannerCropPosition}
                        onChange={(e) => setBannerCropPosition(e.target.value as any)}
                        className="px-2 py-1.5 bg-white border border-[#E5E7EB] rounded-[8px] text-[11px] shrink-0"
                      >
                        <option value="center">Crop: Center</option>
                        <option value="top">Crop: Top</option>
                        <option value="bottom">Crop: Bottom</option>
                      </select>
                    </div>

                    {/* Curated Banner Presets */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-[#6B7280]">
                        Curated Editorial Banner Presets:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setBannerUrl(GENERATED_ASSETS.heroStudio)}
                          className="p-1.5 text-left border border-[#E5E7EB] rounded-[6px] hover:bg-gray-50 text-[10px]"
                        >
                          <div className="font-semibold text-[#111827]">Velora Studio</div>
                          <div className="text-[#9CA3AF]">Warm atelier showroom</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBannerUrl(GENERATED_ASSETS.leatherTote)}
                          className="p-1.5 text-left border border-[#E5E7EB] rounded-[6px] hover:bg-gray-50 text-[10px]"
                        >
                          <div className="font-semibold text-[#111827]">Artisanal Workshop</div>
                          <div className="text-[#9CA3AF]">Handcrafted leathercraft</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-[10px]"
                >
                  Save & Apply Branding to /{store.slug}
                </button>
              </form>

              {/* Live Desktop / Mobile Storefront Preview */}
              <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div>
                    <span className="font-display font-bold text-sm text-[#111827]">
                      Live Storefront Preview ({brandPreset} Preset)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]">
                    <button
                      type="button"
                      onClick={() => setPreviewViewport('desktop')}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 ${
                        previewViewport === 'desktop'
                          ? 'bg-white text-[#111827] shadow-2xs'
                          : 'text-[#6B7280]'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewport('mobile')}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 ${
                        previewViewport === 'mobile'
                          ? 'bg-white text-[#111827] shadow-2xs'
                          : 'text-[#6B7280]'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                <div
                  className={`mx-auto border border-[#E5E7EB] rounded-[14px] overflow-hidden bg-white transition-all ${
                    previewViewport === 'mobile' ? 'max-w-[360px]' : 'w-full'
                  }`}
                >
                  {/* Preview Brand Header with Logo */}
                  <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Brand Logo"
                          className="w-7 h-7 rounded-[6px] object-cover border border-[#E5E7EB]"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-[6px] bg-gray-100 border border-[#E5E7EB] flex items-center justify-center font-bold text-[10px] text-gray-500">
                          {(storeName || store.name || 'V').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-display font-bold text-sm" style={{ color: secondaryColor }}>
                        {storeName || store.name}
                      </span>
                    </div>
                    <span
                      style={{ backgroundColor: primaryColor }}
                      className={`px-3 py-1 text-[11px] font-semibold text-white ${
                        buttonStyle === 'pill'
                          ? 'rounded-full'
                          : buttonStyle === 'sharp'
                          ? 'rounded-none'
                          : 'rounded-[6px]'
                      }`}
                    >
                      Order on WhatsApp
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="aspect-[16/9] rounded-[10px] overflow-hidden bg-[#F8FAFC]">
                      <SafeImage
                        src={bannerUrl}
                        alt="Banner Preview"
                        className={`w-full h-full object-cover ${
                          bannerCropPosition === 'top'
                            ? 'object-top'
                            : bannerCropPosition === 'bottom'
                            ? 'object-bottom'
                            : 'object-center'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="font-display font-bold text-lg" style={{ color: secondaryColor }}>
                        {storeTagline || store.tagline}
                      </div>
                      <p className="text-xs text-[#6B7280] line-clamp-2">
                        {storeAbout || store.about}
                      </p>
                    </div>
                    <div
                      className={`grid gap-3 ${
                        previewViewport === 'mobile' ? 'grid-cols-1' : 'grid-cols-2'
                      }`}
                    >
                      {products.slice(0, 2).map((p: any) => (
                        <div
                          key={p.id}
                          className="border border-[#E5E7EB] rounded-[10px] p-3 space-y-2"
                        >
                          <div className="aspect-[4/3] rounded-[6px] overflow-hidden">
                            <SafeImage
                              src={p.primaryImageUrl}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-xs font-bold truncate">{p.title}</div>
                          <div className="font-mono text-xs font-semibold" style={{ color: primaryColor }}>
                            ₹{Number(p.customerPrice).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}



          {/* ============================================================== */}
          {/* VIEW 9: STORE SETTINGS (/app/settings)                         */}
          {/* ============================================================== */}
          {pathname === '/app/settings' && (
            <>
            <form
              onSubmit={handleSaveBrandingOrSettings}
              className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 space-y-6 max-w-3xl text-xs"
            >
              <div>
                <h1 className="font-display text-xl font-bold text-[#111827]">
                  Store Settings, WhatsApp & Policies
                </h1>
                <p className="text-[#6B7280]">
                  Configure your public store details, WhatsApp number, shipping rates, and return
                  window.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Store Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">WhatsApp Order Number</label>
                  <input
                    type="text"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Tagline</label>
                  <input
                    type="text"
                    value={storeTagline}
                    onChange={(e) => setStoreTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">About the Brand</label>
                  <textarea
                    rows={2}
                    value={storeAbout}
                    onChange={(e) => setStoreAbout(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Flat Shipping Rate (INR)</label>
                  <input
                    type="number"
                    value={flatShippingRate}
                    onChange={(e) => setFlatShippingRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Free Shipping Threshold (INR)</label>
                  <input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Shipping Policy</label>
                  <textarea
                    rows={2}
                    value={shippingPolicy}
                    onChange={(e) => setShippingPolicy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Return & Exchange Policy</label>
                  <textarea
                    rows={2}
                    value={returnPolicy}
                    onChange={(e) => setReturnPolicy(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Storefront SEO Title</label>
                  <input
                    type="text"
                    value={storeSeoTitle}
                    onChange={(e) => setStoreSeoTitle(e.target.value)}
                    placeholder="Brand Storefront SEO Title"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Storefront SEO Meta Description</label>
                  <input
                    type="text"
                    value={storeSeoDescription}
                    onChange={(e) => setStoreSeoDescription(e.target.value)}
                    placeholder="120–160 char store summary for Google & social sharing"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="accent-[#2563EB]"
                  />
                  <span>Storefront Published Live at platform.com/{store.slug}</span>
                </label>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2563EB] text-white font-semibold rounded-[10px]"
                >
                  Save Store & SEO Settings
                </button>
              </div>
            </form>

            {/* Account Security & Password Change */}
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 space-y-5 text-xs max-w-3xl mt-6">
              <div>
                <h2 className="font-display text-lg font-bold text-[#111827]">
                  Account Security & Password
                </h2>
                <p className="text-[#6B7280]">
                  Update your account password. Updating your password will automatically revoke all other active sessions across devices.
                </p>
              </div>

              {pwSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-[8px] text-[#16A34A] font-medium">
                  {pwSuccessMsg}
                </div>
              )}
              {pwErrorMsg && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-[8px] text-[#DC2626] font-medium">
                  {pwErrorMsg}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block font-semibold mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your existing password"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827]"
                    >
                      {showCurrentPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#6B7280] hover:text-[#111827]"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwSubmitting}
                  className="px-5 py-2.5 bg-[#111827] hover:bg-[#1F2937] disabled:opacity-50 text-white font-semibold rounded-[8px] transition-colors"
                >
                  {pwSubmitting ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
            </>
          )}

          {/* ============================================================== */}
          {/* VIEW 10: NOTIFICATIONS (/app/notifications)                    */}
          {/* ============================================================== */}
          {pathname === '/app/notifications' && (
            <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4">
              <div>
                <h1 className="font-display text-xl font-bold text-[#111827]">
                  Transactional & Security Notifications
                </h1>
                <p className="text-xs text-[#6B7280]">
                  In-app, email, and WhatsApp alerts for activation, webhook payments, shipping,
                  returns, and payouts.
                </p>
              </div>
              <div className="divide-y divide-[#E5E7EB]">
                {notifications.map((n: any) => (
                  <div key={n.id} className="py-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-[#111827]">
                        {n.title} ·{' '}
                        <span className="font-mono text-[#2563EB] uppercase">{n.channel}</span>
                      </div>
                      <p className="text-[#6B7280]">{n.message}</p>
                    </div>
                    <span className="font-mono text-[11px] text-[#6B7280] whitespace-nowrap">
                      {n.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 11: TWO-TIER SUPPORT TICKETING (/app/support)             */}
          {/* ============================================================== */}
          {pathname === '/app/support' && (
            <div className="space-y-6 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#111827]">
                    Support & Ticketing Desk (Specification v2.0 Section 8)
                  </h1>
                  <p className="text-[#6B7280]">
                    Manage incoming Buyer-to-Seller tickets for /{store.slug} and raise Seller-to-Admin
                    operational tickets.
                  </p>
                </div>
                <div className="flex gap-1.5 p-1 bg-white border border-[#E5E7EB] rounded-[10px]">
                  <button
                    type="button"
                    onClick={() => setSupportTab('buyer_tickets')}
                    className={`px-3.5 py-2 rounded-[8px] font-semibold ${
                      supportTab === 'buyer_tickets'
                        ? 'bg-[#111827] text-white'
                        : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    Buyer-to-Seller Queue (
                    {
                      supportTickets.filter((t: any) => t.ticketScope === 'buyer_to_seller')
                        .length
                    }
                    )
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupportTab('admin_tickets')}
                    className={`px-3.5 py-2 rounded-[8px] font-semibold ${
                      supportTab === 'admin_tickets'
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    Seller-to-Admin Tickets (
                    {
                      supportTickets.filter((t: any) => t.ticketScope === 'seller_to_admin')
                        .length
                    }
                    )
                  </button>
                </div>
              </div>

              {supportTab === 'buyer_tickets' ? (
                <div className="space-y-4">
                  {supportTickets
                    .filter((t: any) => t.ticketScope === 'buyer_to_seller')
                    .map((tkt: any) => (
                      <div
                        key={tkt.id}
                        className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                          <div>
                            <span className="font-mono font-bold text-[#2563EB] mr-2">
                              {tkt.ticketRef}
                            </span>
                            <strong className="text-sm text-[#111827]">{tkt.subject}</strong>
                            <div className="text-[#6B7280] mt-0.5">
                              Buyer: <strong>{tkt.requesterName}</strong> ({tkt.requesterContact}) ·
                              Category: {tkt.category}{' '}
                              {tkt.relatedRef ? `· Ref: ${tkt.relatedRef}` : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold px-2.5 py-1 rounded-[6px] bg-[#F8FAFC] border border-[#E5E7EB]">
                              {tkt.status}
                            </span>
                            {['In Progress', 'Waiting for Customer', 'Resolved', 'Closed'].map(
                              (st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleReplySupportTicket(tkt.id, st)}
                                  className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB] rounded-[6px] font-semibold"
                                >
                                  Mark {st}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 bg-[#F8FAFC] p-4 rounded-[10px] border border-[#E5E7EB]">
                          {tkt.messages?.map((m: any) => (
                            <div key={m.id} className="space-y-0.5">
                              <div className="font-semibold text-[#111827]">
                                {m.senderName}{' '}
                                <span className="font-mono text-[10px] text-[#6B7280] uppercase">
                                  [{m.senderRole}]
                                </span>
                              </div>
                              <p className="text-[#6B7280]">{m.message}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyTexts[tkt.id] || ''}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({ ...prev, [tkt.id]: e.target.value }))
                            }
                            placeholder="Write reply to buyer..."
                            className="flex-1 px-3.5 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                          />
                          <button
                            type="button"
                            onClick={() => handleReplySupportTicket(tkt.id, 'Waiting for Customer')}
                            className="px-4 py-2 bg-[#2563EB] text-white font-semibold rounded-[8px]"
                          >
                            Send Reply
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form
                    onSubmit={handleCreateSellerTicket}
                    className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-[12px] p-6 space-y-4"
                  >
                    <h2 className="font-display text-base font-bold text-[#111827]">
                      Raise Ticket to Platform Admin
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Issue Category</label>
                        <select
                          value={newTicketCategory}
                          onChange={(e) => setNewTicketCategory(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                        >
                          <option value="Payout & Settlement">Payout & Settlement</option>
                          <option value="Store Verification / KYC">Store Verification / KYC</option>
                          <option value="Order / Payment Dispute">Order / Payment Dispute</option>
                          <option value="Product Moderation">Product Moderation</option>
                          <option value="Account Security">Account Security</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Priority</label>
                        <select
                          value={newTicketPriority}
                          onChange={(e) => setNewTicketPriority(e.target.value)}
                          className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Related Order / Payout Ref (Optional)
                      </label>
                      <input
                        type="text"
                        value={newTicketRef}
                        onChange={(e) => setNewTicketRef(e.target.value)}
                        placeholder="e.g., PAY-99201 or ORD-84920"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Subject *</label>
                      <input
                        type="text"
                        required
                        value={newTicketSubject}
                        onChange={(e) => setNewTicketSubject(e.target.value)}
                        placeholder="Brief summary of request"
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Message *</label>
                      <textarea
                        rows={3}
                        required
                        value={newTicketMessage}
                        onChange={(e) => setNewTicketMessage(e.target.value)}
                        placeholder="Provide details for Platform Admin Support..."
                        className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[8px]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#2563EB] text-white font-semibold rounded-[8px]"
                    >
                      Submit Ticket to Admin Desk
                    </button>
                  </form>

                  <div className="lg:col-span-7 space-y-4">
                    {supportTickets
                      .filter((t: any) => t.ticketScope === 'seller_to_admin')
                      .map((tkt: any) => (
                        <div
                          key={tkt.id}
                          className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                            <div>
                              <span className="font-mono font-bold text-[#2563EB] mr-2">
                                {tkt.ticketRef}
                              </span>
                              <strong>{tkt.subject}</strong>
                            </div>
                            <span className="font-mono text-[#D97706] font-semibold">
                              {tkt.priority} · {tkt.status}
                            </span>
                          </div>
                          <div className="space-y-2 bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E5E7EB]">
                            {tkt.messages?.map((m: any) => (
                              <div key={m.id}>
                                <strong className="text-[#111827]">{m.senderName}: </strong>
                                <span className="text-[#6B7280]">{m.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
