import React from 'react';
import { Eye, CreditCard as Edit, Trash2, MapPin, Phone, Mail, User, Calendar } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  preferred_location: string;
  requirements: string;
  created_at: string;
  budget_min?: number;
  budget_max?: number;
  expected_amount?: number;
  first_name?: string;
  last_name?: string;
}

interface ClientCardProps {
  client: Client;
  getTypeColor: (type: string) => string;
  getTypeLabel: (type: string) => string;
  getStatusColor: (status: string) => string;
  formatBudget: (min?: number, max?: number) => string;
  onView: (client: any) => void;
  onEdit: (client: any) => void;
  onDelete: (client: any) => void;
  isDeleting: boolean;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  getTypeColor,
  getTypeLabel,
  getStatusColor,
  formatBudget,
  onView,
  onEdit,
  onDelete,
  isDeleting
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {client.id}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(client.type)}`}>
                {getTypeLabel(client.type)}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                {client.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2" />
          <span>{client.phone}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2" />
          <span>{client.email}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{client.preferred_location}</span>
        </div>
      </div>

      {(client.expected_amount || client.budget_min || client.budget_max) && (
        <div className="mb-4">
          {client.expected_amount ? (
            <>
              <p className="text-sm font-medium text-gray-900">Expected Amount</p>
              <p className="text-sm text-gray-600">{formatBudget(client.expected_amount, client.expected_amount)}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">Budget</p>
              <p className="text-sm text-gray-600">{formatBudget(client.budget_min, client.budget_max)}</p>
            </>
          )}
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-900">Requirements</p>
        <p className="text-sm text-gray-600">{client.requirements}</p>
      </div>

      <div className="flex items-center text-xs text-gray-500 mb-4">
        <Calendar className="h-3 w-3 mr-1" />
        <span>Added {new Date(client.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onView(client)}
          className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </button>
        <button
          onClick={() => onEdit(client)}
          className="flex-1 bg-gray-50 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </button>
        <button
          onClick={() => onDelete(client)}
          disabled={isDeleting}
          className="bg-red-50 text-red-700 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ClientCard;
