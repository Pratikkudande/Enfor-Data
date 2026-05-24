import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routePaths';
import EnforDataLogo from '../../components/common/EnforDataLogo';
import {
  Building2, Users, Network, Calendar, FileText, BarChart3,
  CheckCircle, ArrowRight, Star, TrendingUp, Shield, Zap,
  Globe, Sparkles, Menu, X, ChevronDown
} from 'lucide-react';

/* ── count-up hook ── */
function useCountUp(target: number, duration = 1500, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, start]);
  return value;
}

/* ── colour tokens ── */
// bg-base   : #0a0f1e  (hero, why, footer)
// bg-surface: #0f1629  (features, roles, testimonials)
// accent    : blue-500 / blue-600
// muted text: white/50
// border    : white/10

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState({ brokers: 0, properties: 0, clients: 0, loaded: false });

  const bCount = useCountUp(live.brokers,    1400, statsVisible && live.loaded);
  const pCount = useCountUp(live.properties, 1600, statsVisible && live.loaded);
  const cCount = useCountUp(live.clients,    1200, statsVisible && live.loaded);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace('/api', '') ?? 'http://localhost:8080';
        const d = await (await fetch(`${base}/api/stats`)).json();
        setLive({ brokers: d.brokers ?? 0, properties: d.properties ?? 0, clients: d.clients ?? 0, loaded: true });
      } catch { setLive(p => ({ ...p, loaded: true })); }
    })();
  }, []);

  const go = () => navigate(ROUTES.LOGIN);

  const features = [
    { icon: Building2, title: 'Property Management',      desc: 'List apartments, houses, commercial spaces & plots. Track status, link clients, and filter your portfolio instantly.',       accent: 'text-blue-400',    ring: 'bg-blue-400/10'    },
    { icon: Users,     title: 'Client CRM',               desc: 'Manage buyers, sellers, tenants & owners with budget tracking, requirement notes, and status updates in one view.',          accent: 'text-emerald-400', ring: 'bg-emerald-400/10' },
    { icon: Network,   title: 'Broker Network',           desc: 'Discover and connect with verified brokers across India. Expand your reach and grow your referral business.',                accent: 'text-orange-400',  ring: 'bg-orange-400/10'  },
    { icon: Calendar,  title: 'Appointments',             desc: 'Schedule site visits, meetings & calls. A clear calendar view keeps you on top of every follow-up.',                         accent: 'text-violet-400',  ring: 'bg-violet-400/10'  },
    { icon: FileText,  title: 'Agreement Tracking',       desc: 'Create agreements linked to properties and clients. Monitor active, expired, and terminated contracts at a glance.',         accent: 'text-rose-400',    ring: 'bg-rose-400/10'    },
    { icon: BarChart3, title: 'Channel Partner Projects', desc: 'List projects with unit availability, price ranges, possession dates & amenities. Brokers browse and connect directly.',     accent: 'text-teal-400',    ring: 'bg-teal-400/10'    },
  ];

  const testimonials = [
    { name: 'Rajesh Kumar', role: 'Broker · Mumbai',           avatar: 'RK', firm: 'Kumar Properties', quote: 'All my properties and clients in one place. I track appointments, manage agreements, and see my full pipeline — no more spreadsheets.' },
    { name: 'Priya Sharma', role: 'Channel Partner · Delhi',   avatar: 'PS', firm: 'Sharma Realty',    quote: 'I list my projects with unit availability and pricing. Brokers browse them directly — connecting with the right people has never been easier.' },
    { name: 'Amit Patel',   role: 'Broker · Bangalore',        avatar: 'AP', firm: 'Patel Estates',    quote: 'Agreement tracking alone is worth it. I know exactly which are active, expiring, and which clients they are linked to — all in one view.' },
  ];

  const whyItems = [
    { icon: TrendingUp, title: 'Everything in One Place',      desc: 'Properties, clients, appointments, agreements, and broker network — no more juggling between tools.',         accent: 'text-blue-400',    ring: 'bg-blue-400/10'    },
    { icon: Zap,        title: 'Built for Indian Real Estate', desc: 'Indian states, cities, property types, and workflows that match how you actually work every day.',            accent: 'text-yellow-400',  ring: 'bg-yellow-400/10'  },
    { icon: Shield,     title: 'Secure & Role-Based',          desc: 'JWT auth, separate dashboards for brokers and channel partners, and data scoped to your account.',            accent: 'text-emerald-400', ring: 'bg-emerald-400/10' },
    { icon: Users,      title: 'Two Roles, One Platform',      desc: 'Brokers and channel partners each get a tailored experience — same platform, different workflows.',           accent: 'text-violet-400',  ring: 'bg-violet-400/10'  },
    { icon: Globe,      title: 'Pan-India Network',            desc: 'Connect with brokers across 25+ cities. Grow your referral network and expand your business reach.',          accent: 'text-teal-400',    ring: 'bg-teal-400/10'    },
    { icon: Sparkles,   title: 'Always Improving',             desc: 'New features added based on real broker and channel partner feedback — the platform grows with you.',          accent: 'text-pink-400',    ring: 'bg-pink-400/10'    },
  ];

  /* shared section label */
  const Label = ({ children }: { children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-3 py-1 rounded-full mb-5">
      {children}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] overflow-x-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ─── NAV ─── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <EnforDataLogo height={36} variant="dark" />
          <nav className="hidden md:flex items-center gap-2">
            <button onClick={() => navigate(ROUTES.PRICING)} className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/8 transition-colors">Pricing</button>
            <button onClick={go} className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors">Login</button>
          </nav>
          <button className="md:hidden p-2 text-white/60 hover:text-white" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-[#0a0f1e] border-t border-white/[0.07] px-4 py-3 space-y-1">
            <button onClick={() => { navigate(ROUTES.PRICING); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/8 rounded-lg">Pricing</button>
            <button onClick={() => { go(); setMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-sm font-semibold text-blue-400 hover:bg-white/8 rounded-lg">Login</button>
          </div>
        )}
      </header>

      {/* ─── HERO ─── bg-base */}
      <section className="relative min-h-screen flex items-center bg-[#0a0f1e] overflow-hidden pt-16">
        {/* orbs */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute top-1/4 -left-40 w-[520px] h-[520px] bg-blue-600/15 rounded-full blur-[130px]" />
          <div className="absolute bottom-1/4 -right-40 w-[420px] h-[420px] bg-violet-600/15 rounded-full blur-[110px]" />
          <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/8 border border-white/15 text-white/70 text-xs font-medium px-4 py-1.5 rounded-full mb-8">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
            India's Real Estate Business Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold text-white leading-[1.08] tracking-tight mb-6">
            Manage Your<br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-teal-400 bg-clip-text text-transparent">
              Real Estate Business
            </span>
            <br />Smarter
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            One platform for Indian brokers and channel partners — properties, clients, appointments, agreements, and your broker network, all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button onClick={go} className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-0.5">
              Get Started Free <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate(ROUTES.PRICING)} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-semibold rounded-2xl transition-all">
              View Pricing
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
            {['No credit card required', 'Free trial available', 'Setup in minutes'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />{t}
              </span>
            ))}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/20">
            <ChevronDown className="h-6 w-6" />
          </div>
        </div>
      </section>

      {/* ─── STATS ─── bg-surface */}
      <section ref={statsRef} className="py-16 bg-[#0f1629] border-y border-white/[0.07]">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: live.loaded ? bCount : null, label: 'Active Brokers'    },
            { val: live.loaded ? pCount : null, label: 'Properties Listed' },
            { val: live.loaded ? cCount : null, label: 'Clients Managed'   },
            { val: 25,                           label: 'Cities Connected'  },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-4xl sm:text-5xl font-extrabold text-white mb-1">
                {s.val === null ? <span className="text-white/20 text-2xl">…</span> : <>{s.val}+</>}
              </div>
              <div className="text-white/40 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── bg-base */}
      <section className="py-24 bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Label><Zap className="h-3.5 w-3.5" /> Platform Features</Label>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Everything you need to<br />
              <span className="text-blue-400">grow your business</span>
            </h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Purpose-built tools covering every part of your daily real estate workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 hover:bg-white/[0.07] hover:border-white/15 transition-all duration-300 cursor-default">
                  <div className={`w-11 h-11 ${f.ring} rounded-xl flex items-center justify-center mb-5`}>
                    <Icon className={`h-5 w-5 ${f.accent}`} />
                  </div>
                  <h3 className={`text-base font-bold text-white mb-2 group-hover:${f.accent} transition-colors`}>{f.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TWO ROLES ─── bg-surface */}
      <section className="py-24 bg-[#0f1629] border-y border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Label><Users className="h-3.5 w-3.5" /> Who It's For</Label>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Choose your role</h2>
            <p className="text-white/50 text-lg">Two distinct workflows, one powerful platform.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Broker */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 sm:p-10 hover:border-blue-500/40 transition-colors duration-300">
              <div className="w-13 h-13 w-12 h-12 bg-blue-500/15 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Real Estate Broker</h3>
              <p className="text-white/50 mb-7 text-sm leading-relaxed">Manage your entire brokerage — properties, clients, appointments, and agreements — from one dashboard.</p>
              <ul className="space-y-3 mb-8">
                {['Property listing with status & client linking', 'Client CRM — buyers, sellers, tenants & owners', 'Appointment scheduling & calendar view', 'Agreement creation & expiry tracking', 'Broker network & SMS marketing'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <button onClick={go} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
                Start as Broker →
              </button>
            </div>

            {/* Channel Partner */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 sm:p-10 hover:border-teal-500/40 transition-colors duration-300">
              <div className="w-12 h-12 bg-teal-500/15 rounded-2xl flex items-center justify-center mb-6">
                <Network className="h-6 w-6 text-teal-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Channel Partner</h3>
              <p className="text-white/50 mb-7 text-sm leading-relaxed">Showcase your projects to brokers across India and manage your entire project portfolio in one place.</p>
              <ul className="space-y-3 mb-8">
                {['Project listings with unit availability & pricing', 'Possession & launch date tracking', 'Amenities showcase & brochure link', 'Broker network access to promote projects', 'Project dashboard with inventory overview'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-teal-400 mt-0.5 flex-shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <button onClick={go} className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl transition-colors">
                Start as Channel Partner →
              </button>
            </div>
          </div>

          <p className="text-center text-white/40 mt-8 text-sm">
            Already have an account?{' '}
            <button onClick={go} className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">Sign in here</button>
          </p>
        </div>
      </section>

      {/* ─── WHY ─── bg-base */}
      <section className="py-24 bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Label><Sparkles className="h-3.5 w-3.5" /> Why ENFOR DATA</Label>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Built for how you work</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">Designed specifically for Indian real estate professionals.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.07] hover:border-white/15 transition-all duration-300">
                  <div className={`w-10 h-10 ${item.ring} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`h-5 w-5 ${item.accent}`} />
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-sm">{item.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── bg-surface */}
      <section className="py-24 bg-[#0f1629] border-y border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Label><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> User Stories</Label>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">What our users say</h2>
            <p className="text-white/50 text-lg">Real feedback from real estate professionals using ENFOR DATA.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 hover:border-white/15 transition-colors duration-300 flex flex-col">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-white/60 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role} · {t.firm}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── bg-base with blue glow */}
      <section className="py-28 bg-[#0a0f1e] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to organise your<br />real estate business?
          </h2>
          <p className="text-white/50 text-lg mb-10">
            Join brokers and channel partners across India who manage their business on ENFOR DATA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={go} className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-0.5">
              Get Started Free <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => navigate(ROUTES.PRICING)} className="px-8 py-4 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-semibold rounded-2xl transition-all">
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── bg-surface */}
      <footer className="bg-[#0f1629] border-t border-white/[0.07] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <EnforDataLogo height={32} variant="dark" />
            <span className="text-white/40 text-sm">Real Estate Business Platform</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
            <button onClick={() => navigate(ROUTES.PRICING)} className="hover:text-white transition-colors">Pricing</button>
            <button onClick={go} className="hover:text-white transition-colors">Login</button>
            <button onClick={go} className="hover:text-white transition-colors">Register</button>
          </div>
          <p className="text-xs text-white/25">© {new Date().getFullYear()} ENFOR DATA. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
