import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { ROUTES } from '../../routes/routePaths';
import apiClient from '../../services/apiClient';

const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const startTimer = () => {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setSendingOtp(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setOtpSent(true);
      startTimer();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { email, otp, new_password: newPassword });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP or it has expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 outline-none transition-all';
  const focus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = 'none'),
  };

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#6366F1' }} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
        <p className="text-gray-500 text-sm mb-6">Your password has been reset. You can now sign in.</p>
        <button onClick={() => navigate(ROUTES.LOGIN)} className="btn-primary w-full py-3">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: '#6366F1' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-gray-500 text-sm mt-1">
          {otpSent ? `OTP sent to ${email}` : 'Enter your email to receive an OTP'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Step 1 — email + send OTP */}
      {!otpSent && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className={inputClass} {...focus}
              placeholder="Enter your registered email" required />
          </div>
          <button type="submit" disabled={sendingOtp} className="btn-primary w-full py-3">
            {sendingOtp
              ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              : 'Send OTP'}
          </button>
        </form>
      )}

      {/* Step 2 — OTP + new password */}
      {otpSent && (
        <form onSubmit={handleReset} className="space-y-5">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" value={email} readOnly
              className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed`} />
          </div>

          {/* OTP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={`${inputClass} text-center text-2xl tracking-widest font-bold`}
              {...focus}
              placeholder="• • • • • •"
              maxLength={6}
              required
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-400">OTP valid for 10 minutes</p>
              <button type="button" onClick={() => handleSendOtp()}
                disabled={resendTimer > 0 || sendingOtp}
                className="text-xs disabled:opacity-40 transition-colors"
                style={{ color: '#6366F1' }}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={`${inputClass} pr-12`} {...focus}
                placeholder="Min. 6 characters" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`${inputClass} pr-12`} {...focus}
                placeholder="Re-enter new password" required />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
            {loading
              ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
              : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
