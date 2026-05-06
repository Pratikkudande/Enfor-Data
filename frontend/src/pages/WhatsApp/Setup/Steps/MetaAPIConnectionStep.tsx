import React, { useState } from 'react';
import { Key, HelpCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { api } from '../../../../services/apiClient';

interface MetaAPIConnectionStepProps {
  onComplete: () => void;
}

const MetaAPIConnectionStep: React.FC<MetaAPIConnectionStepProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    access_token: '',
    phone_number_id: '',
    business_account_id: '',
    waba_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/whatsapp/setup/connect-meta-api', formData);
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to connect Meta WhatsApp API');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div>
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Key className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Meta WhatsApp API</h2>
        <p className="text-gray-600">
          Enter your Meta WhatsApp Business API credentials to complete the setup
        </p>
      </div>

      {/* Help Toggle */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
      >
        <HelpCircle className="h-4 w-4 mr-1" />
        {showHelp ? 'Hide' : 'Show'} help - How to get these credentials
      </button>

      {/* Help Section */}
      {showHelp && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-blue-900 mb-2">How to Get Your Credentials:</h3>
          
          <div className="space-y-2 text-sm text-blue-800">
            <div>
              <strong>1. Create Facebook App:</strong>
              <p className="ml-4">• Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a></p>
              <p className="ml-4">• Click "My Apps" → "Create App" → Select "Business"</p>
            </div>

            <div>
              <strong>2. Add WhatsApp Product:</strong>
              <p className="ml-4">• In app dashboard, click "Add Product"</p>
              <p className="ml-4">• Find "WhatsApp" and click "Set Up"</p>
            </div>

            <div>
              <strong>3. Get Credentials:</strong>
              <p className="ml-4">• Go to WhatsApp → API Setup</p>
              <p className="ml-4">• <strong>Access Token:</strong> Click "Generate Access Token"</p>
              <p className="ml-4">• <strong>Phone Number ID:</strong> Copy from API Setup page</p>
              <p className="ml-4">• <strong>Business Account ID & WABA ID:</strong> Found in WhatsApp settings</p>
            </div>
          </div>

          <a
            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
          >
            View Full Documentation
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Access Token */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Token *
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              name="access_token"
              value={formData.access_token}
              onChange={handleChange}
              placeholder="EAAxxxxxxxxxx..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Generate from Meta Developer Console → WhatsApp → API Setup
          </p>
        </div>

        {/* Phone Number ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number ID *
          </label>
          <input
            type="text"
            name="phone_number_id"
            value={formData.phone_number_id}
            onChange={handleChange}
            placeholder="123456789012345"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Found in WhatsApp → API Setup page
          </p>
        </div>

        {/* Business Account ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Account ID *
          </label>
          <input
            type="text"
            name="business_account_id"
            value={formData.business_account_id}
            onChange={handleChange}
            placeholder="987654321098765"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Found in WhatsApp settings or URL
          </p>
        </div>

        {/* WABA ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WABA ID *
          </label>
          <input
            type="text"
            name="waba_id"
            value={formData.waba_id}
            onChange={handleChange}
            placeholder="987654321098765"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Usually same as Business Account ID
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Your credentials will be securely encrypted and stored. 
            We'll validate them before saving to ensure they work correctly.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              'Connect WhatsApp API'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MetaAPIConnectionStep;
