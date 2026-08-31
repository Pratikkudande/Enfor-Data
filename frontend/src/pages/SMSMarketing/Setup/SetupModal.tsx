import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { connectSMSAccount, disconnectSMSAccount, SMSAccount, getSMSAccount, SMSProviderInfo } from '../../../services/smsMarketingApi';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentAccount: SMSAccount | null;
  providerInfo?: SMSProviderInfo;
}

const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, onComplete, currentAccount, providerInfo: providedProviderInfo }) => {
  const [loading, setLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [providerInfo, setProviderInfo] = useState<SMSProviderInfo>(providedProviderInfo || { provider: 'MSG91', enabled: false });

  useEffect(() => {
    console.log('🔍 SetupModal - Provider Info Prop:', providedProviderInfo);
    // Update provider info if provided via props
    if (providedProviderInfo) {
      console.log('✅ SetupModal - Using provided provider info:', providedProviderInfo);
      setProviderInfo(providedProviderInfo);
    } else if (isOpen) {
      console.log('⚠️ SetupModal - No provider info provided, loading from API');
      // Only load if not provided
      loadProviderInfo();
    }
  }, [isOpen, providedProviderInfo]);

  const loadProviderInfo = async () => {
    try {
      const data = await getSMSAccount();
      // Handle response - data is already the correct structure
      if (data?.provider) {
        setProviderInfo(data.provider);
      }
    } catch (error) {
      console.error('Failed to load provider info:', error);
      // Keep default provider info on error
    }
  };

  if (!isOpen) return null;

  const providerName = providerInfo.provider;

  const handleConnect = async () => {
    try {
      setLoading(true);
      // Send empty object since credentials are configured server-side
      await connectSMSAccount({});
      alert(`${providerName} SMS account connected successfully!`);
      onComplete();
    } catch (error: any) {
      alert('Failed to connect: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your SMS account?')) return;
    try {
      setDisconnecting(true);
      await disconnectSMSAccount();
      alert('SMS account disconnected successfully');
      onComplete();
    } catch (error: any) {
      alert('Failed to disconnect: ' + (error.response?.data?.message || error.message));
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">SMS Account Setup</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">{providerName} SMS Service</h3>
            <p className="text-sm text-blue-800">
              Your {providerName} SMS service is pre-configured by your administrator. 
              Click the connect button below to enable SMS messaging for your account.
            </p>
          </div>

          {/* Connect/Disconnect Buttons */}
          <div className="flex gap-3 pt-4">
            {currentAccount && currentAccount.status === 'connected' && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            )}
            <button
              type="button"
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {loading ? 'Connecting...' : `Connect ${providerName} Account`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupModal;
