import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import StatsCard from '../Dashboard/StatsCard';
import { apiClient, Appointment as ApiAppointment, CreateAppointmentRequest, Client } from '../../services/api';
import AppointmentCard from './AppointmentCard';
import AppointmentForm from './AppointmentForm';
import AppointmentCalendar from './AppointmentCalendar';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const AppointmentsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Real appointments state
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    window.setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Clients state for dropdown
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAppointments();
      if (response.data) {
        setAppointments(response.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const response = await apiClient.getClients();
      if (response.data) {
        setClients(response.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const appointmentStats = {
    totalThisMonth: appointments.length,
    todayAppointments: appointments.filter(apt => apt.date === today).length,
    scheduledAppointments: appointments.filter(apt => apt.status === 'scheduled').length,
    completedAppointments: appointments.filter(apt => apt.status === 'completed').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'site_visit': return 'bg-purple-100 text-purple-800';
      case 'meeting': return 'bg-orange-100 text-orange-800';
      case 'call': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filterAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    return appointments.filter(appointment => {
      const matchesSearch = appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.client_name && appointment.client_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;

      let matchesDate = true;
      if (filterDate === 'today') matchesDate = appointment.date === today;
      else if (filterDate === 'yesterday') matchesDate = appointment.date === yesterday;
      else if (filterDate === 'tomorrow') matchesDate = appointment.date === tomorrow;

      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const handleFormSubmit = async (appointmentData: CreateAppointmentRequest) => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      const response = await apiClient.createAppointment(appointmentData);

      if (response.data) {
        setAppointments(prev => [response.data!, ...prev]);
        showSuccess('Appointment added successfully!');
        setShowAddModal(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create appointment';
      setSubmitError(msg);
      console.error('Error creating appointment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total This Month" value={appointmentStats.totalThisMonth} icon={Calendar} color="blue" subtitle="All appointments" />
        <StatsCard title="Today's Appointments" value={appointmentStats.todayAppointments} icon={Clock} color="orange" subtitle="Scheduled for today" />
        <StatsCard title="Scheduled" value={appointmentStats.scheduledAppointments} icon={AlertCircle} color="purple" subtitle="Upcoming appointments" />
        <StatsCard title="Completed" value={appointmentStats.completedAppointments} icon={CheckCircle} color="green" subtitle="This month" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
        <div className="space-y-4">
          {appointments.slice(0, 5).map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">{getStatusIcon(appointment.status)}</div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{appointment.title}</h4>
                  <p className="text-xs text-gray-600">with {appointment.client_name || 'Client'}</p>
                  <p className="text-xs text-gray-500">{appointment.date} at {appointment.time}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(appointment.type)}`}>
                  {appointment.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                  {appointment.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-6">
      {loading && <LoadingState message="Loading appointments..." />}

      {error && !loading && <ErrorState message={error} onRetry={fetchAppointments} />}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search appointments or clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-4">
            <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="tomorrow">Tomorrow</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filterAppointments().map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            getStatusColor={getStatusColor}
            getTypeColor={getTypeColor}
          />
        ))}
      </div>

      {filterAppointments().length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Add Appointment</button>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'list', label: 'List View', icon: Clock },
    { id: 'calendar', label: 'Calendar', icon: Calendar }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your client appointments and schedule</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Appointment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'list' && renderListView()}
          {activeTab === 'calendar' && (
            <AppointmentCalendar
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              appointments={appointments}
              getStatusColor={getStatusColor}
            />
          )}
        </div>
      </div>

      {showAddModal && (
        <AppointmentForm
          clients={clients}
          loadingClients={loadingClients}
          submitting={submitting}
          submitError={submitError}
          onSubmit={handleFormSubmit}
          onCancel={() => { setShowAddModal(false); setSubmitError(null); }}
        />
      )}

      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AppointmentsView;