import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/Landing/LandingPage';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import BrokerDashboard from './components/Dashboard/BrokerDashboard';
import PropertiesView from './components/Properties/PropertiesView';
import WhatsAppView from './components/WhatsApp/WhatsAppView';
import ClientsView from './components/Clients/ClientsView';
import AppointmentsView from './components/Appointments/AppointmentsView';
import BrokerNetworkView from './components/Network/BrokerNetworkView';
import BusinessPostsView from './components/BusinessPosts/BusinessPostsView';
import MarketingView from './components/Marketing/MarketingView';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    setIsSidebarOpen(false);
  };

  // Mock dashboard stats
  const mockStats = {
    totalProperties: 24,
    totalClients: 156,
    totalAppointments: 3,
    whatsappMessagesCount: 1250,
    remainingMessages: 750,
    clientsByType: {
      buyers: 45,
      sellers: 32,
      tenants: 58,
      owners: 21
    },
    propertiesByStatus: {
      available: 18,
      sold: 3,
      rented: 2,
      under_negotiation: 1
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ENFOR DATA...</p>
        </div>
      </div>
    );
  }

  // Show landing page first
  if (showLanding && !isAuthenticated) {
    return <LandingPage onGetStarted={() => setShowLanding(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 items-center justify-center">
            <div className="text-center text-white">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">ENFOR DATA</h1>
                <p className="text-xl text-blue-100">Real Estate Business Platform</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Property Management</h3>
                    <p className="text-blue-200 text-sm">Manage all your properties in one place</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">WhatsApp Integration</h3>
                    <p className="text-blue-200 text-sm">Direct client communication and marketing</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Broker Network</h3>
                    <p className="text-blue-200 text-sm">Connect with brokers across India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <div className="w-full lg:w-1/2 p-12 flex items-center justify-center">
            <div className="w-full max-h-[80vh] overflow-y-auto">
              <div className="mb-6">
                <button
                  onClick={() => setShowLanding(true)}
                  className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                >
                  ← Back to Home
                </button>
              </div>
            {isLoginMode ? (
              <LoginForm onToggleMode={() => setIsLoginMode(false)} />
            ) : (
              <RegisterForm onToggleMode={() => setIsLoginMode(true)} />
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <BrokerDashboard stats={mockStats} />;
      case 'properties':
        return <PropertiesView />;
      case 'whatsapp':
        return <WhatsAppView />;
      case 'clients':
        return <ClientsView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'network':
        return <BrokerNetworkView />;
      case 'business-posts':
        return <BusinessPostsView />;
      case 'marketing':
        return <MarketingView />;
      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {currentSection.charAt(0).toUpperCase() + currentSection.slice(1)}
            </h3>
            <p className="text-gray-600">This section is coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />
      
      <div className="flex pt-16 bg-gray-100">
        <Sidebar
          isOpen={isSidebarOpen}
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
        />

        <main className="flex-1 lg:ml-60 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen">
          {renderCurrentSection()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;