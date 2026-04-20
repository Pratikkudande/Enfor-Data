import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { clients } from '../mockData';

const SendMessageTab: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  const handleSendMessage = () => {
    console.log('Sending message:', { messageText, selectedClients });
    setMessageText('');
    setSelectedClients([]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Send WhatsApp Message</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Type
          </label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="individual">Individual Message</option>
            <option value="bulk">Bulk Message</option>
            <option value="segment">Segment-based</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Recipients
          </label>
          <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {clients.map((client) => (
                <label key={client.id} className="flex items-center">
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
                  <span className="ml-2 text-sm text-gray-900">
                    {client.name} ({client.type})
                  </span>
                </label>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {selectedClients.length} clients selected
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">
            {messageText.length}/1000 characters
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSendMessage}
            disabled={!messageText || selectedClients.length === 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="h-4 w-4 mr-2" />
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendMessageTab;
