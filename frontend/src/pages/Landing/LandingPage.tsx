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
  ChevronDown,
  BarChart3,
  Shield,
  Zap,
  Globe,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────────── */
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
    color: 'bg-rose-100 text-rose-500',
    hover: 'hover:border-rose-200 hover:shadow-rose-50',
  },
  {
    icon: Users,
    title: 'Client CRM',
    desc: 'Maintain rich client profiles, track requirements, and never miss a follow-up with smart reminders.',
    color: 'bg-teal-100 text-teal-600',
    hover: 'hover:border-teal-200 hover:shadow-teal-50',
  },
  {
    icon: Calendar,
    title: 'Appointment Scheduling',
    desc: 'Book site visits, sync calendars, and send automated reminders to clients and your team.',
    color: 'bg-orange-100 text-orange-500',
    hover: 'hover:border-orange-200 hover:shadow-orange-50',
  },
  {
    icon: FileText,
    title: 'Agreement Builder',
    desc: 'Generate professional agreements in seconds. Store, share, and e-sign documents digitally.',
    color: 'bg-amber-100 text-amber-600',
    hover: 'hover:border-amber-200 hover:shadow-amber-50',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp & SMS Marketing',
    desc: 'Reach clients instantly with bulk WhatsApp messages and targeted SMS campaigns.',
    color: 'bg-pink-100 text-pink-500',
    hover: 'hover:border-pink-200 hover:shadow-pink-50',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Get real-time insights on leads, conversions, revenue, and team performance.',
    color: 'bg-teal-100 text-teal-600',
    hover: 'hover:border-teal-200 hover:shadow-teal-50',
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
    avatarBg: 'from-rose-400 to-pink-500',
  },
  {
    name: 'Priya Mehta',
    role: 'Real Estate Agency Owner, Pune',
    rating: 5,
    avatar: 'PM',
    text: 'The agreement builder saves me hours every week. My clients love the professional documents it generates.',
    avatarBg: 'from-teal-400 to-teal-600',
  },
  {
    name: 'Arjun Patel',
    role: 'Property Consultant, Ahmedabad',
    rating: 5,
    avatar: 'AP',
    text: 'Finally a CRM built for Indian real estate. The SMS campaigns and appointment reminders are game-changers.',
    avatarBg: 'from-orange-400 to-amber-500',
  },
];

const STATS = [
  { value: '10,000+', label: 'Active Brokers' },
  { value: '5 Lakh+', label: 'Properties Listed' },
  { value: '98%', label: 'Customer Satisfaction' },
  { value: '3x', label: 'Average Revenue Growth' },
];

/* ─── Component ───────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased">

      {/* ── Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center shadow-md shadow-rose-200">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">Broker<span className="text-rose-500">Pro</span></span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) =>
                l.href.startsWith('#') ? (
                  <a key={l.label} href={l.href} className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">
                    {l.label}
                  </a>
                ) : (
                  <Link key={l.label} to={l.href} className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors">
                    {l.label}
                  </Link>
                )
              )}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors px-4 py-2">
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white px-5 py-2 rounded-full shadow-md shadow-rose-200 hover:shadow-lg hover:shadow-rose-300 hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 text-slate-600" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-rose-50 px-4 py-4 space-y-3 shadow-lg">
            {NAV_LINKS.map((l) =>
              l.href.startsWith('#') ? (
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-600 py-2 hover:text-rose-500">
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} to={l.href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-slate-600 py-2 hover:text-rose-500">
                  {l.label}
                </Link>
              )
            )}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="text-center text-sm font-medium border border-slate-200 rounded-full py-2 text-slate-700">Sign In</Link>
              <Link to="/register" className="text-center text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full py-2">Start Free Trial</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="text-center lg:text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-rose-200">
                <Zap className="w-3.5 h-3.5" />
                India's #1 Real Estate CRM
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Close More Deals,{' '}
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  Stress Less
                </span>
              </h1>
              <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                BrokerPro is the all-in-one CRM built for real estate brokers. Manage properties, clients, appointments, agreements, and marketing — all from one beautiful dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-8 py-3.5 rounded-full border border-slate-200 hover:border-rose-300 hover:text-rose-500 transition-all duration-200"
                >
                  See Features <ChevronDown className="w-4 h-4" />
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-400">No credit card required · 14-day free trial · Cancel anytime</p>
            </div>

            {/* Right — Dashboard Preview Card */}
            <div className="relative hidden lg:block animate-fade-in">
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-rose-100 p-6 border border-rose-50 animate-float">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Good morning,</p>
                    <p className="text-base font-bold text-slate-800">Rahul Sharma 👋</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-rose-200">RS</div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Properties', value: '48', color: 'bg-rose-50 text-rose-500' },
                    { label: 'Clients', value: '124', color: 'bg-teal-50 text-teal-600' },
                    { label: 'Deals', value: '12', color: 'bg-amber-50 text-amber-600' },
                  ].map((s) => (
                    <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs font-medium opacity-70">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</p>
                <div className="space-y-2.5">
                  {[
                    { icon: '🏠', text: 'New property listed in Bandra', time: '2m ago' },
                    { icon: '👤', text: 'Client Priya added to pipeline', time: '15m ago' },
                    { icon: '📅', text: 'Site visit scheduled for tomorrow', time: '1h ago' },
                    { icon: '✅', text: 'Agreement signed by Arjun Patel', time: '3h ago' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-rose-50 transition-colors">
                      <span className="text-base">{a.icon}</span>
                      <p className="text-xs text-slate-600 flex-1">{a.text}</p>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-teal-200">
                +32% this month 🚀
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-white border-y border-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label} className="animate-scale-in">
                <p className="text-3xl font-extrabold bg-gradient-to-r from-rose-500 to-orange-400 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-sm text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-rose-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-rose-100 text-rose-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-rose-200">Everything You Need</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Powerful Features for Modern Brokers
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              From lead capture to deal closure — BrokerPro covers every step of your real estate workflow.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`bg-white rounded-2xl p-6 border border-slate-100 ${f.hover} hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group`}
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/30">Simple Onboarding</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Get Up & Running in Minutes</h2>
            <p className="text-teal-100 max-w-xl mx-auto text-lg">Three simple steps to transform your brokerage business.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px border-t-2 border-dashed border-white/30" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <span className="text-2xl font-extrabold text-white">{s.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-teal-100 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-teal-700 font-bold px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Your Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-gradient-to-b from-orange-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-amber-200">Loved by Brokers</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">What Our Users Say</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">Join thousands of brokers who've grown their business with BrokerPro.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-orange-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="py-16 bg-white border-y border-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, title: 'Bank-Grade Security', desc: 'Your data is encrypted and stored securely with 99.9% uptime guarantee.', color: 'text-teal-600 bg-teal-100' },
              { icon: Zap, title: 'Lightning Fast', desc: 'Optimized for speed so you can work without interruptions on any device.', color: 'text-amber-600 bg-amber-100' },
              { icon: Globe, title: 'Works Everywhere', desc: 'Access BrokerPro from desktop, tablet, or mobile — anytime, anywhere.', color: 'text-rose-500 bg-rose-100' },
            ].map((b) => (
              <div key={b.title} className="flex flex-col items-center p-6 rounded-2xl hover:bg-rose-50/50 transition-colors">
                <div className={`w-12 h-12 rounded-xl ${b.color} flex items-center justify-center mb-4`}>
                  <b.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{b.title}</h3>
                <p className="text-sm text-slate-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-24 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white text-rose-500 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-rose-200 shadow-sm">
            <Zap className="w-3.5 h-3.5" /> Limited Time — Free 14-Day Trial
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Ready to Grow Your Brokerage?
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Join 10,000+ brokers already using BrokerPro. Start your 14-day free trial today — no credit card needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold px-8 py-3.5 rounded-full border border-slate-200 hover:border-rose-300 hover:text-rose-500 transition-all duration-200"
            >
              Sign In to Dashboard
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
            {['No credit card', '14-day free trial', 'Cancel anytime'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Broker<span className="text-rose-400">Pro</span></span>
              </div>
              <p className="text-sm leading-relaxed">The all-in-one CRM platform built for real estate professionals in India.</p>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm">Product</p>
              <ul className="space-y-2 text-sm">
                {['Features', 'Pricing', 'Changelog', 'Roadmap'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-rose-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm">Company</p>
              <ul className="space-y-2 text-sm">
                {['About Us', 'Blog', 'Careers', 'Privacy Policy'].map((l) => (
                  <li key={l}><a href="#" className="hover:text-rose-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-4 text-sm">Contact</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-rose-400" /> support@brokerpro.in</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-rose-400" /> +91 98765 43210</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-400" /> Mumbai, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>© {new Date().getFullYear()} BrokerPro. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-rose-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-rose-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-rose-400 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
