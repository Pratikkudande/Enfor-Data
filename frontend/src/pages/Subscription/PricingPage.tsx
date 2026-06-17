import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSubscriptionPlans, SubscriptionPlan } from '../../services/subscriptionApi';
import { useAuth } from '../../context/AuthContext';
import RegistrationModal from '../../components/modals/RegistrationModal';
import PaymentModal from '../../components/modals/PaymentModal';
import SuccessModal from '../../components/modals/SuccessModal';

// Using SubscriptionPlan type from subscriptionApi

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  // Plans are annual-only (GST-inclusive totals from the package sheet).
  const [billingCycle] = useState<'monthly' | 'annual'>('annual');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // Message passed when login is blocked due to no active subscription.
  const infoMessage = (location.state as { message?: string } | null)?.message;

  // Modal states
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState('');

  // Guard against React 18 StrictMode invoking this effect twice in development,
  // which would fire the /subscriptions/plans request two times.
  const didFetch = useRef(false);
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
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

    // A logged-in user, or a just-registered/blocked-login user with a
    // "payment pending" token, can go straight to checkout.
    const hasPendingToken =
      localStorage.getItem('enfor_payment_pending') === 'true' &&
      !!localStorage.getItem('enfor_token');

    if (user || hasPendingToken) {
      navigate(`/subscription/checkout/${plan.id}`, { state: { plan, billingCycle } });
      return;
    }

    // Brand-new visitor with no account yet — send them to the full registration
    // form (same fields as /register) for the chosen plan; after they create the
    // account they continue to checkout for this plan.
    navigate('/register', { state: { plan, billingCycle } });
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

  // Show only the plans for the user's role. The role comes from the logged-in
  // user, or — for a just-registered / blocked-login user pending payment — from
  // the role saved at that time. Anonymous visitors with no role see all plans.
  const effectiveRole = user?.role || localStorage.getItem('enfor_pending_role') || '';
  const visiblePlans = effectiveRole
    ? plans.filter(
        (p) => p.target_role === (effectiveRole === 'channel_partner' ? 'channel_partner' : 'broker')
      )
    : plans;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#030B24' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#030B24' }}>
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              fetchPlans();
            }}
            className="text-white px-6 py-2 rounded-lg font-semibold"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#030B24', color: '#fff' }}>
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,rgba(99,102,241,0.5),transparent 60%)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {infoMessage && (
          <div className="max-w-xl mx-auto mb-8 rounded-xl px-5 py-4 text-center text-sm font-medium border border-amber-400/40"
            style={{ background: 'rgba(245,158,11,0.12)', color: '#FCD34D' }}>
            {infoMessage}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-blue-500/30"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD' }}>
            ✨ Annual subscription · prices include GST
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg,#60A5FA,#A78BFA,#818CF8)' }}>
              Choose Your Plan
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Pick the annual plan that fits your business.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {visiblePlans.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1"
              style={
                plan.is_popular
                  ? {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(99,102,241,0.55)',
                      boxShadow: '0 0 40px rgba(99,102,241,0.35)',
                      backdropFilter: 'blur(16px)',
                    }
                  : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      backdropFilter: 'blur(16px)',
                    }
              }
            >
              {plan.is_popular && (
                <div className="text-white text-center py-2 text-xs font-bold tracking-wide"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                  MOST POPULAR
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{plan.display_name}</h3>
                <p className="text-gray-400 text-sm mb-5 min-h-[40px]">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-4xl font-extrabold text-white">
                    {formatPrice(billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {/* Short price breakdown: SMS cost + platform fee + GST = total */}
                {plan.sms_credits > 0 && (() => {
                  const smsCost = plan.sms_credits * plan.sms_rate;
                  const platformFee = 3600; // 12 months × ₹300
                  const subtotal = smsCost + platformFee;
                  const gst = subtotal * 0.18;
                  const inr = (n: number) =>
                    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  return (
                    <div className="mb-5 text-xs text-gray-400 space-y-1 border-y border-white/10 py-3">
                      <div className="flex justify-between">
                        <span>SMS ({plan.sms_credits.toLocaleString()} × ₹{plan.sms_rate.toFixed(2)})</span>
                        <span className="text-gray-300">{inr(smsCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform fee</span>
                        <span className="text-gray-300">{inr(platformFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%)</span>
                        <span className="text-gray-300">{inr(gst)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-white pt-1 border-t border-white/10">
                        <span>Total</span>
                        <span>{inr(subtotal + gst)}</span>
                      </div>
                    </div>
                  );
                })()}

                {plan.sms_credits > 0 && (
                  <div className="mb-5 rounded-xl px-4 py-3 text-center border border-blue-500/20"
                    style={{ background: 'rgba(59,130,246,0.10)' }}>
                    <div className="text-lg font-bold" style={{ color: '#93C5FD' }}>
                      {plan.sms_credits.toLocaleString()} SMS credits
                    </div>
                    <div className="text-xs text-blue-300/80">
                      at ₹{plan.sms_rate.toFixed(2)} / SMS
                    </div>
                  </div>
                )}

                <div className="space-y-3 flex-1">
                  <Feature text={`${formatLimit(plan.max_properties)} Properties`} included={true} />
                  <Feature text={`${formatLimit(plan.max_clients)} Clients`} included={true} />
                  <Feature text={`${formatLimit(plan.max_appointments_per_month)} Appointments/month`} included={true} />
                  <Feature text="Basic Analytics" included={plan.has_analytics} />
                  <Feature text="Advanced Analytics" included={plan.has_advanced_analytics} />
                  <Feature text="Priority Support" included={plan.has_priority_support} />
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className="mt-6 w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={
                    plan.is_popular
                      ? { background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: '#fff', boxShadow: '0 0 22px rgba(99,102,241,0.45)' }
                      : { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
                  }
                >
                  {plan.name === 'free_trial' ? 'Start Free Trial' : 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section — hidden for now
        <div className="mt-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto text-left space-y-4">
            <FAQItem
              question="Can I change plans later?"
              answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
            />
            <FAQItem
              question="Are prices inclusive of GST?"
              answer="Yes — every plan price shown is the final annual amount, inclusive of GST. There are no hidden charges."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="Yes, we offer a 30-day money-back guarantee on all paid plans."
            />
          </div>
        </div>
        */}
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
  <div className="flex items-center text-sm">
    {included ? (
      <svg className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )}
    <span className={included ? 'text-gray-300' : 'text-gray-600 line-through'}>
      {text}
    </span>
  </div>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div
    className="p-6 rounded-2xl"
    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}
  >
    <h3 className="font-semibold text-white mb-2">{question}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
  </div>
);

export default PricingPage;
