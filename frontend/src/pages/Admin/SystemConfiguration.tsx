import React, { useEffect, useState } from 'react';
import { getConfig, updateConfig } from '../../services/adminApi';
import { Settings, Save, Edit2, X } from 'lucide-react';

const SystemConfiguration: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toast, setToast] = useState('');

  const fetchConfigs = () => {
    setLoading(true);
    getConfig().then(res => setConfigs(res.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchConfigs(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const startEdit = (config: any) => {
    setEditing(config.key);
    setEditValue(config.value);
  };

  const cancelEdit = () => { setEditing(null); setEditValue(''); };

  const saveEdit = async (key: string) => {
    try {
      await updateConfig(key, editValue);
      showToast('Configuration updated successfully');
      setEditing(null);
      fetchConfigs();
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const CONFIG_LABELS: Record<string, { label: string; desc: string }> = {
    sms_provider: { label: 'SMS Provider', desc: 'SMS gateway provider (MSG91, Twilio, etc.)' },
    email_provider: { label: 'Email Provider', desc: 'Email service provider (resend, sendgrid, etc.)' },
    razorpay_enabled: { label: 'Razorpay Enabled', desc: 'Enable/disable Razorpay payment gateway (true/false)' },
    renewal_reminder_days: { label: 'Renewal Reminder Days', desc: 'Comma-separated days before expiry to send reminders' },
    max_upload_size_mb: { label: 'Max Upload Size (MB)', desc: 'Maximum file upload size in megabytes' },
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>
      )}

      <div>
        <h2 className="text-xl font-bold text-gray-800">System Configuration</h2>
        <p className="text-sm text-gray-500">Manage platform-wide settings</p>
      </div>

      <div className="space-y-3">
        {configs.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center text-gray-500 border border-gray-100">
            <Settings className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p>No configuration settings found</p>
          </div>
        ) : configs.map((config: any) => {
          const meta = CONFIG_LABELS[config.key];
          const isEditing = editing === config.key;
          return (
            <div key={config.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800">{meta?.label ?? config.key}</h4>
                    <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{config.key}</code>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{meta?.desc ?? config.description}</p>

                  {isEditing ? (
                    <div className="flex gap-2 items-center">
                      <input
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(config.key)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex-1 font-mono">
                        {config.value || '(empty)'}
                      </code>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <button
                    onClick={() => startEdit(config)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Last updated: {new Date(config.updated_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800">
        <strong>Important:</strong> Changes to system configuration take effect immediately. For Razorpay, SMS, and Email provider settings, also update the backend <code className="bg-yellow-100 px-1 rounded">config.env</code> file and restart the server.
      </div>
    </div>
  );
};

export default SystemConfiguration;
