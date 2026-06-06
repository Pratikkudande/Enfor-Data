import React, { useEffect, useState } from 'react';
import { getDashboard } from '../../services/adminApi';
import {
  Users, DollarSign, UserPlus, Building, MessageSquare,
  RefreshCw, MessageCircle, Network, TrendingUp, TrendingDown,
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon: Icon, color, bgColor }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 border border-gray-100">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// Simple inline bar chart using SVG
const BarChart: React.FC<{ data: { label: string; value: number }[]; color: string; title: string }> = ({ data, color, title }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div>
      <p className="text-sm font-medium text-gray-600 mb-3">{title}</p>
      <div className="flex items-end gap-2 h-28">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1 gap-1">
            <span className="text-xs text-gray-500">{d.value}</span>
            <div
              className={`w-full rounded-t ${color} transition-all`}
              style={{ height: `${Math.max((d.value / max) * 80, 4)}px` }}
            />
            <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(res => {
        setStats(res.data?.stats);
        setAnalytics(res.data?.analytics);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  const kpis = [
    { title: 'Active Users', value: stats?.active_users ?? 0, icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Total Revenue', value: `₹${(stats?.total_revenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'New Registrations', value: stats?.new_registrations ?? 0, icon: UserPlus, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { title: 'Properties Added', value: stats?.properties_added ?? 0, icon: Building, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    { title: 'SMS Usage', value: stats?.sms_usage ?? 0, icon: MessageSquare, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    { title: 'Renewals Due', value: stats?.renewals_due ?? 0, icon: RefreshCw, color: 'text-red-600', bgColor: 'bg-red-100' },
    { title: 'Feedback Count', value: stats?.feedback_count ?? 0, icon: MessageCircle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { title: 'Broker Network Growth', value: stats?.broker_network_growth ?? 0, icon: Network, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Platform Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Real-time metrics across all broker accounts</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <KPICard key={i} {...kpi} />
        ))}
      </div>

      {/* Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <BarChart
              title="User Registrations (Last 6 Months)"
              data={analytics.registration_trend ?? []}
              color="bg-blue-500"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <BarChart
              title="Revenue Trend (₹)"
              data={analytics.revenue_trend ?? []}
              color="bg-green-500"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <BarChart
              title="Properties Added"
              data={analytics.property_trend ?? []}
              color="bg-orange-500"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <BarChart
              title="SMS Usage Trend"
              data={analytics.sms_trend ?? []}
              color="bg-cyan-500"
            />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <BarChart
              title="Renewal Trends"
              data={analytics.renewal_trend ?? []}
              color="bg-red-500"
            />
          </div>
        </div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Platform Health</span>
          </div>
          <p className="text-3xl font-bold">{stats?.active_users ?? 0}</p>
          <p className="text-blue-200 text-sm mt-1">Active brokers right now</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm font-medium">Revenue This Month</span>
          </div>
          <p className="text-3xl font-bold">₹{(stats?.total_revenue ?? 0).toLocaleString()}</p>
          <p className="text-green-200 text-sm mt-1">Total platform revenue</p>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">Needs Attention</span>
          </div>
          <p className="text-3xl font-bold">{(stats?.renewals_due ?? 0) + (stats?.feedback_count ?? 0)}</p>
          <p className="text-red-200 text-sm mt-1">Renewals + new feedback</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
