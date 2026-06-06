import React, { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement, sendAnnouncement } from '../../services/adminApi';
import { Plus, Send, X, Megaphone } from 'lucide-react';

const AnnouncementCenter: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    title: '', message: '', type: 'dashboard', target: 'all', target_value: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = () => {
    setLoading(true);
    getAnnouncements({ page: 1, limit: 20 })
      .then(res => { setAnnouncements(res.data?.announcements ?? []); setTotal(res.data?.total ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAnnouncement(form);
      showToast('Announcement created successfully');
      setShowForm(false);
      setForm({ title: '', message: '', type: 'dashboard', target: 'all', target_value: '' });
      fetchAnnouncements();
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await sendAnnouncement(id);
      showToast('Announcement sent to brokers!');
      fetchAnnouncements();
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const TYPE_LABELS: Record<string, string> = {
    dashboard: 'Dashboard Notification', popup: 'Popup', sms: 'SMS', email: 'Email',
  };
  const TARGET_LABELS: Record<string, string> = {
    all: 'All Brokers', selected: 'Selected Brokers', package: 'Package-wise', area: 'Area-wise',
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Announcement Center</h2>
          <p className="text-sm text-gray-500">{total} announcements</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {/* Announcements list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500 border border-gray-100">
            <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No announcements yet. Create your first one!</p>
          </div>
        ) : announcements.map((a: any) => (
          <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {a.status === 'sent' ? '✓ Sent' : '⏳ Draft'}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{TYPE_LABELS[a.type] ?? a.type}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{TARGET_LABELS[a.target] ?? a.target}</span>
                  {a.target_value && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.target_value}</span>}
                </div>
                <h4 className="font-semibold text-gray-800">{a.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(a.created_at).toLocaleString()}
                  {a.sent_at && ` · Sent: ${new Date(a.sent_at).toLocaleString()}`}
                </p>
              </div>
              {a.status === 'draft' && (
                <button
                  onClick={() => handleSend(a.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 flex-shrink-0"
                >
                  <Send className="w-3 h-3" /> Send Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-800">Create Announcement</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Title *</label>
                <input
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Announcement message..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Channel</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="popup">Popup</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Target</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                  >
                    <option value="all">All Brokers</option>
                    <option value="package">Package-wise</option>
                    <option value="area">Area-wise</option>
                  </select>
                </div>
              </div>
              {(form.target === 'package' || form.target === 'area') && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    {form.target === 'package' ? 'Package Name' : 'Area/City'}
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.target_value}
                    onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))}
                    placeholder={form.target === 'package' ? 'e.g. starter, professional' : 'e.g. Mumbai, Delhi'}
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementCenter;
