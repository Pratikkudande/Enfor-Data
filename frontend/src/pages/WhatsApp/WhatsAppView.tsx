import React, { useState } from 'react';
import { MessageSquare, Send, BarChart3, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardTab from './Tabs/DashboardTab';
import SendMessageTab from './Tabs/SendMessageTab';
import TemplatesTab from './Tabs/TemplatesTab';
import AnalyticsTab from './Tabs/AnalyticsTab';
import SetupWizard from './Setup/SetupWizard';
import { useWhatsAppAccount } from './hooks/useWhatsAppAccount';
import { useAuth } from '../../context/AuthContext';

const WhatsAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { account, connected, loading, connectAccount, error, refreshAccount } = useWhatsAppAccount();
  const { user } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'send', label: 'Send Message', icon: Send },
    { id: 'templates', label: 'Templates', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const handleSetupComplete = () => {
    // Refresh account data after setup
    refreshAccount();
  };

  // Show setup wizard if not connected
  if (!connected && !loading) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading WhatsApp module...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Marketing</h1>
        <p className="text-gray-600 mt-1">Manage your WhatsApp campaigns and client communication</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {/* Connection Status Banner */}
      <div className="rounded-xl p-4 border bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">WhatsApp Connected</p>
              <p className="text-sm text-green-700">
                {account?.phone_number} • {account?.messages_sent_today || 0} / {account?.message_limit || 1000} messages sent today
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && <DashboardTab connected={connected} account={account} />}
          {activeTab === 'send' && <SendMessageTab connected={connected} />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppView;