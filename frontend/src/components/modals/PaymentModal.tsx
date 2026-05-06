import React, { useState, useEffect } from 'react';
import { X, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { SubscriptionPlan, createPaymentOrder, verifyPayment } from '../../services/subscriptionApi';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan | null;
  billingCycle: 'monthly' | 'annual';
  userData: any;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  billingCycle,
  userData,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !selectedPlan) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const planPrice = billingCycle === 'monthly' ? selectedPlan.monthly_price : selectedPlan.annual_price;
  const savings = billingCycle === 'annual' ? 
    (selectedPlan.monthly_price * 12) - selectedPlan.annual_price : 0;

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('enfor_token');
      if (!token) {
        throw new Error('User not authenticated. Please login first.');
      }

      console.log('Creating payment order for plan:', selectedPlan.id, 'billing cycle:', billingCycle);
      
      // Create payment order
      const orderData = await createPaymentOrder(selectedPlan.id, billingCycle);
      
      console.log('Payment order created:', orderData);

      // Initialize Razorpay
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ENFOR DATA',
        description: `${selectedPlan.display_name} Subscription`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            // Verify payment
            await verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            // Success
            onPaymentSuccess();
          } catch (err: any) {
            setError('Payment verification failed. Please contact support.');
            console.error('Payment verification error:', err);
          }
        },
        prefill: {
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          contact: userData.whatsappNumber
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null) return 'Unlimited';
    return limit.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h2>
            <p className="text-gray-600 mt-1">Secure payment powered by Razorpay</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedPlan.display_name}</h4>
                <p className="text-gray-600">{selectedPlan.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(planPrice)}
                </div>
                <div className="text-sm text-gray-600">
                  per {billingCycle === 'monthly' ? 'month' : 'year'}
                </div>
                {savings > 0 && (
                  <div className="text-sm text-green-600 font-medium">
                    Save {formatPrice(savings)} annually
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Billing Cycle:</span>
                  <span className="ml-2 font-medium capitalize">{billingCycle}</span>
                </div>
                <div>
                  <span className="text-gray-600">Next Billing:</span>
                  <span className="ml-2 font-medium">
                    {new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Included */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FeatureItem text={`${formatLimit(selectedPlan.max_properties)} Properties`} />
              <FeatureItem text={`${formatLimit(selectedPlan.max_clients)} Clients`} />
              <FeatureItem text={`${formatLimit(selectedPlan.max_appointments_per_month)} Appointments/month`} />
              <FeatureItem text={`${formatLimit(selectedPlan.max_sms_messages_per_month)} SMS/month`} />
              <FeatureItem text={`${formatLimit(selectedPlan.max_whatsapp_messages_per_month)} WhatsApp/month`} />
              <FeatureItem text={`${formatLimit(selectedPlan.max_team_members)} Team Members`} />
              {selectedPlan.has_analytics && <FeatureItem text="Analytics Dashboard" />}
              {selectedPlan.has_advanced_analytics && <FeatureItem text="Advanced Analytics" />}
              {selectedPlan.has_priority_support && <FeatureItem text="Priority Support" />}
              {selectedPlan.has_api_access && <FeatureItem text="API Access" />}
            </div>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">{userData.firstName} {userData.lastName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{userData.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{userData.whatsappNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Business:</span>
                  <span className="ml-2 font-medium">{userData.businessName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h5 className="font-medium text-blue-900">Secure Payment</h5>
                <p className="text-sm text-blue-700 mt-1">
                  Your payment is secured with 256-bit SSL encryption. We don't store your card details.
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total Amount</span>
              <span className="text-blue-600">{formatPrice(planPrice)}</span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pay {formatPrice(planPrice)}
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            By clicking "Pay", you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center">
    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
    <span className="text-gray-700 text-sm">{text}</span>
  </div>
);

export default PaymentModal;