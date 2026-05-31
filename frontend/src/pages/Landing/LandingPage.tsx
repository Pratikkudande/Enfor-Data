import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Star,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Shield,
  Zap,
  Globe,
  ChevronRight,
} from 'lucide-react';

/* ─── Data ────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Pricing', href: '/pricing' },
];

const FEATURES = [
  {
    icon: Building2,
    title: 'Property Management',
    desc: 'List, track, and manage all your properties in one place. Filter by status, location, and price with ease.',
    tag: 'Core',
  },
  {
    icon: Users,
    title: 'Client CRM',
    desc: 'Maintain rich client profiles, track requirements, and never miss a follow-up with smart reminders.',
    tag: 'CRM',
  },
  {
    icon: Calendar,
    title: 'Appointment Scheduling',
    desc: 'Book site visits, sync calendars, and send automated reminders to clients and your team.',
    tag: 'Scheduling',
  },
  {
    icon: FileText,
    title: 'Agreement Builder',
    desc: 'Generate professional agreements in seconds. Store, share, and e-sign documents digitally.',
    tag: 'Legal',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp & SMS Marketing',
    desc: 'Reach clients instantly with bulk WhatsApp messages and targeted SMS campaigns.',
    tag: 'Marketing',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Get real-time insights on leads, conversions, revenue, and team performance.',
    tag: 'Insights',
  },
];

const STEPS = [
  { step: '01', title: 'Sign Up Free', desc: 'Create your account in under 2 minutes — no credit card required.' },
  { step: '02', title: 'Add Your Listings', desc: 'Import or add properties, clients, and team members effortlessly.' },
  { step: '03', title: 'Automate & Grow', desc: 'Let BrokerPro handle follow-ups, reminders, and marketing while you close deals.' },
];

const TESTIMONIALS = [
  {
    name: 'Rahul Sharma',
    role: 'Senior Broker, Mumbai',
    avatar: 'RS',
    rating: 5,
    text: 'BrokerPro transformed how I manage my 200+ clients. The WhatsApp marketing alone doubled my response rate.',
  },
  {
    name: 'Priya Mehta',
    role: 'Agency Owner, Pune',
    rating: 5,
    avatar: 'PM',
    text: 'The agreement builder saves me hours every week. My clients love the professional documents it generates.',
  },
  {
    name: 'Arjun Patel',
    role: 'Property Consultant, Ahmedabad',
    rating: 5,
    avatar: 'AP',
    text: 'Finally a CRM built for Indian real estate. The SMS campaigns and appointment reminders are game-changers.',
  },
];

const STATS = [
  { value: '10,000+', label: 'Active Brokers' },
  { value: '5 Lakh+', label: 'Properties Listed' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '3x', label: 'Revenue Growth' },
];

const TRUST_LOGOS = ['HDFC Realty', 'NoBroker', 'MagicBricks', 'PropTiger', '99acres', 'Square Yards'];

/* ─── Component ───────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: '#f0faf4' }}>

      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm border-b border-gray-100' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">BrokerPro</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-7">
              {NAV_LINKS.map((l) =>
                l.href.startsWith('#') ? (
                  <a key={l.label} href={l.href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.label} to={l.href} className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    {l.label}
                  </Link>
                )
              )}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                Sign in
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-gray-900 text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                Get started
              </Link>
            </div>

            <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 space-y-4 shadow-lg">
            {NAV_LINKS.map((l) =>
              l.href.startsWith('#') ? (
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-600 py-1">
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} to={l.href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-600 py-1">
                  {l.label}
                </Link>
              )
            )}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="text-center text-sm font-medium border border-gray-200 rounded-full py-2 text-gray-700">Sign in</Link>
              <Link to="/register" className="text-center text-sm font-semibold bg-gray-900 text-white rounded-full py-2">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden px-6 pt-20 pb-16"
        style={{ background: 'linear-gradient(160deg, #e8f8ef 0%, #f0faf4 40%, #e6f7f0 100%)' }}
      >
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(52,211,153,0.15) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 border border-gray-200 text-gray-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            India's #1 Real Estate CRM Platform
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-4">
            We build what makes
            <br />
            <span className="relative inline-block">
              your brokerage win.
              {/* Green underline — the Wibify signature */}
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 400 6" preserveAspectRatio="none">
                <path d="M0 3 Q200 0 400 3" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Sub */}
          <p className="text-lg text-gray-500 max-w-xl mx-auto mt-6 mb-10 leading-relaxed">
            Properties, clients, appointments, agreements, and marketing — all from one beautiful dashboard. Built for Indian real estate brokers.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
            >
              <Zap className="w-4 h-4" /> Get free access
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-white/80 text-gray-700 font-semibold px-7 py-3.5 rounded-full border border-gray-200 hover:bg-white hover:border-gray-300 transition-all"
            >
              See features <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          <p className="mt-5 text-xs text-gray-400">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>

        {/* Trust logos strip */}
        <div className="relative mt-20 w-full max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">Trusted by brokers at</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_LOGOS.map((logo) => (
              <span key={logo} className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-default">
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-6" style={{ backgroundColor: '#f0faf4' }}>
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="mb-16">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Features.</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight max-w-lg">
                Everything a modern broker needs.
              </h2>
              <p className="text-gray-500 max-w-xs text-sm leading-relaxed">
                From lead capture to deal closure — BrokerPro covers every step of your workflow.
              </p>
            </div>
          </div>

          {/* Feature grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl p-6 border border-gray-100 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 cursor-default"
              >
                <div className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full mb-4 bg-emerald-50 text-emerald-700">
                  {f.tag}
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-gray-700" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Process.</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Up and running in minutes.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative rounded-2xl border border-gray-100 bg-gray-50 p-8 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200">
                <span className="text-6xl font-extrabold text-gray-100 leading-none block mb-4">{s.step}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 items-center justify-center shadow-sm">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-7 py-3.5 rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-28 px-6" style={{ backgroundColor: '#f0faf4' }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-3">Reviews.</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
              Loved by brokers across India.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`rounded-2xl p-7 border transition-all duration-200 hover:-translate-y-0.5 ${
                  i === 1
                    ? 'bg-gray-900 border-gray-900'
                    : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md'
                }`}
              >
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className={`w-4 h-4 fill-current ${i === 1 ? 'text-emerald-400' : 'text-amber-400'}`} />
                  ))}
                </div>
                <p className={`text-sm leading-relaxed mb-6 ${i === 1 ? 'text-gray-300' : 'text-gray-600'}`}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === 1 ? 'bg-white/10 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${i === 1 ? 'text-white' : 'text-gray-900'}`}>{t.name}</p>
                    <p className={`text-xs ${i === 1 ? 'text-gray-400' : 'text-gray-400'}`}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Why ── */}
      <section className="py-20 px-6 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Bank-Grade Security', desc: 'All data encrypted at rest and in transit. 99.9% uptime SLA.', },
              { icon: Zap, title: 'Blazing Fast', desc: 'Optimised for speed on any device — desktop, tablet, or mobile.', },
              { icon: Globe, title: 'Works Everywhere', desc: 'Access your dashboard from anywhere, anytime, on any screen.', },
            ].map((b) => (
              <div key={b.title} className="flex gap-4 items-start p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <b.icon className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{b.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6" style={{ background: 'linear-gradient(160deg, #e8f8ef 0%, #f0faf4 60%, #e6f7f0 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-4">Get started.</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
            Ready to grow your
            <br />
            <span className="relative inline-block">
              brokerage?
              <svg className="absolute -bottom-1 left-0 w-full" height="5" viewBox="0 0 200 5" preserveAspectRatio="none">
                <path d="M0 2.5 Q100 0 200 2.5" stroke="#10b981" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h2>
          <p className="text-gray-500 text-base mb-10 max-w-md mx-auto leading-relaxed">
            Join 10,000+ brokers already using BrokerPro. Start your 14-day free trial — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20"
            >
              <Zap className="w-4 h-4" /> Start free trial
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-white text-gray-700 font-semibold px-8 py-3.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Sign in to dashboard
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-400">
            {['No credit card', '14-day free trial', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">BrokerPro</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-500">
                The all-in-one CRM platform built for real estate professionals in India.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm">Product</p>
              <ul className="space-y-2.5 text-sm">
                {['Features', 'Pricing', 'Changelog', 'Roadmap'].map((l) => (
                  <li key={l}><a href="#" className="text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm">Company</p>
              <ul className="space-y-2.5 text-sm">
                {['About Us', 'Blog', 'Careers', 'Privacy Policy'].map((l) => (
                  <li key={l}><a href="#" className="text-gray-500 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm">Contact</p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2 text-gray-500"><Mail className="w-4 h-4 text-emerald-500" /> support@brokerpro.in</li>
                <li className="flex items-center gap-2 text-gray-500"><Phone className="w-4 h-4 text-emerald-500" /> +91 98765 43210</li>
                <li className="flex items-center gap-2 text-gray-500"><MapPin className="w-4 h-4 text-emerald-500" /> Mumbai, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} BrokerPro. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

