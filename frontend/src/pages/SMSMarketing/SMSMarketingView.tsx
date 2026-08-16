import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, FileText, BarChart3, Settings, Hash } from 'lucide-react';
import { getSMSAccount, SMSAccount, SMSProviderInfo } from '../../services/smsMarketingApi';
import DashboardTab from './Tabs/DashboardTab';
import SendMessageTab from './Tabs/SendMessageTab';
import TemplatesTab from './Tabs/TemplatesTab';
import HeadersTab from './Tabs/HeadersTab';
import AnalyticsTab from './Tabs/AnalyticsTab';
import SetupModal from './Setup/SetupModal';

type TabType = 'dashboard' | 'send' | 'templates' | 'headers' | 'analytics';

const SMSMarketingView: React.FC = () => {
  // Version marker for cache busting: v2.0-fast2sms
  const componentId = React.useRef(Math.random().toString(36).substring(7));
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [account, setAccount] = useState<SMSAccount | null>(null);
  const [providerInfo, setProviderInfo] = useState<SMSProviderInfo>({ provider: 'MSG91', enabled: false });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [providerLoaded, setProviderLoaded] = useState(false);

  useEffect(() => {
    console.log(`🚀 SMS Marketing View Loaded - Version 2.0 (Fast2SMS Support) - ID: ${componentId.current}`);
  }, []);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const data = await getSMSAccount();
      
      console.log('🔍 SMS Account API Response:', data);
      console.log('🔍 Provider Info:', data?.provider);
      console.log('🔍 Connected Status:', data?.connected);
      console.log('🔍 Provider Initialized:', data?.provider?.initialized);
      
      // Handle the response structure
      if (data && typeof data === 'object') {
        console.log('✅ Data is valid object');
        
        setAccount(data.account || null);
        console.log('✅ Account set');
        
        setIsConnected(data.connected || false);
        console.log('✅ IsConnected set to:', data.connected);
        
        // Handle provider info
        if (data.provider) {
          console.log('✅ data.provider exists:', data.provider);
          console.log('✅ Setting provider info to:', data.provider);
          console.log('✅ Provider Name from API:', data.provider.provider);
          console.log('✅ Sender ID from API:', data.provider.sender_id);
          console.log('✅ Initialized from API:', data.provider.initialized);
          
          // Set provider info
          setProviderInfo(data.provider);
          console.log('✅ setProviderInfo called with:', data.provider);
          
          setProviderLoaded(true);
          console.log('✅ Provider loaded set to true');
        } else {
          console.log('⚠️ No provider info in response, using default MSG91');
          // Fallback to default
          setProviderInfo({ provider: 'MSG91', enabled: false });
          setProviderLoaded(true);
        }
        
        // Don't show setup modal automatically - user can click Settings button
        // Previously: if (!data.connected && data.provider) { setShowSetup(true); }
      } else {
        console.log('❌ Data is not a valid object');
        // Fallback if response structure is unexpected
        setAccount(null);
        setIsConnected(false);
        setProviderInfo({ provider: 'MSG91', enabled: false });
        setProviderLoaded(true);
      }
    } catch (error) {
      console.error('❌ Failed to load SMS account:', error);
      setAccount(null);
      setIsConnected(false);
      setProviderInfo({ provider: 'MSG91', enabled: false });
      setProviderLoaded(true);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    console.log('📊 Provider Info State Changed:', providerInfo);
    console.log('📊 Provider Name:', providerInfo.provider);
    console.log('📊 Is Connected:', isConnected);
    console.log('📊 Is Initialized:', providerInfo.initialized);
  }, [providerInfo, isConnected]);

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadAccount();
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: MessageSquare },
    { id: 'send' as TabType, label: 'Send Message', icon: Send },
    { id: 'templates' as TabType, label: 'Templates', icon: FileText },
    { id: 'headers' as TabType, label: 'Headers', icon: Hash },
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
              Send SMS campaigns to your clients using {providerInfo.provider}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Display Provider Info */}
            <div className="text-right bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide">SMS Provider</div>
              <div className="font-semibold text-gray-900 mt-0.5">{providerInfo.provider}</div>
              {providerInfo.sender_id && (
                <div className="text-xs text-gray-600 mt-1">
                  Sender ID: {providerInfo.sender_id}
                </div>
              )}
              {providerInfo.initialized && (
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Connected
                </div>
              )}
            </div>
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

      {/* Connection Status Banner - Only show if provider is not initialized */}
      {!isConnected && !providerInfo.initialized && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800">
                SMS account not connected. Connect your {providerInfo.provider} account to start sending messages.
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
            // Enable all tabs if provider is initialized, regardless of account connection status
            const isDisabled = !providerInfo.initialized && tab.id !== 'dashboard';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={isDisabled}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative
                  ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
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
          <DashboardTab account={account} isConnected={isConnected || providerInfo.initialized} providerInfo={providerInfo} onRefresh={loadAccount} />
        )}
        {activeTab === 'send' && providerInfo.initialized && (
          <SendMessageTab account={account} onRefresh={loadAccount} />
        )}
        {activeTab === 'templates' && providerInfo.initialized && <TemplatesTab />}
        {activeTab === 'headers' && providerInfo.initialized && <HeadersTab />}
        {activeTab === 'analytics' && providerInfo.initialized && <AnalyticsTab />}
      </div>

      {/* Setup Modal */}
      {showSetup && providerLoaded && (
        <SetupModal
          isOpen={showSetup}
          onClose={() => setShowSetup(false)}
          onComplete={handleSetupComplete}
          currentAccount={account}
          providerInfo={providerInfo}
        />
      )}
    </div>
  );
};

export default SMSMarketingView;
