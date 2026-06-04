import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { createPaymentOrder, verifyPayment } from '../../services/subscriptionApi';
import { useAuth } from '../../context/AuthContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutPage: React.FC = () => {
  const { planId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { plan, billingCycle } = location.state || {};
  const { logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Create order
      const orderData = await createPaymentOrder(planId!, billingCycle);

      // Initialize Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'EnforData',
        description: `${orderData.plan_name} Subscription`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            await verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            // Payment done — end the temporary signup session and go straight
            // to login so the user signs in fresh with their now-paid account.
            await logout();
            navigate('/login', {
              replace: true,
              state: { message: 'Payment successful! Please log in to access your account.' },
            });
          } catch (err: any) {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#2563eb'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid plan selected</p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Complete Your Purchase</h1>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Order Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">{plan.display_name}</span>
                  <span className="font-semibold text-gray-900">₹{price}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Billing Cycle</span>
                  <span className="capitalize">{billingCycle}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{price}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h2>
              <div className="space-y-2">
                <FeatureItem text={`${plan.max_properties || 'Unlimited'} Properties`} />
                <FeatureItem text={`${plan.max_clients || 'Unlimited'} Clients`} />
                <FeatureItem text={`${plan.max_appointments_per_month || 'Unlimited'} Appointments/month`} />
                <FeatureItem text={`${plan.max_sms_messages_per_month || 0} SMS/month`} />
                <FeatureItem text={`${plan.max_whatsapp_messages_per_month || 0} WhatsApp/month`} />
                {plan.has_analytics && <FeatureItem text="Analytics Dashboard" />}
                {plan.has_advanced_analytics && <FeatureItem text="Advanced Analytics" />}
                {plan.has_priority_support && <FeatureItem text="Priority Support" />}
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : `Pay ₹${price}`}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center">
    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
    <span className="text-gray-700">{text}</span>
  </div>
);

export default CheckoutPage;
