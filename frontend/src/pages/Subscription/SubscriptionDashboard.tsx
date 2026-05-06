import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentSubscription, cancelSubscription, SubscriptionDetails } from '../../services/subscriptionApi';

// Using SubscriptionDetails type from subscriptionApi

const SubscriptionDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const subscriptionData = await getCurrentSubscription();
      
      if (!subscriptionData) {
        navigate('/pricing');
        return;
      }

      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      await cancelSubscription();
      
      alert('Subscription canceled successfully');
      fetchSubscription();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Subscription Management
        </h1>

        {/* Trial Warning */}
        {subscription.subscription.is_trial && subscription.days_left <= 7 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800">
                  Your trial ends in {subscription.days_left} days
                </p>
                <p className="text-sm text-yellow-700">
                  Subscribe to a paid plan to continue using all features
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              View Plans
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Current Plan
            </h2>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {subscription.plan.display_name}
                </h3>
                <p className="text-gray-600">
                  {subscription.subscription.is_trial ? 'Free Trial' : `₹${subscription.plan.monthly_price}/month`}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                subscription.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {subscription.subscription.status}
              </span>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                {subscription.subscription.is_trial ? 'Trial ends' : 'Next billing date'}:
                <span className="font-semibold text-gray-900 ml-2">
                  {formatDate(subscription.subscription.current_period_end)}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Days remaining: <span className="font-semibold text-gray-900">{subscription.days_left}</span>
              </p>
            </div>

            <div className="mt-6 flex space-x-4">
              {subscription.subscription.is_trial ? (
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Upgrade Now
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    Cancel Subscription
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Usage This Month
            </h2>

            <div className="space-y-4">
              <UsageStat
                label="Properties"
                current={subscription.usage.properties}
                limit={5}
              />
              <UsageStat
                label="Clients"
                current={subscription.usage.clients}
                limit={10}
              />
              <UsageStat
                label="Appointments"
                current={subscription.usage.appointments}
                limit={20}
              />
              <UsageStat
                label="SMS Messages"
                current={subscription.usage.sms_messages}
                limit={50}
              />
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment History
          </h2>
          <p className="text-gray-600">No payment history available</p>
        </div>
      </div>
    </div>
  );
};

const UsageStat: React.FC<{ label: string; current: number; limit: number }> = ({
  label,
  current,
  limit
}) => {
  const percentage = (current / limit) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-900 font-semibold">
          {current} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            percentage >= 90 ? 'bg-red-600' : percentage >= 70 ? 'bg-yellow-600' : 'bg-green-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default SubscriptionDashboard;
