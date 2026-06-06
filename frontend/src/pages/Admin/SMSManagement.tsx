import React, { useEffect, useState } from 'react';
import { getSMSStats } from '../../services/adminApi';
import { MessageSquare, TrendingUp, CheckCircle } from 'lucide-react';

const SMSManagement: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSMSStats().then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const usage = data?.broker_wise_usage ?? [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">SMS Management</h2>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Allocated', value: data?.total_purchased ?? 0, icon: MessageSquare, color: 'bg-blue-600' },
          { label: 'Total Used', value: data?.total_used ?? 0, icon: TrendingUp, color: 'bg-orange-600' },
          { label: 'Remaining Balance', value: data?.remaining ?? 0, icon: CheckCircle, color: 'bg-green-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800">{s.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Broker-wise usage */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Broker-wise SMS Usage</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Broker</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Allocated</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Used</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Remaining</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Usage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {usage.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No SMS data available</td></tr>
              ) : usage.map((b: any, i: number) => {
                const pct = b.allocated > 0 ? Math.round((b.used / b.allocated) * 100) : 0;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.broker_name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.allocated}</td>
                    <td className="px-4 py-3 text-gray-600">{b.used}</td>
                    <td className="px-4 py-3 text-gray-600">{b.remaining}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-10">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SMSManagement;
