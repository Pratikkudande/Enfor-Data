import React from 'react';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import { SubscriptionPlan } from '../../services/subscriptionApi';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan | null;
  billingCycle: 'monthly' | 'annual';
  userData: any;
  onGoToDashboard: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  billingCycle,
  userData,
  onGoToDashboard
}) => {
  if (!isOpen || !selectedPlan) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const planPrice = billingCycle === 'monthly' ? selectedPlan.monthly_price : selectedPlan.annual_price;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Success Header */}
        <div className="text-center p-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Successful! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Welcome to ENFOR DATA! Your subscription has been activated.
          </p>

          {/* Subscription Details */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedPlan.display_name}
              </h3>
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatPrice(planPrice)}
              </div>
              <p className="text-gray-600">
                Billed {billingCycle === 'monthly' ? 'monthly' : 'annually'}
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-left mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Access Your Dashboard</h5>
                  <p className="text-sm text-gray-600">Start managing your properties, clients, and appointments</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Setup WhatsApp Marketing</h5>
                  <p className="text-sm text-gray-600">Connect your WhatsApp for automated client communication</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">Import Your Data</h5>
                  <p className="text-sm text-gray-600">Upload your existing property and client data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-gray-900 mb-3">Account Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{userData.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Business:</span>
                <span className="ml-2 font-medium">{userData.businessName}</span>
              </div>
              <div>
                <span className="text-gray-600">Location:</span>
                <span className="ml-2 font-medium">{userData.city}, {userData.state}</span>
              </div>
              <div>
                <span className="text-gray-600">Plan:</span>
                <span className="ml-2 font-medium">{selectedPlan.display_name}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onGoToDashboard}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Receipt
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Need help getting started?</strong><br />
              Contact our support team at{' '}
              <a href="mailto:support@enfordata.com" className="underline">
                support@enfordata.com
              </a>{' '}
              or call{' '}
              <a href="tel:+912245678900" className="underline">
                +91 22 4567 8900
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;