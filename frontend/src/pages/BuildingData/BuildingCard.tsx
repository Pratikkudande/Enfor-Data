import React from 'react';
import { Eye, Edit2, Trash2, Phone, MapPin, Building2, Calendar, User } from 'lucide-react';
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
        <div className="flex items-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-orange-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900">
              {contact.building_name || <span className="text-gray-400 italic">No Building Name</span>}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {contact.id.slice(0, 8)}…</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {contact.owner_name && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
            <span>{contact.owner_name}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
          <span className="font-medium">{contact.mobile_number}</span>
        </div>
        {contact.area && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
            <span>{contact.area}</span>
          </div>
        )}
        {contact.notes && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{contact.notes}</p>
        )}
      </div>

      <div className="flex items-center text-xs text-gray-400 mb-4">
        <Calendar className="h-3 w-3 mr-1" />
        <span>Added {new Date(contact.created_at).toLocaleDateString()}</span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onView(contact)}
          className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
        >
          <Eye className="h-4 w-4 mr-1.5" /> View
        </button>
        <button
          onClick={() => onEdit(contact)}
          className="flex-1 bg-gray-50 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm"
        >
          <Edit2 className="h-4 w-4 mr-1.5" /> Edit
        </button>
        <button
          onClick={() => onDelete(contact)}
          disabled={isDeleting}
          className="bg-red-50 text-red-700 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default BuildingCard;
