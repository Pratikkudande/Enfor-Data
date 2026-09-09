import React, { useState, useEffect } from 'react';
import { Eye, CreditCard as Edit, Trash2, MapPin, Bed, Bath, Square, Phone, Mail, User, Building, MessageSquare, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../../types';
import { getStatusColor, formatPrice, formatTimeAgo } from './utils';
import { networkApi } from '../../services/networkApi';
import { ROUTES } from '../../routes/routePaths';
import { API_CONFIG } from '../../config/api';
import ErrorBoundary from '../../components/ErrorBoundary';

export const getPropertyImageUrl = (property: Property) => {
  const photo = property.photos?.[0] || property.images?.[0];

  if (!photo) return '';

  if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:')) {
    return photo;
  }

  // Uploaded property photos are served by the API at /api/uploads/:filename.
  // Keep externally hosted and data URLs unchanged, while normalizing stored paths.
  const filename = photo.split('/').pop();
  return `${API_CONFIG.BASE_URL}/uploads/${filename}`;
};

interface PropertyCardProps {
  property: Property;
  currentUserId: string;
  isBusy: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (property: Property) => void;
  onStatusChange: (propertyId: string, status: string) => Promise<void>;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, currentUserId, isBusy, onView, onEdit, onDelete, onStatusChange }) => {
  const isOwner = property.broker_id === currentUserId;
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | null>(null);
  const [loadingConnection, setLoadingConnection] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const hasImage = !!(property.photos?.[0] || property.images?.[0]);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (newStatus === property.status) return;
    setUpdatingStatus(true);
    try {
      await onStatusChange(property.id, newStatus);
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Check connection status with the property broker
  useEffect(() => {
    if (!isOwner && property.broker_id) {
      checkConnectionStatus();
    }
  }, [property.broker_id, isOwner]);

  const checkConnectionStatus = async () => {
    try {
      // Lightweight per-broker status instead of fetching the whole directory.
      const response = await networkApi.getConnectionStatus(property.broker_id!);
      setConnectionStatus(response.data?.connection_status || 'none');
    } catch (error) {
      console.error('Failed to check connection status:', error);
    }
  };

  const handleConnect = async () => {
    if (!property.broker_id) return;
    setLoadingConnection(true);
    try {
      await networkApi.sendRequest(property.broker_id);
      setConnectionStatus('pending');
    } catch (error: any) {
      alert(error.message || 'Failed to send connection request');
    } finally {
      setLoadingConnection(false);
    }
  };

  const handleMessage = async () => {
    if (!property.broker_id) return;
    try {
      // Get conversations to find the one with this broker
      const convResponse = await networkApi.getConversations();
      const conversation = convResponse.data?.find(
        c => c.peer_id === property.broker_id
      );
      
      if (conversation) {
        // Navigate to network page with chat tab and property context
        navigate(ROUTES.NETWORK, {
          state: {
            tab: 'chat',
            conversationId: conversation.id,
            propertyContext: {
              id: property.id,
              title: property.title,
              location: `${property.location}, ${property.city}`,
              address: property.address,
              price: property.price,
              listing_type: property.listing_type,
              type: property.type,
              area: property.area,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              status: property.status,
              images: property.images,
              description: property.description,
              amenities: property.amenities,
              city: property.city,
              state: property.state,
              broker_id: property.broker_id,
              broker_name: property.broker_name,
              broker_city: property.broker_city,
              broker_whatsapp: property.broker_whatsapp,
              broker_email: property.broker_email
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to open chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${
      isOwner ? 'border-blue-100' : 'border-gray-100'
    }`}>
      {/* Image */}
      <div className="relative h-48 bg-gray-50 flex items-center justify-center border-b border-gray-100">
        <ErrorBoundary>
          {hasImage ? (
            <img
              src={getPropertyImageUrl(property)}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide broken image and show fallback
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.image-fallback');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }
              }}
              onLoad={(e) => {
                // Ensure fallback is hidden when image loads successfully
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.image-fallback');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'none';
                  }
                }
              }}
            />
          ) : null}
          
          {/* Fallback content - shown when no image or image fails to load */}
          <div className={`image-fallback flex flex-col items-center justify-center text-gray-400 select-none ${hasImage ? 'absolute inset-0' : ''}`} 
               style={{ display: hasImage ? 'none' : 'flex' }}>
            <Building className="h-10 w-10 stroke-[1.2] mb-1 text-gray-300" />
            <span className="text-[10px] font-semibold tracking-wider text-gray-400">NO PHOTO UPLOADED</span>
          </div>
        </ErrorBoundary>
        <div className="absolute top-3 right-3 z-10">
          {isOwner ? (
            <select
              value={property.status}
              onChange={handleStatusChange}
              disabled={updatingStatus}
              className={`px-2 py-0.5 text-xs font-semibold rounded-full border-0 cursor-pointer shadow-sm focus:ring-2 focus:ring-blue-500 outline-none ${getStatusColor(property.status)}`}
            >
              <option value="available" className="bg-white text-gray-800">Available</option>
              <option value="sold" className="bg-white text-gray-800">Sold</option>
              <option value="rented" className="bg-white text-gray-800">Rented</option>
              <option value="hold" className="bg-white text-gray-800">Hold</option>
              <option value="closed" className="bg-white text-gray-800">Closed</option>
              <option value="under_discussion" className="bg-white text-gray-800">Under Discussion</option>
            </select>
          ) : (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(property.status)}`}>
              {property.status.replace('_', ' ').toUpperCase()}
            </span>
          )}
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

        {/* Time Added */}
        <div className="text-xs text-gray-400 mb-3">
          Added {formatTimeAgo(property.created_at)}
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
          <div className="bg-amber-50 rounded-lg p-3 mb-3 space-y-2">
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

          {isOwner ? (
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
          ) : (
            /* Connection/Message Button for other broker's property */
            connectionStatus === 'connected' ? (
              <button
                onClick={handleMessage}
                disabled={loadingConnection}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm disabled:opacity-60"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                Message
              </button>
            ) : connectionStatus === 'pending' ? (
              <div className="flex-1 bg-yellow-50 text-yellow-700 py-2 px-3 rounded-lg text-center text-xs font-medium border border-yellow-200">
                Pending
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loadingConnection}
                className="flex-1 bg-amber-600 text-white py-2 px-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center text-sm disabled:opacity-60"
              >
                <UserPlus className="h-4 w-4 mr-1.5" />
                {loadingConnection ? 'Connecting...' : 'Connect'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
