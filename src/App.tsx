import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import HomePage from './pages/public/HomePage.tsx';
import PricingPage from './pages/public/PricingPage.tsx';
import LoginPage from './pages/public/LoginPage.tsx';
import CreateStorePage from './pages/public/CreateStorePage.tsx';
import SellerWorkspace from './pages/seller/SellerWorkspace.tsx';
import StorefrontHomePage from './pages/storefront/StorefrontHomePage.tsx';
import StorefrontProductPage from './pages/storefront/StorefrontProductPage.tsx';
import CheckoutOrderPage from './pages/storefront/CheckoutOrderPage.tsx';
import AdminConsolePage from './pages/admin/AdminConsolePage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Surface */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-store" element={<CreateStorePage />} />

        {/* Seller Dashboard Surface */}
        <Route path="/app" element={<SellerWorkspace />} />
        <Route path="/app/dashboard" element={<SellerWorkspace />} />
        <Route path="/app/products" element={<SellerWorkspace />} />
        <Route path="/app/products/new" element={<SellerWorkspace />} />
        <Route path="/app/orders" element={<SellerWorkspace />} />
        <Route path="/app/orders/:id" element={<SellerWorkspace />} />
        <Route path="/app/wallet" element={<SellerWorkspace />} />
        <Route path="/app/payouts" element={<SellerWorkspace />} />
        <Route path="/app/branding" element={<SellerWorkspace />} />
        <Route path="/app/settings" element={<SellerWorkspace />} />
        <Route path="/app/notifications" element={<SellerWorkspace />} />
        <Route path="/app/support" element={<SellerWorkspace />} />

        {/* Admin Console Surface (14 Specification v2.0 Modules) */}
        <Route path="/admin" element={<AdminConsolePage />} />
        <Route path="/admin/sellers" element={<AdminConsolePage />} />
        <Route path="/admin/stores" element={<AdminConsolePage />} />
        <Route path="/admin/products" element={<AdminConsolePage />} />
        <Route path="/admin/orders" element={<AdminConsolePage />} />
        <Route path="/admin/wallet" element={<AdminConsolePage />} />
        <Route path="/admin/payouts" element={<AdminConsolePage />} />
        <Route path="/admin/disputes" element={<AdminConsolePage />} />
        <Route path="/admin/tickets" element={<AdminConsolePage />} />
        <Route path="/admin/rbac" element={<AdminConsolePage />} />
        <Route path="/admin/agent" element={<AdminConsolePage />} />
        <Route path="/admin/seo" element={<AdminConsolePage />} />
        <Route path="/admin/ads" element={<AdminConsolePage />} />
        <Route path="/admin/audit" element={<AdminConsolePage />} />

        {/* Storefront Checkout Link */}
        <Route path="/checkout/:orderRef" element={<CheckoutOrderPage />} />

        {/* Public Branded Storefront Surface (platform.com/{storeSlug}) */}
        <Route path="/:storeSlug" element={<StorefrontHomePage />} />
        <Route path="/:storeSlug/product/:productSlug" element={<StorefrontProductPage />} />
      </Routes>
    </AuthProvider>
  );
}
