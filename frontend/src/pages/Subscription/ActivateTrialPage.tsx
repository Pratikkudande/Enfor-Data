import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateTrial } from '../../services/subscriptionApi';

const ActivateTrialPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleActivateTrial = async () => {
    setLoading(true);
    setError('');

    try {
      await activateTrial();

      // Success - redirect to dashboard
      navigate('/dashboard', {
        state: { message: 'Free trial activated successfully!' }
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to activate trial';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Free Trial
          </h1>
          <p className="text-gray-600">
            Get 15 days of full access. No credit card required.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <FeatureItem text="5 Properties" />
          <FeatureItem text="10 Clients" />
          <FeatureItem text="20 Appointments per month" />
          <FeatureItem text="50 SMS messages" />
          <FeatureItem text="Basic Analytics" />
          <FeatureItem text="Email Support" />
        </div>

        <button
          onClick={handleActivateTrial}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Activating...' : 'Activate Free Trial'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          By activating, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center">
    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
    <span className="text-gray-700">{text}</span>
  </div>
);

export default ActivateTrialPage;
