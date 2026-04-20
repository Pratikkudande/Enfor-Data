import React from 'react';
import { Calendar, User, Phone, MapPin, Eye, CreditCard as Edit, Trash2 } from 'lucide-react';
import { Appointment as ApiAppointment } from '../../../services/api';

interface AppointmentCardProps {
  appointment: ApiAppointment;
  getStatusColor: (status: string) => string;
  getTypeColor: (type: string) => string;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, getStatusColor, getTypeColor }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{appointment.title}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(appointment.type)}`}>
              {appointment.type.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
              {appointment.status.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 mb-3">{appointment.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{appointment.date} at {appointment.time}</span>
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>{appointment.client_name || 'Client'}</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              <span>{appointment.client_phone || 'N/A'}</span>
            </div>
          </div>
          
          {appointment.property_address && (
            <div className="flex items-center text-sm text-gray-600 mt-2">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{appointment.property_address}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2">
        <button className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center">
          <Eye className="h-4 w-4 mr-2" />
          View
        </button>
        <button className="flex-1 bg-gray-50 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </button>
        <button className="bg-red-50 text-red-700 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AppointmentCard;
