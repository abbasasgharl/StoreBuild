import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicHeader } from '../../components/PublicHeader.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Lock, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const {
    signInWithGoogle,
    loginSellerWithCredentials,
    loginAdminWithCredentials,
    loading,
  } = useAuth();
  const navigate = useNavigate();

  const [portalMode, setPortalMode] = useState<'seller' | 'admin' | 'reset'>('seller');

  // Seller Login State (Username or Email + Password)
  const [sellerIdentifier, setSellerIdentifier] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');

  // Admin Portal State (Username or Email + Password)
  const [adminUser, setAdminUser] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Password Reset Flow State
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithGoogle();
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(
        err?.message ||
          'Google Sign-In could not complete. Please enter your email and password below.'
      );
    }
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginSellerWithCredentials({
        identifier: sellerIdentifier,
        password: sellerPassword,
      });
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || "That email or password isn't right. Please try again.");
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginAdminWithCredentials({
        usernameOrEmail: adminUser,
        password: adminPassword,
      });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || "That email or password isn't right. Please try again.");
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          otpCode: resetOtp,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');
      setResetSuccess(data.message || 'Password successfully updated.');
    } catch (err: any) {
      setError(err.message || 'Could not reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-[#E5E7EB] rounded-[18px] p-8 shadow-xs space-y-6">
          {/* Portal Mode Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setPortalMode('seller');
                setError('');
              }}
              className={`py-2 px-3 rounded-[8px] transition-colors ${
                portalMode === 'seller'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Seller Workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('admin');
                setError('');
              }}
              className={`py-2 px-3 rounded-[8px] transition-colors ${
                portalMode === 'admin'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => {
                setPortalMode('reset');
                setError('');
              }}
              className={`py-2 px-3 rounded-[8px] transition-colors ${
                portalMode === 'reset'
                  ? 'bg-[#111827] text-white'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              Reset Password
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#2563EB]">
              {portalMode === 'seller' && 'Seller Account Access'}
              {portalMode === 'admin' && 'Platform Governance'}
              {portalMode === 'reset' && 'Account Recovery'}
            </div>
            <h1 className="font-display text-2xl font-bold text-[#111827]">
              {portalMode === 'seller' && 'Sign in to Your Store'}
              {portalMode === 'admin' && 'Admin Governance Console'}
              {portalMode === 'reset' && 'Reset Account Password'}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {portalMode === 'seller' &&
                'Log in with your username or email address and password to manage your storefront.'}
              {portalMode === 'admin' &&
                'Authorized platform administrators can sign in using their admin credentials.'}
              {portalMode === 'reset' &&
                'Enter your registered email address and verification code to set a new password.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-[10px] bg-red-50 border border-red-200 text-xs text-[#DC2626]">
              {error}
            </div>
          )}

          {resetSuccess && (
            <div className="p-3.5 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-[#16A34A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {/* MODE 1: SELLER LOGIN */}
          {portalMode === 'seller' && (
            <form onSubmit={handleSellerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Email or Username *
                </label>
                <input
                  type="text"
                  required
                  value={sellerIdentifier}
                  onChange={(e) => setSellerIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  placeholder="Enter your email or username"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={sellerPassword}
                  onChange={(e) => setSellerPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Signing In...' : 'Sign In to Workspace'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#111827] text-xs font-semibold rounded-[10px] transition-colors"
              >
                Continue with Google
              </button>
            </form>
          )}

          {/* MODE 2: ADMIN LOGIN (STANDARD USERNAME/EMAIL + PASSWORD) */}
          {portalMode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Administrator Username or Email *
                </label>
                <input
                  type="text"
                  required
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  placeholder="admin@platform.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  placeholder="Enter administrator password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span>
                  {loading ? 'Verifying Credentials...' : 'Sign In to Admin Console'}
                </span>
              </button>
            </form>
          )}

          {/* MODE 3: PASSWORD RESET */}
          {portalMode === 'reset' && (
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Registered Account Email *
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  placeholder="name@example.com"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Email Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                    placeholder="6-digit code"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    New Password (≥8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                    placeholder="At least 8 characters"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[10px] flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Update Password & Revoke Old Sessions</span>
              </button>
            </form>
          )}

          <div className="text-center text-xs text-[#6B7280] pt-1">
            New entrepreneur?{' '}
            <Link to="/create-store" className="text-[#2563EB] font-semibold hover:underline">
              Create your branded store →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
