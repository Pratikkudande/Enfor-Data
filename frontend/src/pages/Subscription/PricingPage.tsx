import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionPlans, SubscriptionPlan } from '../../services/subscriptionApi';
import { useAuth } from '../../context/AuthContext';
import RegistrationModal from '../../components/modals/RegistrationModal';
import PaymentModal from '../../components/modals/PaymentModal';
import SuccessModal from '../../components/modals/SuccessModal';

// Using SubscriptionPlan type from subscriptionApi

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const plansData = await getSubscriptionPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setError('Failed to load pricing plans. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    
    // If user is authenticated, go directly to checkout
    if (user) {
      if (plan.name === 'free_trial') {
        navigate('/subscription/activate-trial');
      } else {
        navigate(`/subscription/checkout/${plan.id}`, { state: { plan, billingCycle } });
      }
      return;
    }

    // If user is not authenticated, show registration modal
    if (plan.name === 'free_trial') {
      // For free trial, redirect to login with message
      navigate('/login', { 
        state: { 
          returnTo: `/subscription/activate-trial`,
          message: 'Please login to activate your free trial' 
        }
      });
    } else {
      // For paid plans, show registration modal
      setShowRegistrationModal(true);
    }
  };

  const handleRegistrationComplete = async (registrationData: any) => {
    setUserData(registrationData);
    setShowRegistrationModal(false);
    
    // Small delay to ensure tokens are properly stored
    setTimeout(() => {
      setShowPaymentModal(true);
    }, 100);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowSuccessModal(true);
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
    navigate('/dashboard');
  };

  const closeAllModals = () => {
    setShowRegistrationModal(false);
    setShowPaymentModal(false);
    setShowSuccessModal(false);
    setSelectedPlan(null);
    setUserData(null);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatLimit = (limit: number | null) => {
    if (limit === null) return 'Unlimited';
    return limit.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              fetchPlans();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start with a 15-day free trial. No credit card required.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.is_popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.is_popular && (
                <div className="bg-blue-600 text-white text-center py-2 text-sm font-semibold">
                  MOST POPULAR
                </div>
              )}

              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.display_name}
                </h3>
                <p className="text-gray-600 text-sm mb-6 h-12">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(
                      billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price
                    )}
                  </span>
                  <span className="text-gray-600">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    plan.is_popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.name === 'free_trial' ? 'Start Free Trial' : 'Get Started'}
                </button>

                <div className="mt-6 space-y-3">
                  <Feature
                    text={`${formatLimit(plan.max_properties)} Properties`}
                    included={true}
                  />
                  <Feature
                    text={`${formatLimit(plan.max_clients)} Clients`}
                    included={true}
                  />
                  <Feature
                    text={`${formatLimit(plan.max_appointments_per_month)} Appointments/month`}
                    included={true}
                  />
                  <Feature
                    text={`${formatLimit(plan.max_sms_messages_per_month)} SMS/month`}
                    included={plan.max_sms_messages_per_month !== null && plan.max_sms_messages_per_month > 0}
                  />
                  <Feature
                    text={`${formatLimit(plan.max_whatsapp_messages_per_month)} WhatsApp/month`}
                    included={plan.max_whatsapp_messages_per_month !== null && plan.max_whatsapp_messages_per_month > 0}
                  />
                  <Feature
                    text="Basic Analytics"
                    included={plan.has_analytics}
                  />
                  <Feature
                    text="Advanced Analytics"
                    included={plan.has_advanced_analytics}
                  />
                  <Feature
                    text="Priority Support"
                    included={plan.has_priority_support}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto text-left space-y-4">
            <FAQItem
              question="Can I change plans later?"
              answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
            />
            <FAQItem
              question="What happens after my trial ends?"
              answer="After your 15-day trial, you'll need to subscribe to a paid plan to continue using premium features."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee on all paid plans."
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={closeAllModals}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
        onRegistrationComplete={handleRegistrationComplete}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={closeAllModals}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
        userData={userData}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={closeAllModals}
        selectedPlan={selectedPlan}
        billingCycle={billingCycle}
        userData={userData}
        onGoToDashboard={handleGoToDashboard}
      />
    </div>
  );
};

const Feature: React.FC<{ text: string; included: boolean }> = ({ text, included }) => (
  <div className="flex items-center">
    {included ? (
      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-gray-300 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )}
    <span className={included ? 'text-gray-700' : 'text-gray-400 line-through'}>
      {text}
    </span>
  </div>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="font-semibold text-gray-900 mb-2">{question}</h3>
    <p className="text-gray-600">{answer}</p>
  </div>
);

export default PricingPage;
