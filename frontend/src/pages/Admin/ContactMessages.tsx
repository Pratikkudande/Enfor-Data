import React, { useEffect, useState } from 'react';
import { Mail, Phone, User, Inbox, Loader2 } from 'lucide-react';
import { getContactMessages, ContactMessage } from '../../services/adminApi';

const ContactMessages: React.FC = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getContactMessages()
      .then((res) => { if (mounted) setMessages(res.data || []); })
      .catch((e) => { if (mounted) setError(e?.message || 'Failed to load messages'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-gray-600 mt-1">Enquiries submitted through the website contact form.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading messages…
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {!loading && !error && messages.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Inbox className="h-7 w-7 text-gray-400" />
          </div>
          <p className="text-gray-500">No contact messages yet.</p>
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                  <User className="h-4 w-4 text-gray-400" /> {m.name}
                </div>
                <span className="text-xs text-gray-400">{formatDate(m.created_at)}</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mb-3">
                <a href={`mailto:${m.email}`} className="flex items-center gap-1.5 hover:text-blue-600">
                  <Mail className="h-4 w-4 text-gray-400" /> {m.email}
                </a>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="flex items-center gap-1.5 hover:text-blue-600">
                    <Phone className="h-4 w-4 text-gray-400" /> {m.phone}
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactMessages;
