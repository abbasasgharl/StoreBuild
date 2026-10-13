import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicHeader } from '../../components/PublicHeader.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Lock, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const {
    signInWithGoogle,
    loginSellerWithCredentials,
    loginAdminWith2FA,
    switchDemoPersona,
    loading,
  } = useAuth();
  const navigate = useNavigate();

  const [portalMode, setPortalMode] = useState<'seller' | 'admin' | 'reset'>('seller');

  // Seller Login State (Username or Email + Password + Optional OTP)
  const [sellerIdentifier, setSellerIdentifier] = useState('velora_founder');
  const [sellerPassword, setSellerPassword] = useState('Velora@2026');
  const [sellerOtpCode, setSellerOtpCode] = useState('123456');

  // Separate Admin Portal State (Username + Strong Password + Mandatory 2FA)
  const [adminUser, setAdminUser] = useState('admin_root');
  const [adminPassword, setAdminPassword] = useState('AdminGov#2026');
  const [admin2faCode, setAdmin2faCode] = useState('246810');

  // Password Reset Flow State
  const [resetEmail, setResetEmail] = useState('founder@veloraboutique.in');
  const [resetOtp, setResetOtp] = useState('123456');
  const [newPassword, setNewPassword] = useState('Velora@2026');
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
          'Google Sign-In popup could not complete in this preview window. Use Seller Credentials or Instant Role Access below.'
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
        otpCode: sellerOtpCode,
      });
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid seller credentials.');
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginAdminWith2FA({
        usernameOrEmail: adminUser,
        password: adminPassword,
        twoFactorCode: admin2faCode,
      });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Admin 2FA authentication failed.');
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
      setResetSuccess(data.message || 'Password updated and hashed with salted scrypt.');
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
              Admin Portal (2FA)
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
              {portalMode === 'seller' && 'Specification v2.0 · Seller Authentication'}
              {portalMode === 'admin' && 'Specification v2.0 · Separate Admin Portal (RBAC + 2FA)'}
              {portalMode === 'reset' && 'Specification v2.0 · Salted Scrypt Password Reset'}
            </div>
            <h1 className="font-display text-2xl font-bold text-[#111827]">
              {portalMode === 'seller' && 'Sign in to Your Seller Console'}
              {portalMode === 'admin' && 'Admin Governance Portal Login'}
              {portalMode === 'reset' && 'Reset Seller Account Password'}
            </h1>
            <p className="text-xs text-[#6B7280]">
              {portalMode === 'seller' &&
                'Authenticate with Username or Email + Password (or Google OAuth). Passwords are verified against salted scrypt hashes.'}
              {portalMode === 'admin' &&
                'Admin access requires a separate Admin username, strong password, and mandatory 6-digit 2FA verification code.'}
              {portalMode === 'reset' &&
                'Verify your registered email OTP to set a new password and revoke prior active sessions.'}
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
                  Seller Username or Email *
                </label>
                <input
                  type="text"
                  required
                  value={sellerIdentifier}
                  onChange={(e) => setSellerIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  placeholder="velora_founder or founder@veloraboutique.in"
                />
                <div className="text-[11px] text-[#6B7280] mt-1 font-mono">
                  Demo usernames: velora_founder · arastudio_kabir
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  />
                  <div className="text-[11px] text-[#6B7280] mt-1 font-mono">
                    Demo pass: Velora@2026
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Security OTP (Optional 2FA)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={sellerOtpCode}
                    onChange={(e) => setSellerOtpCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm tracking-widest text-[#111827] focus:outline-none focus:border-[#2563EB]"
                  />
                  <div className="text-[11px] text-[#16A34A] mt-1 font-mono">OTP: 123456</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{loading ? 'Verifying Credentials...' : 'Sign In to Seller Workspace'}</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#111827] text-xs font-semibold rounded-[10px] transition-colors"
              >
                Continue with Google OAuth
              </button>
            </form>
          )}

          {/* MODE 2: SEPARATE ADMIN PORTAL (USERNAME + STRONG PASSWORD + MANDATORY 2FA) */}
          {portalMode === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Admin Username or Compliance Email *
                </label>
                <input
                  type="text"
                  required
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm text-[#111827]"
                />
                <div className="text-[11px] text-[#6B7280] mt-1 font-mono">
                  Default: admin_root (or compliance@platform.com)
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Strong Admin Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
                  />
                  <div className="text-[11px] text-[#6B7280] mt-1 font-mono">
                    Demo: AdminGov#2026
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Mandatory 2FA Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={admin2faCode}
                    onChange={(e) => setAdmin2faCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm tracking-widest"
                  />
                  <div className="text-[11px] text-[#16A34A] mt-1 font-mono">
                    2FA TOTP: 246810
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#111827] hover:bg-[#1F2937] text-white text-sm font-semibold rounded-[10px] transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span>
                  {loading ? 'Verifying 2FA & RBAC...' : 'Verify 2FA & Enter Admin Console'}
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
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    Email Verification OTP *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                    New Strong Password (≥8 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] text-sm"
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

          {/* Instant Multi-Tenant Role Switcher */}
          <div className="pt-4 border-t border-[#E5E7EB] space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Instant Multi-Tenant Role Evaluation</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('velora');
                  navigate('/app/dashboard');
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB] rounded-[8px] flex items-center justify-between"
              >
                <span>
                  <strong className="text-[#111827]">Seller 1: Velora Atelier</strong> ·
                  velora_founder · /velora
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('arastudio');
                  navigate('/app/dashboard');
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB] rounded-[8px] flex items-center justify-between"
              >
                <span>
                  <strong className="text-[#111827]">Seller 2: Ara Studio Ceramics</strong> ·
                  arastudio_kabir · /arastudio
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoPersona('admin');
                  navigate('/admin');
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs bg-[#F8FAFC] hover:bg-slate-100 border border-[#E5E7EB] rounded-[8px] flex items-center justify-between"
              >
                <span>
                  <strong className="text-[#111827]">Platform Admin Console</strong> · 14 Modules +
                  Co-Worker Agent
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6B7280]" />
              </button>
            </div>
          </div>

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
