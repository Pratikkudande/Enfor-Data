import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '../routes/routePaths';
import logo from '../assets/logo.png';

const AuthLayout: React.FC = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#030B24' }}
    >
      <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Left Side — Branding */}
        <div
          className="hidden lg:flex lg:w-1/2 p-12 items-center justify-center relative overflow-hidden"
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
            <div className="mb-6 flex justify-center">
              <img src={logo} alt="Enfor Data" className="h-28" />
            </div>

            <p className="mb-10 text-sm font-medium tracking-wide" style={{ color: '#93C5FD' }}>
              Real Estate Business Platform
            </p>

            <div className="space-y-4 text-left">
              {/* Feature 1 */}
              <div
                className="flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 16px rgba(99,102,241,0.45)' }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Property Management</h3>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#93C5FD', opacity: 0.8 }}>
                    Manage all your properties in one place
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div
                className="flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 16px rgba(99,102,241,0.45)' }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 2a2 2 0 012 2v9a2 2 0 01-2 2H6l-4 4V4a2 2 0 012-2h14z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">SMS Marketing</h3>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#93C5FD', opacity: 0.8 }}>
                    Direct client communication via SMS campaigns
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div
                className="flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 16px rgba(99,102,241,0.45)' }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Broker Network</h3>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#93C5FD', opacity: 0.8 }}>
                    Connect with brokers across India
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom badge */}
            <div
              className="mt-8 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#93C5FD' }}
            >
              ✨ Built for Indian Real Estate Brokers
            </div>
          </div>
        </div>

        {/* Right Side — Auth Forms */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col items-center justify-center bg-white">
          <div className="w-full max-h-[80vh] overflow-y-auto">
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
