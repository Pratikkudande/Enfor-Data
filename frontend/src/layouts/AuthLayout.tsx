import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '../routes/routePaths';
import logo from '../assets/logo.png';

const AuthLayout: React.FC = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center py-10 px-4"
      style={{ backgroundColor: '#030B24' }}
    >
      <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[88vh]">

        {/* Left Side — Branding */}
        <div
          className="hidden lg:flex lg:w-1/2 p-8 items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #030B24 0%, #050F2E 60%, #0D1B3E 100%)' }}
        >
          {/* Ambient glow blobs */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: 0,
              background: 'radial-gradient(ellipse 70% 55% at 25% 40%, rgba(59,130,246,0.18) 0%, transparent 65%)',
            }}
          />
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)' }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}
          />

          <div className="relative w-full max-w-md text-center z-10">
            {/* Logo */}
            <div className="mb-4 flex justify-center">
              <img src={logo} alt="Enfor Data" className="h-24" />
            </div>

            <p className="mb-6 text-sm font-medium tracking-wide" style={{ color: '#93C5FD' }}>
              Real Estate Business Platform
            </p>

            <div className="space-y-3 text-left">
              {[
                {
                  title: 'Property Management',
                  desc: 'Manage all your properties in one place',
                  icon: <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />,
                },
                {
                  title: 'Lead Management',
                  desc: 'Capture, assign and track leads end-to-end',
                  icon: <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />,
                },
                {
                  title: 'Site Visit Management',
                  desc: 'Schedule visits, reminders & track history',
                  icon: <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />,
                },
                {
                  title: 'Broker Network',
                  desc: 'Connect with brokers across India',
                  icon: <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />,
                },
                {
                  title: 'Agreements & Documents',
                  desc: 'Store agreements, KYC & property docs securely',
                  icon: <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />,
                },
                {
                  title: 'SMS Marketing',
                  desc: 'Bulk SMS campaigns with delivery tracking',
                  icon: <path d="M18 2a2 2 0 012 2v9a2 2 0 01-2 2H6l-4 4V4a2 2 0 012-2h14z" />,
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 12px rgba(99,102,241,0.4)' }}
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      {f.icon}
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-xs">{f.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: '#93C5FD', opacity: 0.75 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom badge */}
            <div
              className="mt-5 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#93C5FD' }}
            >
              ✨ Built for Indian Real Estate Brokers
            </div>
          </div>
        </div>

        {/* Right Side — Auth Forms */}
        <div className="w-full lg:w-1/2 p-8 flex flex-col items-center justify-center bg-white">
          <div className="w-full overflow-y-auto">
            <div className="mb-6">
              <Link
                to={ROUTES.HOME}
                className="flex items-center text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: '#6366F1' }}
              >
                ← Back to Home
              </Link>
            </div>
            <Outlet />
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
