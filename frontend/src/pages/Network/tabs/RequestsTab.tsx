import React from 'react';
import { Check, X } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Incoming Requests */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Incoming ({pendingIn.length})</h3>
        {pendingIn.length === 0 && <p className="text-sm text-gray-400">No pending requests</p>}
        <div className="space-y-2">
          {pendingIn.map(req => (
            <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <AvatarCircle name={req.sender_name || '?'} img={req.sender_image} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{req.sender_name}</p>
                <p className="text-xs sm:text-sm text-gray-500">{req.sender_firm} · {req.sender_city}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onRespond(req.id, 'accept')}
                  className="flex-1 sm:flex-initial p-1.5 sm:p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onRespond(req.id, 'reject')}
                  className="flex-1 sm:flex-initial p-1.5 sm:p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sent Requests */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Sent ({pendingOut.length})</h3>
        {pendingOut.length === 0 && <p className="text-sm text-gray-400">No sent requests</p>}
        <div className="space-y-2">
          {pendingOut.map(req => (
            <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
              <AvatarCircle name={req.receiver_name || '?'} img={null} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">{req.receiver_name}</p>
                <p className="text-xs sm:text-sm text-gray-500">{req.receiver_firm} · {req.receiver_city}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
