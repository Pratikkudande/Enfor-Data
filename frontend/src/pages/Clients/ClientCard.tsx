import React from 'react';
import { Eye, Trash2, MapPin, Phone, Mail, User, Home, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/routePaths';

interface Client {
  id: string;
  name: string;
  type: string;
  types?: string[]; // Multiple types support
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
  onDelete,
  isDeleting
}) => {
  const navigate = useNavigate();
  
  // Display multiple types if available
  const clientTypes = client.types && client.types.length > 0 ? client.types : [client.type];
  
  const handleAddProperty = () => {
    // Navigate to properties page with client info to pre-fill
    navigate(ROUTES.PROPERTIES, { 
      state: { 
        openAdd: true,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone
      } 
    });
  };

  const handleAddRequirement = () => {
    // Navigate to client requirements page with client info to pre-fill
    navigate(ROUTES.CLIENT_REQUIREMENTS, { 
      state: { 
        openAdd: true,
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone
      } 
    });
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              {clientTypes.map((type, idx) => (
                <span key={idx} className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(type)}`}>
                  {getTypeLabel(type)}
                </span>
              ))}
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                {client.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => onView(client)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
            title="View details"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(client)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
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
          {client.budget_min || client.budget_max ? (
            <>
              <p className="text-sm font-medium text-gray-900">Budget</p>
              <p className="text-sm text-gray-600">{formatBudget(client.budget_min, client.budget_max)}</p>
            </>
          ) : null}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleAddProperty}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
        >
          <Home className="h-4 w-4" />
          Add Property
        </button>
        <button
          onClick={handleAddRequirement}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
        >
          <ClipboardList className="h-4 w-4" />
          Add Requirement
        </button>
      </div>
    </div>
  );
};

export default ClientCard;
