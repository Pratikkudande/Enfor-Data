import React from 'react';
import { Eye, CreditCard as Edit, Trash2, MapPin, Bed, Bath, Square, Phone, Mail, User, Building } from 'lucide-react';
import { Property } from '../../types';
import { getStatusColor, formatPrice } from './utils';

interface PropertyCardProps {
  property: Property;
  currentUserId: string;
  isBusy: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (property: Property) => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, currentUserId, isBusy, onView, onEdit, onDelete }) => {
  const isOwner = property.broker_id === currentUserId;

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
      isOwner ? 'border-blue-100' : 'border-gray-100'
    }`}>
      {/* Image */}
      <div className="relative">
        <img
          src={property.images?.[0] || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'}
          alt={property.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
            {property.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-blue-600 text-white px-2 py-1 text-xs font-medium rounded">
            {property.listing_type === 'rent' ? 'FOR RENT' : 'FOR SALE'}
          </span>
          {isOwner ? (
            <span className="bg-green-600 text-white px-2 py-1 text-xs font-medium rounded">YOURS</span>
          ) : (
            <span className="bg-gray-700 text-white px-2 py-1 text-xs font-medium rounded flex items-center gap-1">
              <Building className="h-3 w-3" /> OTHER
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">{property.title}</h3>

        <div className="flex items-center text-gray-500 mb-3 text-sm">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="truncate">{property.location}, {property.city}</span>
        </div>

        {/* Specs */}
        <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
          {property.bedrooms !== undefined && (
            <div className="flex items-center"><Bed className="h-3.5 w-3.5 mr-1" />{property.bedrooms} BHK</div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center"><Bath className="h-3.5 w-3.5 mr-1" />{property.bathrooms} Bath</div>
          )}
          <div className="flex items-center"><Square className="h-3.5 w-3.5 mr-1" />{property.area} sq ft</div>
        </div>

        {/* Price */}
        <div className="text-xl font-bold text-gray-900 mb-3">
          {formatPrice(property.price, property.listing_type)}
        </div>

        {/* ── Contact Info Section ── */}
        {isOwner ? (
          /* Owner: show linked client contact */
          property.client_name ? (
            <div className="bg-indigo-50 rounded-lg p-3 mb-3 space-y-1">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Linked Client</p>
              <div className="flex items-center gap-2 text-sm text-indigo-800">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">{property.client_name}</span>
              </div>
              {property.client_phone && (
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <a href={`tel:${property.client_phone}`} className="hover:underline">{property.client_phone}</a>
                </div>
              )}
              {property.client_email && (
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <a href={`mailto:${property.client_email}`} className="hover:underline truncate">{property.client_email}</a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-xs text-gray-400 italic">No client linked</p>
            </div>
          )
        ) : (
          /* Other broker's property: show broker contact */
          <div className="bg-amber-50 rounded-lg p-3 mb-3 space-y-1">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Listed By</p>
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="font-medium">{property.broker_name || 'Broker'}</span>
              {property.broker_city && <span className="text-amber-600 text-xs">· {property.broker_city}</span>}
            </div>
            {property.broker_whatsapp && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                <a href={`tel:${property.broker_whatsapp}`} className="hover:underline">{property.broker_whatsapp}</a>
              </div>
            )}
            {property.broker_email && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <a href={`mailto:${property.broker_email}`} className="hover:underline truncate">{property.broker_email}</a>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(property.id)}
            disabled={isBusy}
            className="flex-1 bg-blue-50 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center text-sm disabled:opacity-60"
          >
            <Eye className="h-4 w-4 mr-1.5" />
            {isBusy ? 'Opening...' : 'View'}
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => onEdit(property.id)}
                disabled={isBusy}
                className="flex-1 bg-gray-50 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-sm disabled:opacity-60"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </button>
              <button
                onClick={() => onDelete(property)}
                className="bg-red-50 text-red-700 py-2 px-3 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
