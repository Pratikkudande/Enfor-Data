import React from 'react';
import { Phone, MapPin, Eye, Trash2, UserX } from 'lucide-react';
import { ExternalBroker } from '../../../../services/externalBrokerApi';

interface ExternalBrokerCardProps {
  broker: ExternalBroker;
  currentUserId?: string;
  onEdit: (broker: ExternalBroker) => void;
  onView: (broker: ExternalBroker) => void;
  onDelete: (broker: ExternalBroker) => void;
  isDeleting: boolean;
}

export const ExternalBrokerCard: React.FC<ExternalBrokerCardProps> = ({
  broker,
  currentUserId,
  onView,
  onDelete,
  isDeleting,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <UserX className="h-6 w-6 text-indigo-500" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{broker.name}</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Not on EnforData
            </span>
          </div>
        </div>

        {/* Action icons — Eye always visible; Edit/Delete only for adder */}
        <div className="flex gap-2 ml-2 flex-shrink-0">
          <button
            onClick={() => onView(broker)}
            className="text-blue-600 hover:text-blue-700 transition-colors"
            title="View details"
          >
            <Eye className="h-5 w-5" />
          </button>
          {broker.added_by === currentUserId && (
            <button
              onClick={() => onDelete(broker)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="font-medium">{broker.mobile_number}</span>
        </div>
        {broker.area && (
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{broker.area}</span>
          </div>
        )}
        {broker.location && (
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{broker.location}</span>
          </div>
        )}
        {broker.notes && (
          <p className="text-sm text-gray-600 line-clamp-2">{broker.notes}</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Added by {broker.added_by === currentUserId ? 'you' : (broker.added_by_name ?? 'a broker')}
        </span>
      </div>
    </div>
  );
};
