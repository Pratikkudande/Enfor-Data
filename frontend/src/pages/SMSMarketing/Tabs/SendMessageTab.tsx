import React, { useState, useEffect } from 'react';
import { Send, Users, MessageSquare } from 'lucide-react';
import { sendSMS, sendBulkSMS, SMSAccount } from '../../../services/smsMarketingApi';
import { clientApi, Client } from '../../../services/clientApi';

interface SendMessageTabProps {
  account: SMSAccount | null;
  onRefresh: () => void;
}

const SendMessageTab: React.FC<SendMessageTabProps> = ({ onRefresh }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await clientApi.getClients();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
  );

  const handleSelectClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c.id));
    }
  };

  const handleSend = async () => {
    if (!message.trim() || selectedClients.length === 0) return;

    try {
      setSending(true);

      if (selectedClients.length === 1) {
        await sendSMS({ client_id: selectedClients[0], message });
        alert('SMS sent successfully!');
      } else {
        const result = await sendBulkSMS({ client_ids: selectedClients, message });
        alert(
          `Bulk SMS sent!\nSuccessful: ${result.data.successful}\nFailed: ${result.data.failed}`
        );
      }

      setMessage('');
      setSelectedClients([]);
      onRefresh();
    } catch (error: any) {
      alert('Failed to send SMS: ' + (error.response?.data?.message || error.message));
    } finally {
      setSending(false);
    }
  };

  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Recipients
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedClients.length} client(s) selected
              </p>
            </div>

            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="p-4 border-b border-gray-200">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedClients.length === filteredClients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredClients.map((client) => (
                <label
                  key={client.id}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => handleSelectClient(client.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {client.first_name} {client.last_name}
                    </div>
                    <div className="text-sm text-gray-600">{client.phone}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message Composer */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Compose Message
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{charCount} characters</span>
                  <span>{smsCount} SMS</span>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={sending || !message.trim() || selectedClients.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 btn-primary"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send SMS to {selectedClients.length} recipient(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMessageTab;
