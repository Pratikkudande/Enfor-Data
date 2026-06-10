import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowLeft, HelpCircle, CreditCard, Zap, Shield, Search } from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  category: string;
  icon: React.ElementType;
  color: string;
  questions: FAQItem[];
}

const FAQ_SECTIONS: FAQSection[] = [
  {
    category: 'Getting Started',
    icon: Zap,
    color: '#3B82F6',
    questions: [
      {
        q: 'What is EnforData?',
        a: 'EnforData is an all-in-one CRM platform built specifically for Indian real estate brokers, property consultants, and channel partners. It helps you manage properties, leads, site visits, broker networks, agreements, and SMS marketing — all from one place.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes! EnforData offers a free trial so you can explore all features before committing to a paid plan. No credit card required to start your trial.',
      },
      {
        q: 'What devices can I use EnforData on?',
        a: 'EnforData is fully web-based and works on any modern browser — desktop, tablet, or mobile. No app download needed.',
      },
      {
        q: 'How do I get started?',
        a: 'Click "Get Started" on the home page, create your account, and you\'ll be guided through the setup. You can import existing clients and properties using our Excel templates.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    icon: CreditCard,
    color: '#8B5CF6',
    questions: [
      {
        q: 'What plans are available?',
        a: 'We offer flexible annual plans designed for individual brokers, small teams, and growing brokerage firms. Visit our Pricing page for full details on what each plan includes.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit/debit cards, UPI, and net banking via Razorpay — India\'s most trusted payment gateway. All transactions are encrypted and secure.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel your subscription at any time from your account settings. Your access continues until the end of your current billing period.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a refund within 7 days of purchase if you\'re not satisfied. Contact our support team at info@enfordata.com and we\'ll process it promptly.',
      },
    ],
  },
  {
    category: 'Features',
    icon: HelpCircle,
    color: '#10B981',
    questions: [
      {
        q: 'Can I import my existing property listings and clients?',
        a: 'Yes. EnforData supports bulk import via Excel templates for both properties and clients. Download our sample templates from within the app to get the format right.',
      },
      {
        q: 'How does the Broker Network work?',
        a: 'The Broker Network lets you connect with other EnforData brokers, share properties, track referrals, and manage commissions — all within the platform.',
      },
      {
        q: 'Can I send bulk SMS to my clients?',
        a: 'Yes. The SMS Marketing module lets you create campaigns, send bulk messages using templates, and track delivery status. You\'ll need an MSG91 API key to activate this feature.',
      },
      {
        q: 'How many properties and leads can I add?',
        a: 'Limits depend on your plan. All plans support a generous number of properties and leads — check the Pricing page for exact limits per tier.',
      },
    ],
  },
  {
    category: 'Account & Security',
    icon: Shield,
    color: '#F59E0B',
    questions: [
      {
        q: 'How do I reset my password?',
        a: 'Click "Forgot Password" on the login page, enter your registered email, and you\'ll receive a 6-digit OTP to reset your password securely.',
      },
      {
        q: 'Can I add team members or staff?',
        a: 'Yes. You can add channel partners to your account who can access and manage properties and leads under your brokerage.',
      },
      {
        q: 'Is my data secure?',
        a: 'Absolutely. All data is encrypted in transit (HTTPS) and at rest. We use Neon PostgreSQL cloud database with automatic backups. Your client and property data is private to your account.',
      },
      {
        q: 'How do I contact support?',
        a: 'You can reach us at info@enfordata.com or call +91 88060 04191. You can also use the Contact form on our website and we\'ll respond within 24 hours on business days.',
      },
    ],
  },
];

const AccordionItem: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void }> = ({
  item, isOpen, onToggle,
}) => (
  <div
    className="border rounded-xl overflow-hidden transition-all duration-200"
    style={{
      borderColor: isOpen ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)',
      background: isOpen ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.025)',
    }}
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 text-left gap-4"
    >
      <span className="text-sm font-semibold text-white leading-snug">{item.q}</span>
      <ChevronDown
        className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
        style={{ color: '#60A5FA', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
      />
    </button>
    {isOpen && (
      <div className="px-5 pb-4">
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(148,163,184,0.85)' }}>{item.a}</p>
      </div>
    )}
  </div>
);

const FAQPage: React.FC = () => {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const toggle = (key: string) =>
    setOpenMap(prev => ({ ...prev, [key]: !prev[key] }));

  const query = search.toLowerCase().trim();
  const filteredSections = FAQ_SECTIONS.map(section => ({
    ...section,
    questions: query
      ? section.questions.filter(
          q => q.q.toLowerCase().includes(query) || q.a.toLowerCase().includes(query)
        )
      : section.questions,
  })).filter(s => s.questions.length > 0);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: '#030B24', color: '#fff' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8"
        style={{
          background: 'rgba(3,11,36,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <img src={logoImg} alt="EnforData" className="h-10 w-auto object-contain" />
          <Link to="/contact" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Contact Us
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center"
        style={{ background: 'linear-gradient(180deg,#030B24 0%,#050F2E 100%)' }}>
        <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-blue-500/30"
          style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
          HELP CENTER
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(148,163,184,0.7)' }}>
          Everything you need to know about EnforData. Can't find what you're looking for?{' '}
          <Link to="/#contact-form" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Contact us
          </Link>
          .
        </p>

        {/* Search */}
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(148,163,184,0.5)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
            onFocus={e => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(99,102,241,0.5)';
              (e.target as HTMLInputElement).style.background = 'rgba(99,102,241,0.06)';
            }}
            onBlur={e => {
              (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.1)';
              (e.target as HTMLInputElement).style.background = 'rgba(255,255,255,0.05)';
            }}
          />
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {filteredSections.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-2">No results found for "<span className="text-white">{search}</span>"</p>
            <p className="text-sm text-gray-500">Try a different search term or{' '}
              <Link to="/#contact-form" className="text-blue-400 hover:text-blue-300">contact us</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredSections.map(section => (
              <div key={section.category}>
                {/* Section heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${section.color}22`, border: `1px solid ${section.color}44` }}>
                    <section.icon className="w-4 h-4" style={{ color: section.color }} />
                  </div>
                  <h2 className="text-base font-bold text-white">{section.category}</h2>
                </div>

                <div className="space-y-2">
                  {section.questions.map((item, idx) => {
                    const key = `${section.category}-${idx}`;
                    return (
                      <AccordionItem
                        key={key}
                        item={item}
                        isOpen={!!openMap[key]}
                        onToggle={() => toggle(key)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still need help */}
        <div className="mt-16 rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Still have questions?</h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(148,163,184,0.7)' }}>
            Our team typically responds within 24 hours on business days.
          </p>
          <Link
            to="/#contact-form"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-2.5 rounded-lg transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
