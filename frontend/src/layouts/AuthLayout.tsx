import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '../routes/routePaths';
import logo from '../assets/enfordata-logo.svg';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 items-center justify-center">
          <div className="w-full max-w-md text-center text-white">
            <div className="mb-6 flex justify-center">
              <div className="bg-white/95 rounded-md p-3 inline-block shadow-lg">
                <img src={logo} alt="Enfor Data" className="h-16" />
              </div>
            </div>

            <p className="text-blue-100 mb-8 opacity-90">Real Estate Business Platform</p>

            <div className="space-y-6 text-left mt-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Property Management</h3>
                  <p className="text-blue-200 text-sm opacity-90">Manage all your properties in one place</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">WhatsApp Integration</h3>
                  <p className="text-blue-200 text-sm opacity-90">Direct client communication and marketing</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Broker Network</h3>
                  <p className="text-blue-200 text-sm opacity-90">Connect with brokers across India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col items-center justify-center">
          <div className="w-full max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <Link
                to={ROUTES.HOME}
                className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
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
