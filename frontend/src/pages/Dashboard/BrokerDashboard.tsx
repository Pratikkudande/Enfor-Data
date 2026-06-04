import React, { useEffect, useState } from 'react';
import { 
  Building, 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from './StatsCard';
import NotificationDemo from '../../components/demo/NotificationDemo';
import ChannelPartnerDashboard from './ChannelPartnerDashboard';
import { DashboardStats } from '../../types';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../routes/routePaths';

interface BrokerDashboardProps {
  stats?: DashboardStats;
}

const BrokerDashboard: React.FC<BrokerDashboardProps> = ({ stats: initialStats }) => {
  const navigate = useNavigate();
  const { dashboardStats: ctxStats, user } = useAuth();

  // Render channel partner dashboard for that role
  if (user?.role === 'channel_partner') {
    return <ChannelPartnerDashboard />;
  }
  const [stats, setStats] = useState<DashboardStats | undefined>(initialStats);
  const [loading, setLoading] = useState<boolean>(!initialStats && !ctxStats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If parent passed stats or AuthContext has prefetched stats, use them and skip loading
    if (initialStats || ctxStats) {
      if (ctxStats && !initialStats) setStats(ctxStats);
      return;
    }

    let mounted = true;

    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [propertiesRes, clientsRes, apptStatsRes] = await Promise.all([
          // all properties (global) to compute active properties
          // returns { data: Property[] }
          apiClient.request('/properties/all'),
          // clients for current user
          apiClient.request('/clients'),
          // appointment stats for current user
          apiClient.request('/appointments/stats')
        ]);

        const propertiesData = propertiesRes?.data ?? propertiesRes;
        const clientsData = clientsRes?.data ?? clientsRes;
        const apptStatsData = apptStatsRes?.data ?? apptStatsRes;

        if (!mounted) return;

        const propertiesArray = Array.isArray(propertiesData) ? propertiesData : [];
        const availableCount = propertiesArray.filter((p: any) => p.status === 'available').length;
        const soldCount = propertiesArray.filter((p: any) => p.status === 'sold').length;
        const rentedCount = propertiesArray.filter((p: any) => p.status === 'rented').length;
        const holdCount = propertiesArray.filter((p: any) => p.status === 'hold').length;
        const closedCount = propertiesArray.filter((p: any) => p.status === 'closed').length;
        const underDiscussionCount = propertiesArray.filter((p: any) => p.status === 'under_discussion' || p.status === 'under_negotiation').length;

        const userClientsCount = Array.isArray(clientsData) ? clientsData.length : 0;

        const todaysAppointments = apptStatsData?.today ?? apptStatsData?.data?.today ?? 0;

        // Construct a DashboardStats-compatible object (fill required fields conservatively)
        const derived: DashboardStats = {
          totalProperties: propertiesArray.length,
          activeProperties: availableCount,
          totalClients: Array.isArray(clientsData) ? clientsData.length : 0,
          userClientsCount,
          totalAppointments: apptStatsData?.total ?? 0,
          todaysAppointments,
          whatsappMessagesCount: 0,
          remainingMessages: 0,
          clientsByType: {
            buyers: 0,
            sellers: 0,
            tenants: 0,
            owners: 0,
          },
          propertiesByStatus: {
            available: availableCount,
            sold: soldCount,
            rented: rentedCount,
            hold: holdCount,
            closed: closedCount,
            under_discussion: underDiscussionCount,
          },
        };

        setStats(derived);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    return () => {
      mounted = false;
    };
  }, [initialStats]);

  const upcomingAppointments = [
    {
      id: '1',
      title: 'Site Visit - Mumbai Central',
      client: 'John Doe',
      time: '10:00 AM',
      type: 'site_visit',
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Client Meeting - Investment Discussion',
      client: 'Sarah Wilson',
      time: '2:30 PM',
      type: 'meeting',
      status: 'pending'
    },
    {
      id: '3',
      title: 'Property Viewing - 2BHK Apartment',
      client: 'Mike Johnson',
      time: '4:00 PM',
      type: 'site_visit',
      status: 'confirmed'
    }
  ];

  const recentActivity = [
    {
      id: '1',
      action: 'New property inquiry received',
      client: 'Emma Davis',
      time: '2 hours ago',
      type: 'inquiry'
    },
    {
      id: '2',
      action: 'Appointment scheduled',
      client: 'Robert Brown',
      time: '4 hours ago',
      type: 'appointment'
    },
    {
      id: '3',
      action: 'New client added',
      client: 'Lisa Anderson',
      time: '8 hours ago',
      type: 'client'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <Building className="h-4 w-4 text-blue-500" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'client':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div
        className="rounded-lg sm:rounded-xl text-white p-4 sm:p-6"
        style={{ background: 'linear-gradient(135deg, #0f1f5c 0%, #1a2f7a 50%, #2d1b8a 100%)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 32px rgba(59,130,246,0.18)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, Broker!</h1>
            <p className="text-sm sm:text-base" style={{ color: '#93C5FD' }}>Manage your properties, clients, and grow your real estate business</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`${ROUTES.CLIENTS}?openAdd=1`)}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white transition-colors text-sm font-medium hover:opacity-90"
              style={{ color: '#4F46E5' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </button>
            <button
              onClick={() => navigate(`${ROUTES.PROPERTIES}?openAdd=1`)}
              className="inline-flex items-center px-4 py-2 rounded-lg text-white transition-colors text-sm font-medium"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatsCard
          title="Active Properties"
          value={stats?.activeProperties ?? stats?.totalProperties ?? 0}
          icon={Building}
          color="blue"
          subtitle="Active listings (all brokers)"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Your Clients"
          value={stats?.userClientsCount ?? stats?.totalClients ?? 0}
          icon={Users}
          color="green"
          subtitle="Clients added by you"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Appointments Today"
          value={stats?.todaysAppointments ?? stats?.totalAppointments ?? 0}
          icon={Calendar}
          color="orange"
          subtitle="Scheduled meetings"
        />
      </div>

      {/* Client Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Clients by Type</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}></div>
                <span className="text-sm sm:text-base text-gray-700">Buyers</span>
              </div>
              <span className="text-sm sm:text-base font-semibold text-gray-900">{stats?.clientsByType?.buyers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Sellers</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.clientsByType?.sellers ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Tenants</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.clientsByType?.tenants ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Owners</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.clientsByType?.owners ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Properties by Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Available</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.propertiesByStatus?.available ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Sold</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.propertiesByStatus?.sold ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-3" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}></div>
                <span className="text-gray-700">Rented</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.propertiesByStatus?.rented ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Hold</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.propertiesByStatus?.hold ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Closed</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.propertiesByStatus?.closed ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Under Discussion</span>
              </div>
              <span className="font-semibold text-gray-900">{stats?.propertiesByStatus?.under_discussion ?? stats?.propertiesByStatus?.under_negotiation ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Today's Appointments</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{appointment.title}</h4>
                  <p className="text-xs text-gray-600">with {appointment.client}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{appointment.time}</span>
                  {getStatusIcon(appointment.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  {activity.client && (
                    <p className="text-xs text-gray-600">Client: {activity.client}</p>
                  )}
                  {activity.details && (
                    <p className="text-xs text-gray-600">{activity.details}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Demo Section */}
      <NotificationDemo />
    </div>
  );
};

export default BrokerDashboard;