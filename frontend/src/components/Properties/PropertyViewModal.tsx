import React from 'react';
import { CreditCard as Edit, Trash2, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Property } from '../../types';
import { getStatusColor, formatPrice } from './utils';

interface PropertyViewModalProps {
  property: Property;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (property: Property) => void;
}

const PropertyViewModal: React.FC<PropertyViewModalProps> = ({ property, onClose, onEdit, onDelete }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img
            src={property.images?.[0] || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'}
            alt={property.title}
            className="w-full h-64 object-cover rounded-t-2xl"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 rounded-full p-2 text-gray-700 hover:bg-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                  {property.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {property.address}
              </p>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatPrice(property.price, property.listing_type)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-500">Type</div>
              <div className="font-semibold text-gray-900 capitalize">{property.type}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-500">Listing</div>
              <div className="font-semibold text-gray-900 capitalize">{property.listing_type}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-500">Area</div>
              <div className="font-semibold text-gray-900">{property.area} sq ft</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-500">City</div>
              <div className="font-semibold text-gray-900">{property.city}</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-700">
            {property.bedrooms !== undefined && (
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-2" />
                {property.bedrooms} BHK
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-2" />
                {property.bathrooms} Bathrooms
              </div>
            )}
            <div className="flex items-center">
              <Square className="h-4 w-4 mr-2" />
              {property.area} sq ft
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-7">{property.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
            <div className="text-gray-700 space-y-1">
              <p>{property.location}</p>
              <p>{property.address}</p>
              <p>{property.city}, {property.state}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Linked Client</h3>
            <p className="text-gray-700">
              {property.client_name || 'No client linked to this property.'}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Amenities</h3>
            {property.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span key={amenity} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {amenity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No amenities added for this property yet.</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onClose();
                onEdit(property.id);
              }}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Property
            </button>
            <button
              onClick={() => onDelete(property)}
              className="bg-red-50 text-red-700 py-3 px-4 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyViewModal;
