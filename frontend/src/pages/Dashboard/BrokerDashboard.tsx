import React from 'react';
import { 
  Building, 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import StatsCard from './StatsCard';
import { DashboardStats } from '../../types';

interface BrokerDashboardProps {
  stats: DashboardStats;
}

const BrokerDashboard: React.FC<BrokerDashboardProps> = ({ stats }) => {
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
      action: 'WhatsApp campaign sent',
      details: '150 messages delivered',
      time: '6 hours ago',
      type: 'whatsapp'
    },
    {
      id: '4',
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
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-teal-500" />;
      case 'client':
        return <Users className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg sm:rounded-xl text-white p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, Broker!</h1>
        <p className="text-sm sm:text-base text-blue-100">Manage your properties, clients, and grow your real estate business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Total Properties"
          value={stats.totalProperties}
          icon={Building}
          color="blue"
          subtitle="Active listings"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          color="green"
          subtitle="All client types"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Appointments Today"
          value={stats.totalAppointments}
          icon={Calendar}
          color="orange"
          subtitle="Scheduled meetings"
        />
        <StatsCard
          title="WhatsApp Messages"
          value={`${stats.whatsappMessagesCount}/${stats.remainingMessages}`}
          icon={MessageSquare}
          color="teal"
          subtitle="Sent/Remaining"
        />
      </div>

      {/* Client Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Clients by Type</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                <span className="text-sm sm:text-base text-gray-700">Buyers</span>
              </div>
              <span className="text-sm sm:text-base font-semibold text-gray-900">{stats.clientsByType.buyers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Sellers</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.clientsByType.sellers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Tenants</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.clientsByType.tenants}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Owners</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.clientsByType.owners}</span>
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
              <span className="font-semibold text-gray-900">{stats.propertiesByStatus.available}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Sold</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.propertiesByStatus.sold}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Rented</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.propertiesByStatus.rented}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Under Negotiation</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.propertiesByStatus.under_negotiation}</span>
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
    </div>
  );
};

export default BrokerDashboard;