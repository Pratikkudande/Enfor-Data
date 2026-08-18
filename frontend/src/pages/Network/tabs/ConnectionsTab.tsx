import React from 'react';
import { MessageSquare } from 'lucide-react';
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
    <div className="space-y-3">
      {connections.length === 0 && (
        <div className="text-center py-8 text-sm sm:text-base text-gray-500">
          No connections yet. Discover brokers to connect.
        </div>
      )}
      <div className="grid grid-cols-1 gap-3">
        {connections.map(conn => (
          <div key={conn.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
            <AvatarCircle name={conn.peer_name} img={conn.peer_image} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm sm:text-base">{conn.peer_name}</p>
              <p className="text-xs sm:text-sm text-gray-500">{conn.peer_firm} · {conn.peer_city}</p>
            </div>
            <button
              onClick={() => onOpenChat(conn.peer_id)}
              className="flex items-center justify-center gap-1.5 text-xs sm:text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
