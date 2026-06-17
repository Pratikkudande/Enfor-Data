import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubscriptionPlans, SubscriptionPlan } from '../../services/subscriptionApi';

/* Pricing section shown inline on the landing page (#pricing). Mirrors the
   standalone Pricing page styling and routes to registration on selection. */
const PricingSection: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const didFetch = useRef(false);
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    getSubscriptionPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const formatLimit = (limit: number | null) => (limit === null ? 'Unlimited' : limit.toLocaleString());

  const inr = (n: number) =>
    `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleSelect = (plan: SubscriptionPlan) => {
    navigate('/register', { state: { plan, billingCycle: 'annual' } });
  };

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg,#050F2E 0%,#030B24 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-blue-500/30"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD' }}>
            ✨ Annual subscription · prices include GST
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg,#60A5FA,#A78BFA,#818CF8)' }}>
              Choose Your Plan
            </span>
          </h2>
          <p className="text-base text-gray-400 max-w-xl mx-auto">Pick the annual plan that fits your business.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => (
              <div key={plan.id}
                className="relative rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1"
                style={
                  plan.is_popular
                    ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(99,102,241,0.55)', boxShadow: '0 0 40px rgba(99,102,241,0.35)', backdropFilter: 'blur(16px)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(16px)' }
                }>
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
                    <span className="text-4xl font-extrabold text-white">{formatPrice(plan.annual_price)}</span>
                    <span className="text-gray-400 text-sm">/year</span>
                  </div>

                  {plan.sms_credits > 0 && (() => {
                    const smsCost = plan.sms_credits * plan.sms_rate;
                    const platformFee = 3600;
                    const subtotal = smsCost + platformFee;
                    const gst = subtotal * 0.18;
                    return (
                      <div className="mb-5 text-xs text-gray-400 space-y-1 border-y border-white/10 py-3">
                        <div className="flex justify-between">
                          <span>SMS ({plan.sms_credits.toLocaleString()} × ₹{plan.sms_rate.toFixed(2)})</span>
                          <span className="text-gray-300">{inr(smsCost)}</span>
                        </div>
                        <div className="flex justify-between"><span>Platform fee</span><span className="text-gray-300">{inr(platformFee)}</span></div>
                        <div className="flex justify-between"><span>GST (18%)</span><span className="text-gray-300">{inr(gst)}</span></div>
                        <div className="flex justify-between font-semibold text-white pt-1 border-t border-white/10">
                          <span>Total</span><span>{inr(subtotal + gst)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {plan.sms_credits > 0 && (
                    <div className="mb-5 rounded-xl px-4 py-3 text-center border border-blue-500/20" style={{ background: 'rgba(59,130,246,0.10)' }}>
                      <div className="text-lg font-bold" style={{ color: '#93C5FD' }}>{plan.sms_credits.toLocaleString()} SMS credits</div>
                      <div className="text-xs text-blue-300/80">at ₹{plan.sms_rate.toFixed(2)} / SMS</div>
                    </div>
                  )}

                  <div className="space-y-3 flex-1">
                    <Feature text={`${formatLimit(plan.max_properties)} Properties`} included />
                    <Feature text={`${formatLimit(plan.max_clients)} Clients`} included />
                    <Feature text={`${formatLimit(plan.max_appointments_per_month)} Appointments/month`} included />
                    <Feature text="Basic Analytics" included={plan.has_analytics} />
                    <Feature text="Advanced Analytics" included={plan.has_advanced_analytics} />
                    <Feature text="Priority Support" included={plan.has_priority_support} />
                  </div>

                  <button onClick={() => handleSelect(plan)}
                    className="mt-6 w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={
                      plan.is_popular
                        ? { background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: '#fff', boxShadow: '0 0 22px rgba(99,102,241,0.45)' }
                        : { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
                    }>
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
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
    <span className={included ? 'text-gray-300' : 'text-gray-600 line-through'}>{text}</span>
  </div>
);

export default PricingSection;
