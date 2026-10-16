import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import HomePage from './pages/public/HomePage.tsx';
import PricingPage from './pages/public/PricingPage.tsx';
import LoginPage from './pages/public/LoginPage.tsx';
import CreateStorePage from './pages/public/CreateStorePage.tsx';
import SellerWorkspace from './pages/seller/SellerWorkspace.tsx';
import StorefrontHomePage from './pages/storefront/StorefrontHomePage.tsx';
import StorefrontProductPage from './pages/storefront/StorefrontProductPage.tsx';
import CheckoutOrderPage from './pages/storefront/CheckoutOrderPage.tsx';
import AdminConsolePage from './pages/admin/AdminConsolePage.tsx';

/**
 * Route-level Protected View Gate
 * Strictly enforces that unauthenticated requests to protected dashboards
 * immediately trigger a hard redirect to /login (Rule N001 & Section 3.1).
 */
function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactElement;
  requiredRole?: 'seller' | 'admin';
}) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 text-sm text-[#6B7280]">
        Verifying authorization...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && session.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Surface */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/create-store" element={<CreateStorePage />} />

        {/* Seller Dashboard Surface (Protected Views -> Hard Redirect to /login if unauthenticated) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/products"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/products/new"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/orders"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/orders/:id"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/wallet"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/payouts"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/branding"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/settings"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/notifications"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/support"
          element={
            <ProtectedRoute requiredRole="seller">
              <SellerWorkspace />
            </ProtectedRoute>
          }
        />

        {/* Admin Console Surface (Protected Views -> Hard Redirect to /login if unauthenticated) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/sellers"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stores"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/wallet"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/payouts"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/gateways"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rbac"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/agent"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/seo"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/ads"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminConsolePage />
            </ProtectedRoute>
          }
        />

        {/* Storefront Checkout Link */}
        <Route path="/checkout/:orderRef" element={<CheckoutOrderPage />} />

        {/* Public Branded Storefront Surface (platform.com/{storeSlug}) */}
        <Route path="/:storeSlug" element={<StorefrontHomePage />} />
        <Route path="/:storeSlug/product/:productSlug" element={<StorefrontProductPage />} />
      </Routes>
    </AuthProvider>
  );
}
