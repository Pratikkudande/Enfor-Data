import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, FileText, BarChart3, Settings } from 'lucide-react';
import { getSMSAccount, SMSAccount } from '../../services/smsMarketingApi';
import DashboardTab from './Tabs/DashboardTab';
import SendMessageTab from './Tabs/SendMessageTab';
import TemplatesTab from './Tabs/TemplatesTab';
import AnalyticsTab from './Tabs/AnalyticsTab';
import SetupModal from './Setup/SetupModal';

type TabType = 'dashboard' | 'send' | 'templates' | 'analytics';

const SMSMarketingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [account, setAccount] = useState<SMSAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await getSMSAccount();
      
      // Handle the response structure
      if (data && typeof data === 'object') {
        setAccount(data.account || null);
        setIsConnected(data.connected || false);
        
        // Show setup modal if not connected
        if (!data.connected) {
          setShowSetup(true);
        }
      } else {
        // Fallback if response structure is unexpected
        setAccount(null);
        setIsConnected(false);
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Failed to load SMS account:', error);
      setAccount(null);
      setIsConnected(false);
      setShowSetup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadAccount();
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: MessageSquare },
    { id: 'send' as TabType, label: 'Send Message', icon: Send },
    { id: 'templates' as TabType, label: 'Templates', icon: FileText },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading SMS Marketing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SMS Marketing</h1>
            <p className="text-sm text-gray-600 mt-1">
              Send SMS campaigns to your clients using MSG91
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isConnected && account && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Sender ID</div>
                <div className="font-semibold text-gray-900">{account.msg91_sender_id || 'MSG91 Connected'}</div>
              </div>
            )}
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800">
                SMS account not connected. Connect your MSG91 account to start sending messages.
              </span>
            </div>
            <button
              onClick={() => setShowSetup(true)}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
            >
              Connect Now
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={!isConnected && tab.id !== 'dashboard'}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative
                  ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                  ${!isConnected && tab.id !== 'dashboard' ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && (
          <DashboardTab account={account} isConnected={isConnected} onRefresh={loadAccount} />
        )}
        {activeTab === 'send' && isConnected && (
          <SendMessageTab account={account} onRefresh={loadAccount} />
        )}
        {activeTab === 'templates' && isConnected && <TemplatesTab />}
        {activeTab === 'analytics' && isConnected && <AnalyticsTab />}
      </div>

      {/* Setup Modal */}
      {showSetup && (
        <SetupModal
          isOpen={showSetup}
          onClose={() => setShowSetup(false)}
          onComplete={handleSetupComplete}
          currentAccount={account}
        />
      )}
    </div>
  );
};

export default SMSMarketingView;
