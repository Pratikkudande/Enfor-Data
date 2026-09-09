import React from 'react';
import { Home, MapPin, Bed, Bath, Square, ExternalLink } from 'lucide-react';
import { getPropertyImageUrl } from '../../../Properties/PropertyCard';
import ImageErrorBoundary from '../../../../components/ImageErrorBoundary';

interface PropertyReferenceCardProps {
  property: any;
  displayText?: string;
  onClick: () => void;
  isContext?: boolean;
}

export const PropertyReferenceCard: React.FC<PropertyReferenceCardProps> = ({
  property,
  displayText,
  onClick,
  isContext = false,
}) => {
  if (isContext) {
    return (
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
          <ImageErrorBoundary>
            <img 
              src={getPropertyImageUrl(property)} 
              alt={property.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg';
              }}
            />
          </ImageErrorBoundary>
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Property Reference</p>
          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{property.title}</h4>
          <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{property.location}</span>
          </p>
          <p className="text-sm font-bold text-blue-700 mt-1">₹{property.price.toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 hover:shadow-lg transition-all duration-200 hover:border-blue-400 text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
          <ImageErrorBoundary>
            <img 
              src={getPropertyImageUrl(property)} 
              alt={property.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg';
              }}
            />
          </ImageErrorBoundary>
        </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <Home className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-blue-900 uppercase">Property</p>
            <ExternalLink className="h-3.5 w-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {property.title}
          </h4>
          <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{property.location}</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            {property.bedrooms !== undefined && (
              <div className="flex items-center gap-0.5">
                <Bed className="h-3 w-3" />
                {property.bedrooms}
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center gap-0.5">
                <Bath className="h-3 w-3" />
                {property.bathrooms}
              </div>
            )}
            <div className="flex items-center gap-0.5">
              <Square className="h-3 w-3" />
              {property.area} sq ft
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-blue-700">₹{property.price.toLocaleString()}</p>
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
              {property.listing_type === 'sale' ? 'Sale' : 'Rent'}
            </span>
          </div>
        </div>
      </div>
      {displayText && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          <p className="text-sm text-gray-700">{displayText}</p>
        </div>
      )}
    </button>
  );
};
