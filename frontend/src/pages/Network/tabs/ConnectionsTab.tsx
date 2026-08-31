import React from 'react';
import { MessageSquare, UserCheck, Building2, MapPin } from 'lucide-react';
import { Connection } from '../types';
import { AvatarCircle } from '../components/AvatarCircle';

interface ConnectionsTabProps {
  connections: Connection[];
  onOpenChat: (peerId: string) => void;
}

export const ConnectionsTab: React.FC<ConnectionsTabProps> = ({
  connections,
  onOpenChat,
}) => {
  return (
    <div className="space-y-4 min-w-0">
      {connections.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-500">
            Discover brokers and send connection requests to grow your network.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {connections.map(conn => (
            <div
              key={conn.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1 min-w-0">
                  <AvatarCircle name={conn.peer_name} img={conn.peer_image} size="w-12 h-12" />
                  <div className="ml-3 flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 truncate">{conn.peer_name}</h3>
                    <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium mt-0.5">
                      Connected
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                {conn.peer_firm && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{conn.peer_firm}</span>
                  </div>
                )}
                {conn.peer_city && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{conn.peer_city}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => onOpenChat(conn.peer_id)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
