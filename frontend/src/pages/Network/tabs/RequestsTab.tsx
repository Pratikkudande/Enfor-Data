import React from 'react';
import { Check, X, Bell, Building2, MapPin, Clock } from 'lucide-react';
import { ConnectionRequest } from '../types';
import { AvatarCircle } from '../components/AvatarCircle';

interface RequestsTabProps {
  pendingIn: ConnectionRequest[];
  pendingOut: ConnectionRequest[];
  onRespond: (reqId: string, action: 'accept' | 'reject') => void;
}

export const RequestsTab: React.FC<RequestsTabProps> = ({
  pendingIn,
  pendingOut,
  onRespond,
}) => {
  return (
    <div className="space-y-8 min-w-0">
      {/* Incoming Requests */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Incoming Requests ({pendingIn.length})
        </h3>
        {pendingIn.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No pending incoming requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingIn.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start mb-4">
                  <AvatarCircle name={req.sender_name || '?'} img={req.sender_image} size="w-12 h-12" />
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{req.sender_name}</h3>
                    <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium mt-0.5">
                      Wants to connect
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {req.sender_firm && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{req.sender_firm}</span>
                    </div>
                  )}
                  {req.sender_city && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{req.sender_city}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onRespond(req.id, 'accept')}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <Check className="h-4 w-4" /> Accept
                  </button>
                  <button
                    onClick={() => onRespond(req.id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                  >
                    <X className="h-4 w-4" /> Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Sent Requests ({pendingOut.length})
        </h3>
        {pendingOut.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
            <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No sent requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingOut.map(req => (
              <div
                key={req.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center flex-1 min-w-0">
                    <AvatarCircle name={req.receiver_name || '?'} img={null} size="w-12 h-12" />
                    <div className="ml-3 flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{req.receiver_name}</h3>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${
                        req.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : req.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2">
                  {req.receiver_firm && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{req.receiver_firm}</span>
                    </div>
                  )}
                  {req.receiver_city && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{req.receiver_city}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
