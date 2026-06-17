import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentSubscription,
  cancelSubscription,
  getPaymentHistory,
  createSmsTopupOrder,
  verifySmsTopup,
  calcTopupPrice,
  SubscriptionDetails,
} from '../../services/subscriptionApi';
import { loadRazorpayScript } from '../../utils/razorpay';

// Using SubscriptionDetails type from subscriptionApi

const SubscriptionDashboard: React.FC = () => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  // SMS top-up modal
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupCount, setTopupCount] = useState('');
  const [topupProcessing, setTopupProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const history = await getPaymentHistory();
      setPayments(Array.isArray(history) ? history : []);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  };

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

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 5000);
  };

  const handleConfirmCancel = async () => {
    try {
      setCanceling(true);
      await cancelSubscription();
      setShowCancelModal(false);
      showToast('success', 'Subscription canceled successfully.');
      fetchSubscription();
    } catch (error: any) {
      setShowCancelModal(false);
      showToast('error', error.response?.data?.message || 'Failed to cancel subscription.');
    } finally {
      setCanceling(false);
    }
  };

  const handleTopupPay = async () => {
    const count = parseInt(topupCount, 10);
    if (!count || count <= 0) {
      showToast('error', 'Enter a valid number of SMS.');
      return;
    }
    setTopupProcessing(true);
    try {
      const ready = await loadRazorpayScript();
      if (!ready) {
        showToast('error', 'Failed to load the payment gateway. Please try again.');
        setTopupProcessing(false);
        return;
      }
      const order = await createSmsTopupOrder(count);
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'EnforData',
        description: order.plan_name,
        order_id: order.order_id,
        handler: async (response: any) => {
          try {
            await verifySmsTopup({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            setShowTopupModal(false);
            showToast('success', `${count.toLocaleString('en-IN')} SMS credits added successfully.`);
            fetchSubscription();
            fetchPayments();
          } catch {
            showToast('error', 'Payment verification failed.');
          } finally {
            setTopupProcessing(false);
          }
        },
        theme: { color: '#2563eb' },
        modal: { ondismiss: () => setTopupProcessing(false) },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to start payment.');
      setTopupProcessing(false);
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
                  {subscription.subscription.is_trial
                    ? 'Free Trial'
                    : `₹${Number(subscription.plan.annual_price).toLocaleString('en-IN')}/year`}
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

            {/* SMS Credits — plan credits + purchased top-ups, and how many remain */}
            {(subscription.plan.sms_credits > 0 || (subscription.subscription.sms_topup_credits || 0) > 0) && (() => {
              const planCredits = subscription.plan.sms_credits || 0;
              const topup = subscription.subscription.sms_topup_credits || 0;
              const total = planCredits + topup;
              const used = subscription.usage.sms_messages || 0;
              const remaining = Math.max(total - used, 0);
              const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0;
              return (
                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-blue-900">SMS Credits</p>
                      <p className="text-xs text-blue-700">
                        {used.toLocaleString()} used of {total.toLocaleString()} total
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">{remaining.toLocaleString()}</p>
                      <p className="text-xs text-blue-700">remaining</p>
                    </div>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Breakdown: subscription (plan) credits vs purchased top-ups */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white border border-blue-100 px-3 py-2">
                      <p className="text-xs text-gray-500">Subscription SMS</p>
                      <p className="text-base font-semibold text-blue-900">{planCredits.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-blue-100 px-3 py-2">
                      <p className="text-xs text-gray-500">Top-up SMS</p>
                      <p className="text-base font-semibold text-blue-900">{topup.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setTopupCount(''); setShowTopupModal(true); }}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Top up SMS
                  </button>
                </div>
              );
            })()}

            {/* <div className="mt-6 flex space-x-4">
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
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    Cancel Subscription
                  </button>
                </>
              )}
            </div> */}
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
                limit={(subscription.plan.sms_credits || 0) + (subscription.subscription.sms_topup_credits || 0) || 50}
              />
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment History
          </h2>
          {payments.length === 0 ? (
            <p className="text-gray-600">No payment history available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Billing</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 pr-4 text-gray-700">{formatDate(p.paid_at || p.created_at)}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {p.payment_type === 'sms_topup'
                          ? `SMS Top-up${p.sms_count ? ` (${Number(p.sms_count).toLocaleString('en-IN')} credits)` : ''}`
                          : 'Subscription'}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 pr-4 capitalize text-gray-600">{p.billing_cycle || '—'}</td>
                      <td className="py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : p.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* SMS Top-up modal */}
      {showTopupModal && (() => {
        const count = parseInt(topupCount, 10) || 0;
        const price = calcTopupPrice(count);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Top up SMS Credits</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter how many SMS credits you want to purchase. Pricing is tiered — the more you buy, the lower the per-SMS rate.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1">Number of SMS</label>
              <input
                type="number"
                min={1}
                value={topupCount}
                onChange={(e) => setTopupCount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="e.g. 12000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Rate tiers reference */}
              <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                <p>1–5,000: ₹0.40 · 5,001–10,000: ₹0.35 · 10,001–15,000: ₹0.30</p>
                <p>15,001–25,000: ₹0.27 · 25,000+: ₹0.25</p>
              </div>

              {count > 0 && (
                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-900 font-medium">{count.toLocaleString('en-IN')} SMS credits</p>
                    <p className="text-xs text-blue-700">Effective ₹{(price / count).toFixed(3)} / SMS</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowTopupModal(false)}
                  disabled={topupProcessing}
                  className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopupPay}
                  disabled={topupProcessing || count <= 0}
                  className="px-5 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {topupProcessing
                    ? 'Processing…'
                    : count > 0
                    ? `Pay ₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'Pay'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel confirmation modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Subscription?</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Are you sure you want to cancel your subscription? You’ll keep access until the end
                  of your current billing period.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={canceling}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={canceling}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center"
              >
                {canceling && (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white mr-2" />
                )}
                {canceling ? 'Canceling…' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white text-sm max-w-sm ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
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
