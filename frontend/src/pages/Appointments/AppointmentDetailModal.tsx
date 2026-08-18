import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Calendar, Clock, User, Phone, MapPin, FileText, Home } from 'lucide-react';
import { Appointment as ApiAppointment, ClientOption, CreateAppointmentRequest, apiClient } from '../../services/api';
import { PropertyOption } from '../../types';

interface AppointmentDetailModalProps {
  appointment: ApiAppointment;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const CLIENT_TYPE_LABELS: Record<string, string> = {
  buyer:                  'Buyer',
  seller:                 'Seller',
  tenant:                 'Tenant',
  list_property_for_rent: 'Property Owner',
};

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onUpdate,
}) => {
  // Convert 24-hour time to 12-hour format with AM/PM
  const convertTo12Hour = (time24: string): { hours: string; minutes: string; period: 'AM' | 'PM' } => {
    if (!time24) return { hours: '', minutes: '', period: 'AM' };
    const [hours24, minutes] = time24.split(':');
    const h = parseInt(hours24, 10);
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    const hours12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hours: String(hours12).padStart(2, '0'), minutes: minutes || '00', period };
  };

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (hours: string, minutes: string, period: 'AM' | 'PM'): string => {
    let h = parseInt(hours, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minutes}`;
  };

  // Format time for display
  const formatTime12Hour = (time24: string): string => {
    const { hours, minutes, period } = convertTo12Hour(time24);
    return `${parseInt(hours)}:${minutes} ${period}`;
  };

  // Format date as DD/MM/YYYY
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const initialTime = convertTo12Hour(appointment.time);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<CreateAppointmentRequest & { id?: string }>({
    title: appointment.title,
    description: appointment.description || '',
    date: appointment.date,
    time: appointment.time,
    type: appointment.type,
    client_id: appointment.client_id,
    property_id: appointment.property_id,
  });
  const [timeData, setTimeData] = useState(initialTime);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    if (isOpen && isEditing) {
      loadClients();
      loadProperties();
    }
  }, [isOpen, isEditing]);

  useEffect(() => {
    setEditedData({
      title: appointment.title,
      description: appointment.description || '',
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      client_id: appointment.client_id,
      property_id: appointment.property_id,
    });
    setTimeData(convertTo12Hour(appointment.time));
  }, [appointment]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const response = await apiClient.getClientOptions();
      if (response.data) {
        setClients(response.data);
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const loadProperties = async () => {
    try {
      setLoadingProperties(true);
      const response = await apiClient.getPropertyOptions();
      if (response.data) {
        setProperties(response.data);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleTimeChange = (field: 'hours' | 'minutes' | 'period', value: string) => {
    const newTimeData = { ...timeData, [field]: value };
    setTimeData(newTimeData);
    
    // Update editedData.time with 24-hour format for backend
    if (newTimeData.hours && newTimeData.minutes) {
      const time24 = convertTo24Hour(newTimeData.hours, newTimeData.minutes, newTimeData.period);
      setEditedData({ ...editedData, time: time24 });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.updateAppointment(appointment.id, editedData);
      alert('Appointment updated successfully!');
      setIsEditing(false);
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Failed to update: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Appointment Details</h2>
            <p className="text-sm text-gray-600">{appointment.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditedData({
                      title: appointment.title,
                      description: appointment.description || '',
                      date: appointment.date,
                      time: appointment.time,
                      type: appointment.type,
                      client_id: appointment.client_id,
                      property_id: appointment.property_id,
                    });
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Appointment Type & Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Appointment Type & Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Type</label>
                {isEditing ? (
                  <select
                    value={editedData.type}
                    onChange={(e) => setEditedData({ ...editedData, type: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="site_visit">Site Visit</option>
                    <option value="meeting">Meeting</option>
                    <option value="call">Call</option>
                  </select>
                ) : (
                  <p className="text-gray-900 mt-1 capitalize">{appointment.type.replace('_', ' ')}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Status</label>
                <p className="text-gray-900 mt-1 capitalize">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {appointment.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Appointment Title */}
          <div>
            <label className="text-sm text-gray-600">Title</label>
            {isEditing ? (
              <input
                type="text"
                value={editedData.title}
                onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Appointment title"
                required
              />
            ) : (
              <p className="text-gray-900 mt-1">{appointment.title}</p>
            )}
          </div>

          {/* Date & Time */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Date</label>
                {isEditing ? (
                  <>
                    <input
                      type="date"
                      value={editedData.date}
                      onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                      min={formatLocalDate(new Date())}
                      className="w-full mt-1 px-3 py-2 border rounded-lg"
                      required
                    />
                    {editedData.date && (
                      <p className="text-xs text-gray-500 mt-1">Selected: {formatDisplayDate(editedData.date)}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{formatDisplayDate(appointment.date)}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-600">Time</label>
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <select
                      value={timeData.hours}
                      onChange={(e) => handleTimeChange('hours', e.target.value)}
                      className="px-2 py-2 border rounded-lg text-sm"
                      required
                    >
                      <option value="">HH</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={String(h).padStart(2, '0')}>
                          {String(h).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select
                      value={timeData.minutes}
                      onChange={(e) => handleTimeChange('minutes', e.target.value)}
                      className="px-2 py-2 border rounded-lg text-sm"
                      required
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <option key={m} value={String(m).padStart(2, '0')}>
                          {String(m).padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <select
                      value={timeData.period}
                      onChange={(e) => handleTimeChange('period', e.target.value)}
                      className="px-2 py-2 border rounded-lg text-sm"
                      required
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{formatTime12Hour(appointment.time)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Client Information</h3>
            {isEditing ? (
              <div>
                <label className="text-sm text-gray-600">Select Client *</label>
                {loadingClients ? (
                  <div className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 text-gray-500">
                    Loading clients...
                  </div>
                ) : (
                  <select
                    value={editedData.client_id}
                    onChange={(e) => setEditedData({ ...editedData, client_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} ({CLIENT_TYPE_LABELS[client.type] ?? client.type}) - {client.preferred_location}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{appointment.client_name || 'Unknown Client'}</span>
                </div>
                {appointment.client_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{appointment.client_phone}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Property Info */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Property (Optional)</h3>
            {isEditing ? (
              <div>
                <label className="text-sm text-gray-600">Select Property</label>
                {loadingProperties ? (
                  <div className="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 text-gray-500">
                    Loading properties...
                  </div>
                ) : (
                  <select
                    value={editedData.property_id || ''}
                    onChange={(e) => setEditedData({ ...editedData, property_id: e.target.value || undefined })}
                    className="w-full mt-1 px-3 py-2 border rounded-lg"
                  >
                    <option value="">-- No property linked --</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} — {property.location} ({property.type})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div>
                {appointment.property_address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-gray-900">{appointment.property_title || 'Property'}</p>
                      <p className="text-sm text-gray-600">{appointment.property_address}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No property linked</p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            {isEditing ? (
              <textarea
                value={editedData.description || ''}
                onChange={(e) => setEditedData({ ...editedData, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Add any additional details about the appointment..."
              />
            ) : (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-500 mt-1" />
                <p className="text-gray-700">{appointment.description || 'No additional details'}</p>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t">
            <Calendar className="w-4 h-4" />
            <span>Created on {new Date(appointment.created_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;
