import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Calendar, Star, ArrowRight, CheckCircle,
  Menu, X, Phone, Mail, MapPin, TrendingUp,
  Bell, Clock, DollarSign, ChevronRight,
  Home, Handshake, FolderOpen, Network, MessageSquare,
  Send, MessageCircle,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import PricingSection from './PricingSection';
import { ENV } from '../../config/env';

/* ── Animated Counter ─────────────────────────────────────── */
const useCounter = (target: number, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

/* ── InView Hook ─────────────────────────────────────────── */
const useInView = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

/* ── Data ─────────────────────────────────────────────────── */
const NAV_LINKS: { label: string; href: string; external?: boolean }[] = [
  { label: 'Features',   href: '#features'      },
  { label: 'Pricing',    href: '#pricing'       },
  { label: 'Resources',  href: '#testimonials'  },
  { label: 'About Us',   href: '#about'         },
  { label: 'Contact',    href: '#contact-form'  },
];

const STATS = [
  { icon: '🏢', value: 1500, suffix: '+', label: 'Properties Managed' },
  { icon: '👥', value: 2000, suffix: '+', label: 'Leads Tracked' },
  { icon: '🤝', value: 300,  suffix: '+', label: 'Broker Connections' },
  { icon: '📈', value: 35,   suffix: '%', label: 'Faster Deal Closure' },
];

const FEATURES = [
  {
    icon: Home, title: 'Property Management',
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
    items: ['Add & manage properties', 'Upload photos & documents', 'Track availability', 'Prevent duplicate entries'],
  },
  {
    icon: Users, title: 'Lead Management',
    img: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80',
    items: ['Capture leads', 'Assign team members', 'Lead pipeline tracking', 'Follow-up management'],
  },
  {
    icon: Calendar, title: 'Site Visit Management',
    img: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=400&q=80',
    items: ['Schedule visits', 'Visit reminders', 'Feedback tracking', 'Visit history'],
  },
  {
    icon: Handshake, title: 'Broker Network',
    img: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80',
    items: ['Channel partner management', 'Property sharing', 'Referral tracking', 'Commission management'],
  },
  {
    icon: FolderOpen, title: 'Agreements & Documents',
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80',
    items: ['Store agreements', 'Property documents', 'Client KYC', 'Secure cloud storage'],
  },
  {
    icon: MessageSquare, title: 'SMS Marketing',
    img: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=400&q=80',
    items: ['Bulk SMS campaigns', 'Targeted client outreach', 'Delivery tracking', 'Custom message templates'],
  },
];

const BENEFITS = [
  { icon: Clock,      title: 'Save Time',              desc: 'Reduce manual work by 70%' },
  { icon: Bell,       title: 'Never Miss Follow-Ups',  desc: 'Automated reminders & alerts' },
  { icon: TrendingUp, title: 'Increase Conversions',   desc: 'Track every lead & opportunity' },
  { icon: Network,    title: 'Grow Your Network',      desc: 'Collaborate with more brokers' },
  { icon: DollarSign, title: 'Earn More',              desc: 'Track every deal & commission' },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Patel', city: 'Broker, Ahmedabad', initials: 'RP',
    text: '"Earlier we used Excel and WhatsApp for everything. EnforData has completely changed the way we run our brokerage business."',
  },
  {
    name: 'Amit Shah', city: 'Broker, Mumbai', initials: 'AS',
    text: '"We increased our lead conversion by 25% in just 3 months. The follow-up system is fantastic!"',
  },
  {
    name: 'Neha Mehta', city: 'Broker, Pune', initials: 'NM',
    text: '"Finally a platform made for brokers like us. Everything in one place — properties, leads, visits, commissions."',
  },
];

/* ── Stat Counter ─────────────────────────────────────────── */
const StatCounter: React.FC<{ value: number; suffix: string; started: boolean }> = ({ value, suffix, started }) => {
  const count = useCounter(value, 2000, started);
  return <span>{count.toLocaleString('en-IN')}{suffix}</span>;
};

/* ── Glassmorphism card style ─────────────────────────────── */
const glass = {
  background: 'rgba(5,15,46,0.88)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.10)',
} as React.CSSProperties;

/* ── Contact Section ──────────────────────────────────────── */
const ContactSection: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: k === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(`${ENV.API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const inputCls = `w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all`;
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
  };

  return (
    <section id="contact-form" className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: 'linear-gradient(180deg,#030B24 0%,#050F2E 100%)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-500/30"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
            GET IN TOUCH
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            We'd Love to Hear From You
          </h2>
          <p className="mt-3 text-sm" style={{ color: 'rgba(148,163,184,0.7)' }}>
            Have a question or want to see a demo? Send us a message and we'll get back to you within 24 hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">

          {/* Contact info — left */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {[
              {
                icon: Mail,
                label: 'Email Us',
                value: 'info@enfordata.com',
                sub: 'We reply within 24 hours',
                color: '#3B82F6',
              },
              {
                icon: Phone,
                label: 'Call Us',
                value: '+91 88060 04191',
                sub: 'Mon–Sat, 10 AM – 7 PM IST',
                color: '#8B5CF6',
              },
              {
                icon: MessageCircle,
                label: 'WhatsApp',
                value: '+91 88060 04191',
                sub: 'Quick replies on WhatsApp',
                color: '#10B981',
              },
              {
                icon: MapPin,
                label: 'Office',
                value: 'Pimple Saudagar, Pune',
                sub: 'Sai Vision Society A/28, 411027',
                color: '#F59E0B',
              },
            ].map(({ icon: Icon, label, value, sub, color }) => (
              <div key={label}
                className="flex items-start gap-4 p-5 rounded-2xl border border-white/8 transition-all duration-200 hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: 'rgba(148,163,184,0.6)' }}>{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(100,116,139,0.8)' }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form — right */}
          <div className="lg:col-span-3 rounded-2xl p-7 border border-white/8"
            style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>

            {status === 'success' ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-sm" style={{ color: 'rgba(148,163,184,0.7)' }}>
                  Thanks for reaching out. Our team will respond within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name *</label>
                    <input
                      type="text" required maxLength={100}
                      value={form.name} onChange={set('name')}
                      placeholder="Rajesh Patel"
                      className={inputCls} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Phone Number</label>
                    <input
                      type="tel" maxLength={10}
                      value={form.phone} onChange={set('phone')}
                      placeholder="Enter phone number"
                      className={inputCls} style={inputStyle}
                      onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address *</label>
                  <input
                    type="email" required
                    value={form.email} onChange={set('email')}
                    placeholder="rajesh@example.com"
                    className={inputCls} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Message *</label>
                  <textarea
                    required rows={5} maxLength={1000}
                    value={form.message} onChange={set('message')}
                    placeholder="Tell us how we can help you…"
                    className={`${inputCls} resize-none`} style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                  />
                  <p className="mt-1 text-xs text-right" style={{ color: 'rgba(100,116,139,0.6)' }}>
                    {form.message.length}/1000
                  </p>
                </div>

                {status === 'error' && (
                  <p className="text-xs text-red-400 text-center">
                    Something went wrong. Please try again or email us at info@enfordata.com
                  </p>
                )}

                <button
                  type="submit" disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}>
                  {status === 'loading' ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════ */
const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { ref: statsRef, inView: statsInView } = useInView(0.3);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* ── Navbar ─────────────────────────────────────────────── */
  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: '#030B24', color: '#fff' }}>

      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(3,11,36,0.97)'
            : 'rgba(3,11,36,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logoImg} alt="EnforData" className="h-28 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href, external }) => (
              external ? (
                <Link key={label} to={href} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{label}</Link>
              ) : (
                <a key={label} href={href} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{label}</a>
              )
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2">Login</Link>
            <Link to="/register"
              className="text-sm font-semibold text-white px-5 py-2 rounded-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              Get Started
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="lg:hidden p-2 text-gray-300" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t px-4 py-4 space-y-3"
            style={{ background: 'rgba(3,11,36,0.97)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)' }}>
            {NAV_LINKS.map(({ label, href, external }) => (
              external ? (
                <Link key={label} to={href} onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium text-gray-300 hover:text-white py-2">{label}</Link>
              ) : (
                <a key={label} href={href} onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium text-gray-300 hover:text-white py-2">{label}</a>
              )
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link to="/login" className="text-center text-sm font-medium border rounded-lg py-2 text-gray-300"
                style={{ borderColor: 'rgba(255,255,255,0.15)' }}>Login</Link>
              <Link to="/register" className="text-center text-sm font-semibold text-white rounded-lg py-2"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80"
            alt="City skyline" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg,rgba(3,11,36,0.93) 0%,rgba(3,11,36,0.72) 50%,rgba(3,11,36,0.90) 100%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 60% 60% at 20% 50%,rgba(59,130,246,0.15) 0%,transparent 60%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left content */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-blue-500/30"
                style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD' }}>
                ✨ Built for Indian Real Estate Brokers
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-5">
                <span className="text-white">Manage Your Entire<br />Real Estate Business</span>
                <br />
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg,#60A5FA,#A78BFA,#818CF8)' }}>
                  From One Place
                </span>
              </h1>
              <p className="text-base text-gray-400 mb-8 max-w-lg leading-relaxed">
                Track Properties, Leads, Site Visits, Broker Networks, Follow-Ups and Commissions without Excel or WhatsApp chaos.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/register"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 24px rgba(99,102,241,0.45)' }}>
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Stats row */}
              <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map(s => (
                  <div key={s.label}>
                    <div className="text-lg font-extrabold text-white">
                      {s.icon} <StatCounter value={s.value} suffix={s.suffix} started={statsInView} />
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative hidden lg:block animate-float">
              <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }} />
              <div className="relative rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(24px)' }}>

                {/* Dashboard top bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/10"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <img src={logoImg} alt="EnforData" className="h-4 w-auto object-contain" />
                    <span className="ml-1 text-xs text-gray-400">Dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                </div>

                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-32 border-r border-white/10 p-3 space-y-1"
                    style={{ background: 'rgba(0,0,0,0.2)' }}>
                    {['Dashboard','Properties','Leads','Site Visits','Follow-Ups','Broker Network','Agreements','Commissions','Reports','Settings'].map((item, i) => (
                      <div key={item}
                        className="text-xs px-2 py-1.5 rounded cursor-default"
                        style={i === 0
                          ? { background: 'linear-gradient(135deg,rgba(59,130,246,0.3),rgba(139,92,246,0.3))', color: '#fff', fontWeight: 600 }
                          : { color: '#6B7280' }}>
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Main panel */}
                  <div className="flex-1 p-4">
                    <p className="text-sm font-bold text-white mb-3">Dashboard</p>

                    {/* KPI cards */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Total Leads',       value: '124', change: '+18 this week', urgent: false },
                        { label: 'Total Properties',  value: '450', change: '+12 this month', urgent: false },
                        { label: 'Site Visits',       value: '32',  change: '+5 this week',  urgent: false },
                        { label: 'Follow-Ups Due',    value: '16',  change: 'Due today',     urgent: true  },
                      ].map(c => (
                        <div key={c.label} className="rounded-xl p-3 border border-white/10"
                          style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <p className="text-xs text-gray-400 mb-1">{c.label}</p>
                          <p className="text-xl font-extrabold text-white">{c.value}</p>
                          <p className="text-xs mt-1" style={{ color: c.urgent ? '#F87171' : '#6EE7B7' }}>{c.change}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart + Hot Leads */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl p-3 border border-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-white">Leads Overview</p>
                          <span className="text-xs text-gray-500">This Month ▾</span>
                        </div>
                        <svg viewBox="0 0 200 60" className="w-full h-12">
                          <defs>
                            <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path d="M0 50 C20 45 40 30 60 35 S100 20 120 25 S160 10 200 15 L200 60 L0 60Z"
                            fill="url(#cg)" />
                          <path d="M0 50 C20 45 40 30 60 35 S100 20 120 25 S160 10 200 15"
                            fill="none" stroke="#8B5CF6" strokeWidth="2" />
                        </svg>
                      </div>

                      <div className="rounded-xl p-3 border border-white/10"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-white">Hot Leads</p>
                          <span className="text-xs text-blue-400 cursor-pointer">View All</span>
                        </div>
                        <div className="space-y-1.5">
                          {[
                            { name: 'Rahul Sharma', tag: 'Hot',  color: '#EF4444' },
                            { name: 'Priya Patel',  tag: 'Warm', color: '#F59E0B' },
                            { name: 'Amit Verma',   tag: 'Hot',  color: '#EF4444' },
                            { name: 'Neha Agarwal', tag: 'New',  color: '#10B981' },
                          ].map(lead => (
                            <div key={lead.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', fontSize: '8px', fontWeight: 700 }}>
                                  {lead.name[0]}
                                </div>
                                <span className="text-xs text-gray-300">{lead.name}</span>
                              </div>
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: `${lead.color}22`, color: lead.color }}>
                                {lead.tag}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════ */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(180deg,#030B24 0%,#050F2E 100%)' }}>
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-500/30"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
              PLATFORM FEATURES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Everything a Real Estate Broker Needs
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/40 hover:-translate-y-2 transition-all duration-300 cursor-default"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>
                <div className="relative h-36 overflow-hidden">
                  <img src={f.img} alt={f.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg,transparent 40%,rgba(3,11,36,0.9) 100%)' }} />
                  <div className="absolute bottom-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 16px rgba(99,102,241,0.5)' }}>
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-white mb-3">{f.title}</h3>
                  <ul className="space-y-1.5">
                    {f.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-gray-400">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ══ BENEFITS ══════════════════════════════════════════
          The right column image must match the EXACT height of
          the left column — from the heading to the last row.
          Strategy: grid items-stretch + right col h-full + image absolute inset-0
      ══════════════════════════════════════════════════════ */}
      <section id="about" className="py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#030B24' }}>
        <div className="max-w-7xl mx-auto">
          {/* items-stretch makes both columns the same height */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-stretch">

            {/* ── Left: benefits list ── */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-purple-500/30 self-start"
                style={{ background: 'rgba(139,92,246,0.1)', color: '#C4B5FD' }}>
                WHY CHOOSE US
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                Why Brokers Love{' '}
                <span className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg,#60A5FA,#A78BFA)' }}>
                  EnforData
                </span>
              </h2>
              <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                Built from the ground up for Indian real estate professionals — not a generic CRM.
              </p>
              <div className="flex flex-col gap-4">
                {BENEFITS.map((b, i) => (
                  <div key={b.title}
                    className="flex items-center gap-5 p-5 rounded-2xl border border-white/8 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 group cursor-default"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span className="text-2xl font-extrabold flex-shrink-0 w-8 text-right select-none"
                      style={{ color: 'rgba(99,102,241,0.25)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                      style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.25),rgba(139,92,246,0.25))', border: '1px solid rgba(99,102,241,0.35)' }}>
                      <b.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{b.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{b.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: image fills 100% of left column height ── */}
            {/*
              On mobile the column has no natural height (children are all absolute),
              so we give it an explicit min-h. On lg+ the grid stretches it to match
              the left column via items-stretch + h-full.
            */}
            <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-0 lg:h-full">
              {/* Glow ring */}
              <div className="absolute -inset-3 rounded-3xl opacity-20 blur-2xl pointer-events-none"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }} />

              {/* Image container */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=900&q=85"
                  alt="City skyline at dusk"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(180deg,rgba(3,11,36,0.30) 0%,rgba(3,11,36,0.08) 45%,rgba(3,11,36,0.50) 100%)' }} />

                {/* ── MOBILE card overlay (hidden on lg+) ──
                    flex-col + justify-between pushes card 1 to top and the
                    2-card grid row to the bottom. CSS grid handles equal
                    widths automatically — no absolute-position math. */}
                <div className="lg:hidden absolute inset-0 flex flex-col justify-between p-3 gap-2">

                  {/* Card 1 — New Lead */}
                  <div className="self-start animate-float rounded-xl px-3 py-2.5"
                    style={{ ...glass, boxShadow: '0 8px 32px rgba(59,130,246,0.25)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
                        <Users className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-white">New Lead</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse ml-2 flex-shrink-0" />
                    </div>
                    <p className="text-xs font-semibold text-white">2 BHK Inquiry</p>
                    <p className="text-xs text-gray-400 mt-0.5">Just now · Andheri West</p>
                  </div>

                  {/* Bottom 2-card grid (equal widths, no overlap) */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Card 2 — Site Visit */}
                    <div className="rounded-xl px-3 py-2.5 min-w-0"
                      style={{ ...glass, boxShadow: '0 8px 32px rgba(245,158,11,0.2)',
                        animation: 'float 4s ease-in-out 0.8s infinite' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
                          <Calendar className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-white truncate">Site Visit</span>
                      </div>
                      <p className="text-xs font-semibold text-white truncate">Rajesh Sharma</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">Tomorrow · 11 AM</p>
                    </div>

                    {/* Card 3 — Commission */}
                    <div className="rounded-xl px-3 py-2.5 min-w-0"
                      style={{ ...glass, boxShadow: '0 8px 32px rgba(52,211,153,0.25)',
                        animation: 'float 4s ease-in-out 1.2s infinite' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                          <DollarSign className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-bold text-white truncate">Commission</span>
                      </div>
                      <p className="text-sm font-extrabold truncate" style={{ color: '#34D399' }}>₹49,500</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">Rajesh Sharma</p>
                      <div className="mt-1.5 h-1 rounded-full overflow-hidden"
                        style={{ background: 'rgba(52,211,153,0.15)' }}>
                        <div className="h-full rounded-full"
                          style={{ width: '72%', background: 'linear-gradient(90deg,#10B981,#34D399)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── DESKTOP cards: absolutely positioned (hidden below lg) ── */}

              {/* Card 1 — New Lead (top-left) */}
              <div className="hidden lg:block absolute top-6 left-6 rounded-2xl px-5 py-4 animate-float z-10"
                style={{ ...glass, minWidth: '175px', boxShadow: '0 8px 32px rgba(59,130,246,0.25)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
                    <Users className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">New Lead</span>
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse ml-auto" />
                </div>
                <p className="text-sm font-semibold text-white">2 BHK Inquiry</p>
                <p className="text-xs text-gray-400 mt-0.5">Just now · Andheri West</p>
              </div>

              {/* Card 2 — Site Visit (bottom-left) */}
              <div className="hidden lg:block absolute bottom-8 left-6 rounded-2xl px-5 py-4 z-10"
                style={{ ...glass, minWidth: '200px', boxShadow: '0 8px 32px rgba(245,158,11,0.2)',
                  animation: 'float 4s ease-in-out 0.8s infinite' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)' }}>
                    <Calendar className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Site Visit Scheduled</span>
                </div>
                <p className="text-sm font-semibold text-white">Rajesh Sharma</p>
                <p className="text-xs text-gray-400 mt-0.5">Tomorrow · 11:00 AM</p>
              </div>

              {/* Card 3 — Commission (right, vertically centered) */}
              <div className="hidden lg:block absolute right-6 top-1/2 -translate-y-1/2 rounded-2xl px-5 py-4 z-10"
                style={{ ...glass, minWidth: '185px', boxShadow: '0 8px 32px rgba(52,211,153,0.25)',
                  animation: 'float 4s ease-in-out 1.2s infinite' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                    <DollarSign className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Commission Earned</span>
                </div>
                <p className="text-xl font-extrabold" style={{ color: '#34D399' }}>₹49,500</p>
                <p className="text-xs text-gray-400 mt-0.5">From Rajesh Sharma</p>
                <div className="mt-2 h-1 rounded-full overflow-hidden"
                  style={{ background: 'rgba(52,211,153,0.15)' }}>
                  <div className="h-full rounded-full"
                    style={{ width: '72%', background: 'linear-gradient(90deg,#10B981,#34D399)' }} />
                </div>
              </div>

            </div>{/* end right col */}

          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════ */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(180deg,#050F2E 0%,#030B24 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-500/30"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#93C5FD' }}>
              TESTIMONIALS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Trusted by Real Estate Professionals
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name}
                className="rounded-2xl p-6 border border-white/10 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)' }}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ══════════════════════════════════════════ */}
      <section className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=80"
            alt="Luxury apartment" className="w-full h-full object-cover" />
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg,rgba(3,11,36,0.93) 0%,rgba(3,11,36,0.80) 100%)' }} />
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse 50% 60% at 50% 50%,rgba(99,102,241,0.15) 0%,transparent 70%)' }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-blue-500/30"
            style={{ background: 'rgba(59,130,246,0.12)', color: '#93C5FD' }}>
            GET STARTED TODAY
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Ready to Close More Deals?
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of brokers growing their business with EnforData.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-7 py-3.5 rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 28px rgba(99,102,241,0.5)' }}>
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white px-7 py-3.5 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all">
              <Phone className="w-4 h-4" /> Talk to Sales
            </a>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
            {['Simple annual plans', 'Secure Razorpay payment', 'Cancel anytime'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════ */}
      <PricingSection />

      {/* ══ CONTACT FORM ══════════════════════════════════════ */}
      <ContactSection />

      {/* Gradient rule — mirrors the blue-purple accent used on every section badge */}
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,#3B82F6 30%,#8B5CF6 70%,transparent)' }} />

      <footer id="contact" className="py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,#030B24 0%,#020914 100%)' }}>

        {/* Ambient glow — matches hero / CTA radial glows */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 100% at 50% 100%,rgba(59,130,246,0.08) 0%,transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-8">

            {/* Brand */}
            <div className="max-w-xs">
              <img src={logoImg} alt="EnforData" className="h-16 w-auto object-contain mb-3" />
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(148,163,184,0.7)' }}>
                The all-in-one CRM platform built specifically for Indian real estate brokers, property consultants, and channel partners.
              </p>
              <div className="flex gap-2 mt-4">
                {['T', 'L', 'I'].map(s => (
                  <a key={s} href="#"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-xs transition-all duration-200"
                    style={{ color: 'rgba(148,163,184,0.6)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(99,102,241,0.5)';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(99,102,241,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(148,163,184,0.6)';
                      (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)';
                    }}>
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="flex gap-12 sm:gap-16">
              {[
                { title: 'Product', links: [
                  { label: 'Features',   href: '#features'     },
                  { label: 'Pricing',    href: '#pricing'      },
                ]},
                { title: 'Company', links: [
                  { label: 'About Us',   href: '#about'        },
                  { label: 'Blog',       href: '#testimonials' },
                ]},
                { title: 'Support', links: [
                  { label: 'Help Center', href: '/faq'          },
                  { label: 'Contact',     href: '#contact-form' },
                ]},
              ].map(col => (
                <div key={col.title}>
                  <p className="text-sm font-semibold text-white mb-3 tracking-wide">{col.title}</p>
                  <ul className="space-y-2">
                    {col.links.map(({ label, href }) => (
                      <li key={label}>
                        {href.startsWith('/') && !href.startsWith('/#') ? (
                          <Link to={href} className="text-xs transition-colors duration-200 hover:text-blue-400"
                            style={{ color: 'rgba(148,163,184,0.65)' }}>{label}</Link>
                        ) : (
                          <a href={href} className="text-xs transition-colors duration-200 hover:text-blue-400"
                            style={{ color: 'rgba(148,163,184,0.65)' }}>{label}</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: 'rgba(100,116,139,0.8)' }}>
              © {new Date().getFullYear()} EnforData. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'rgba(100,116,139,0.8)' }}>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" style={{ color: '#60A5FA' }} /> info@enfordata.com
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" style={{ color: '#60A5FA' }} /> +91 88060 04191
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" style={{ color: '#60A5FA' }} /> Sai Vision Society A/28, Pimple Saudagar, Pune 411027
              </span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
