import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Payment is done — end the temporary signup session so the user logs in fresh.
  const goToLogin = async () => {
    await logout();
    navigate('/login', {
      replace: true,
      state: { message: 'Payment successful! Please log in to access your account.' },
    });
  };

  // Auto-redirect to login a few seconds after showing the confirmation.
  useEffect(() => {
    const t = setTimeout(() => { goToLogin(); }, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-8">
          Your subscription has been activated. Please log in to access your account.
        </p>

        <div className="space-y-3">
          <button
            onClick={goToLogin}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700"
          >
            Continue to Login
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Redirecting you to the login page…
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
