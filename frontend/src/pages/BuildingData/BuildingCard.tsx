import React from 'react';
import { Eye, Trash2, Phone, MapPin, Building2, FileText } from 'lucide-react';
import { BuildingContact } from '../../services/buildingApi';

interface BuildingCardProps {
  contact: BuildingContact;
  onView: (contact: BuildingContact) => void;
  onEdit: (contact: BuildingContact) => void;
  onDelete: (contact: BuildingContact) => void;
  isDeleting: boolean;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ contact, onView, onEdit, onDelete, isDeleting }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {contact.building_name || <span className="text-gray-400 italic">No Building Name</span>}
            </h3>
            {contact.owner_name && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{contact.owner_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-2">
          <button
            onClick={() => onView(contact)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
            title="View details"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(contact)}
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
          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="font-medium">{contact.mobile_number}</span>
        </div>
        {contact.area && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{contact.area}</span>
          </div>
        )}
        {contact.notes && (
          <div className="flex items-start text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <p className="line-clamp-2 flex-1">{contact.notes}</p>
          </div>
        )}
      </div>


    </div>
  );
};

export default BuildingCard;
