import React, { useState, useEffect } from 'react';
import { Send, Users, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { whatsappApi } from '../../../services/whatsappApi';
import { clientApi } from '../../../services/clientApi';

interface SendMessageTabProps {
  connected: boolean;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  type: string;
}

const SendMessageTab: React.FC<SendMessageTabProps> = ({ connected }) => {
  const [messageText, setMessageText] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [messageType, setMessageType] = useState<'individual' | 'bulk'>('individual');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const response = await clientApi.getClients();
      setClients(response.clients || []);
    } catch (err: any) {
      console.error('Failed to load clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSendMessage = async () => {
    if (!connected) {
      setError('Please connect your WhatsApp account first');
      return;
    }

    if (!messageText.trim()) {
      setError('Please enter a message');
      return;
    }

    if (selectedClients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (messageType === 'individual' && selectedClients.length === 1) {
        // Send individual message
        await whatsappApi.sendMessage({
          client_id: selectedClients[0],
          message: messageText,
        });
        setSuccess('Message sent successfully!');
      } else {
        // Create and send campaign
        const name = campaignName.trim() || `Campaign ${new Date().toLocaleString()}`;
        const response = await whatsappApi.createCampaign({
          name,
          message: messageText,
          client_ids: selectedClients,
        });
        
        // Send the campaign
        if (response.data?.id) {
          await whatsappApi.sendCampaign(response.data.id);
        }
        
        setSuccess(`Campaign created and sent to ${selectedClients.length} recipients!`);
      }

      // Reset form
      setMessageText('');
      setCampaignName('');
      setSelectedClients([]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || client.phone.includes(search) || client.type.toLowerCase().includes(search);
  });

  if (!connected) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Not Connected</h3>
        <p className="text-gray-600">Connect your WhatsApp account to send messages</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Send WhatsApp Message</h3>
        
        <div className="space-y-6">
          {/* Message Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Type
            </label>
            <select 
              value={messageType}
              onChange={(e) => setMessageType(e.target.value as 'individual' | 'bulk')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="individual">Individual Message</option>
              <option value="bulk">Bulk Campaign</option>
            </select>
          </div>

          {/* Campaign Name (for bulk) */}
          {messageType === 'bulk' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name (Optional)
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., New Year Promotion"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Select Recipients */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Recipients
              </label>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedClients.length === filteredClients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {loadingClients ? (
              <div className="text-center py-8">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No clients found</p>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-3 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredClients.map((client) => (
                    <label key={client.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients([...selectedClients, client.id]);
                          } else {
                            setSelectedClients(selectedClients.filter(id => id !== client.id));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {client.first_name} {client.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {client.phone} • {client.type}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              {messageText.length}/1000 characters
            </p>
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || selectedClients.length === 0 || loading}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {messageType === 'bulk' ? 'Campaign' : 'Message'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessageTab;
