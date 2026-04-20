import React from 'react';
import { Eye, CreditCard as Edit, Trash2, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Property } from '../../types';
import { getStatusColor, formatPrice } from './utils';

interface PropertyCardProps {
  property: Property;
  isBusy: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, isBusy, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={property.images?.[0] || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
            {property.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white px-2 py-1 text-xs font-medium rounded">
            {property.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{property.title}</h3>

        <div className="flex items-center text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{property.location}</span>
        </div>

        {property.client_name && (
          <div className="mb-3">
            <span className="inline-flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
              Client: {property.client_name}
            </span>
          </div>
        )}

        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          {property.bedrooms !== undefined && (
            <div className="flex items-center">
              <Bed className="h-4 w-4 mr-1" />
              <span>{property.bedrooms} BHK</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center">
              <Bath className="h-4 w-4 mr-1" />
              <span>{property.bathrooms} Bath</span>
            </div>
          )}
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1" />
            <span>{property.area} sq ft</span>
          </div>
        </div>

        <div className="mb-4 text-2xl font-bold text-gray-900">
          {formatPrice(property.price, property.listing_type)}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onView(property.id)}
            disabled={isBusy}
            className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center disabled:opacity-60"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isBusy ? 'Opening...' : 'View'}
          </button>
          <button
            onClick={() => onEdit(property.id)}
            disabled={isBusy}
            className="flex-1 bg-gray-50 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center disabled:opacity-60"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => onDelete(property)}
            className="bg-red-50 text-red-700 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
