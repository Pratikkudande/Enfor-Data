import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { ROUTES } from '../../routes/routePaths';
import apiClient from '../../services/apiClient';

const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-50">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
        <p className="text-gray-500 text-sm mb-6">This reset link is invalid or has expired. Please request a new one.</p>
        <Link to={ROUTES.FORGOT_PASSWORD} className="btn-primary w-full py-3 flex items-center justify-center">
          Request New Link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#6366F1' }} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h2>
        <p className="text-gray-500 text-sm mb-6">Your password has been reset. You can now sign in with your new password.</p>
        <button onClick={() => navigate(ROUTES.LOGIN)} className="btn-primary w-full py-3">
          Sign In
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, new_password: newPassword });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 outline-none transition-all';
  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'),
    onBlur:  (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.boxShadow = 'none'),
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
        <p className="text-gray-500 text-sm mt-1">Choose a strong password for your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={`${inputClass} pr-12`} {...focusStyle}
              placeholder="Min. 6 characters" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`${inputClass} pr-12`} {...focusStyle}
              placeholder="Re-enter new password" required />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading
            ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
