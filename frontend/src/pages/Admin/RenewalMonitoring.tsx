import React, { useEffect, useState } from 'react';
import { getRenewals } from '../../services/adminApi';
import { RefreshCw, AlertTriangle, Clock, XCircle } from 'lucide-react';

const RenewalMonitoring: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'30_days' | '15_days' | '7_days' | 'expired'>('30_days');

  useEffect(() => {
    getRenewals().then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const tabs = [
    { id: '30_days', label: 'Expiring in 30 Days', icon: RefreshCw, color: 'text-blue-600', count: data?.['30_days']?.length ?? 0 },
    { id: '15_days', label: 'Expiring in 15 Days', icon: Clock, color: 'text-yellow-600', count: data?.['15_days']?.length ?? 0 },
    { id: '7_days', label: 'Expiring in 7 Days', icon: AlertTriangle, color: 'text-orange-600', count: data?.['7_days']?.length ?? 0 },
    { id: 'expired', label: 'Expired', icon: XCircle, color: 'text-red-600', count: data?.['expired']?.length ?? 0 },
  ] as const;

  const current = data?.[activeTab] ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Renewal Monitoring</h2>
        <p className="text-sm text-gray-500">Track subscription renewals and expirations</p>
      </div>

      {/* Tab cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl border text-left transition-all ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:shadow-sm'}`}
            >
              <Icon className={`w-5 h-5 mb-2 ${tab.color}`} />
              <p className="text-2xl font-bold text-gray-800">{tab.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{tab.label}</p>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h3>
          <p className="text-sm text-gray-500">{current.length} brokers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Broker</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Package</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Expiry Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {current.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No records in this category</td></tr>
              ) : current.map((r: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{r.user_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-600">{r.email}</p>
                    <p className="text-xs text-gray-400">{r.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{r.package_name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(r.expiry_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${r.days_remaining < 0 ? 'text-red-600' : r.days_remaining <= 7 ? 'text-orange-600' : r.days_remaining <= 15 ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {r.days_remaining < 0 ? `${Math.abs(r.days_remaining)}d ago` : `${r.days_remaining}d left`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <strong>Automatic Reminders:</strong> The system sends renewal reminders at 30, 15, 7, and 1 day before expiry via SMS, Email, and Dashboard Notification.
      </div>
    </div>
  );
};

export default RenewalMonitoring;
