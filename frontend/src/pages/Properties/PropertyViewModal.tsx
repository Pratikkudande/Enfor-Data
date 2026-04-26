import React from 'react';
import { CreditCard as Edit, Trash2, MapPin, Bed, Bath, Square, Phone, Mail, User, Building } from 'lucide-react';
import { Property } from '../../types';
import { getStatusColor, formatPrice } from './utils';

interface PropertyViewModalProps {
  property: Property;
  currentUserId: string;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (property: Property) => void;
}

const PropertyViewModal: React.FC<PropertyViewModalProps> = ({ property, currentUserId, onClose, onEdit, onDelete }) => {
  const isOwner = property.broker_id === currentUserId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

        {/* Hero image */}
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
          {/* Ownership badge */}
          <div className="absolute top-4 left-4">
            {isOwner ? (
              <span className="bg-green-600 text-white px-3 py-1 text-xs font-semibold rounded-full">Your Property</span>
            ) : (
              <span className="bg-gray-700 text-white px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                <Building className="h-3 w-3" /> Other Broker
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Title + price */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">{property.title}</h2>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
                  {property.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />{property.address}
              </p>
            </div>
            <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">
              {formatPrice(property.price, property.listing_type)}
            </div>
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Type', value: property.type },
              { label: 'Listing', value: property.listing_type },
              { label: 'Area', value: `${property.area} sq ft` },
              { label: 'City', value: property.city },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                <div className="font-semibold text-gray-900 capitalize">{s.value}</div>
              </div>
            ))}
          </div>

          {/* BHK / Bath */}
          {(property.bedrooms !== undefined || property.bathrooms !== undefined) && (
            <div className="flex items-center gap-6 text-sm text-gray-700">
              {property.bedrooms !== undefined && (
                <div className="flex items-center"><Bed className="h-4 w-4 mr-2" />{property.bedrooms} BHK</div>
              )}
              {property.bathrooms !== undefined && (
                <div className="flex items-center"><Bath className="h-4 w-4 mr-2" />{property.bathrooms} Bathrooms</div>
              )}
              <div className="flex items-center"><Square className="h-4 w-4 mr-2" />{property.area} sq ft</div>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-7">{property.description}</p>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Location</h3>
            <div className="text-gray-700 space-y-0.5">
              <p>{property.location}</p>
              <p>{property.address}</p>
              <p>{property.city}, {property.state}</p>
            </div>
          </div>

          {/* ── Contact Info ── */}
          {isOwner ? (
            /* Owner view: show linked client details */
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Linked Client</h3>
              {property.client_name ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-800">
                    <User className="h-4 w-4" />
                    <span className="font-semibold">{property.client_name}</span>
                  </div>
                  {property.client_phone && (
                    <div className="flex items-center gap-2 text-indigo-700 text-sm">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${property.client_phone}`} className="hover:underline">{property.client_phone}</a>
                    </div>
                  )}
                  {property.client_email && (
                    <div className="flex items-center gap-2 text-indigo-700 text-sm">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${property.client_email}`} className="hover:underline">{property.client_email}</a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No client linked to this property.</p>
              )}
            </div>
          ) : (
            /* Other broker's property: show broker contact */
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Listed By</h3>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{property.broker_name || 'Broker'}</span>
                  {property.broker_city && (
                    <span className="text-amber-600 text-sm">· {property.broker_city}</span>
                  )}
                </div>
                {property.broker_whatsapp && (
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${property.broker_whatsapp}`} className="hover:underline">{property.broker_whatsapp}</a>
                  </div>
                )}
                {property.broker_email && (
                  <div className="flex items-center gap-2 text-amber-700 text-sm">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${property.broker_email}`} className="hover:underline">{property.broker_email}</a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Amenities</h3>
            {property.amenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span key={amenity} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {amenity}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No amenities listed.</p>
            )}
          </div>

          {/* Action buttons — only owner gets edit/delete */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {isOwner ? (
              <>
                <button
                  onClick={() => { onClose(); onEdit(property.id); }}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <Edit className="h-4 w-4 mr-2" />Edit Property
                </button>
                <button
                  onClick={() => onDelete(property)}
                  className="bg-red-50 text-red-700 py-3 px-4 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex-1 bg-gray-50 text-gray-500 py-3 px-4 rounded-lg text-center text-sm">
                Read-only — contact the listing broker to enquire
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyViewModal;
