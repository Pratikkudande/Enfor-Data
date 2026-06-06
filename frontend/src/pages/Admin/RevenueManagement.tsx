import React, { useEffect, useState } from 'react';
import { getRevenue } from '../../services/adminApi';
import { DollarSign, TrendingUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const StatCard: React.FC<{ label: string; value: string; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
  </div>
);

const RevenueManagement: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getRevenue({ page, limit: 20 })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const stats = data?.stats;
  const subscriptions = data?.subscriptions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Revenue & Subscription Management</h2>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={`₹${(stats?.total_revenue ?? 0).toLocaleString()}`} icon={DollarSign} color="bg-green-600" />
        <StatCard label="Monthly Revenue" value={`₹${(stats?.monthly_revenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="bg-blue-600" />
        <StatCard label="Yearly Revenue" value={`₹${(stats?.yearly_revenue ?? 0).toLocaleString()}`} icon={TrendingUp} color="bg-purple-600" />
        <StatCard label="Renewals Due (30d)" value={String(stats?.renewals_due_30_days ?? 0)} icon={Calendar} color="bg-orange-600" />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-800">Pending Renewal Value (30 Days)</p>
        <p className="text-3xl font-bold text-blue-700 mt-1">₹{(stats?.pending_renewal_value ?? 0).toLocaleString()}</p>
      </div>

      {/* Subscription Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Subscription Transactions</h3>
          <p className="text-sm text-gray-500">{total} total records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Broker</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Package</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Payment Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Renewal Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No transactions found</td></tr>
              ) : subscriptions.map((s: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{s.user_name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{s.package_name}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">₹{s.amount_paid?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.payment_date ? new Date(s.payment_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.renewal_date ? new Date(s.renewal_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono">{s.transaction_id?.slice(0, 20)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueManagement;
