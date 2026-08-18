import React from 'react';
import { Calendar, Clock, Phone, MapPin, Eye, Trash2 } from 'lucide-react';
import { Appointment as ApiAppointment } from '../../services/api';

interface AppointmentCardProps {
  appointment: ApiAppointment;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
  onView: (appointment: ApiAppointment) => void;
  onDelete: (appointment: ApiAppointment) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  getStatusColor,
  getTypeColor,
  onView,
  onDelete,
}) => {
  // Convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours24, minutes] = time24.split(':');
    const h = parseInt(hours24, 10);
    const period = h >= 12 ? 'PM' : 'AM';
    const hours12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hours12}:${minutes} ${period}`;
  };

  // Format date as DD/MM/YYYY
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
          <p className="text-sm text-gray-600">{appointment.client_name || 'Client'}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(appointment)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
            title="View details"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(appointment)}
            className="text-red-600 hover:text-red-700 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(appointment.type)}`}>
          {appointment.type.replace('_', ' ')}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      {/* Date & Time */}
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
        <Calendar className="w-4 h-4" />
        <span>{formatDisplayDate(appointment.date)} at {formatTime12Hour(appointment.time)}</span>
      </div>

      {/* Phone */}
      {appointment.client_phone && (
        <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
          <Phone className="w-4 h-4" />
          <span>{appointment.client_phone}</span>
        </div>
      )}

      {/* Location */}
      {appointment.property_address && (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{appointment.property_address}</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        Added {new Date(appointment.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default AppointmentCard;
