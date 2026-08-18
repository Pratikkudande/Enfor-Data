import React from 'react';
import { Phone, MapPin, Edit2, Trash2, UserX } from 'lucide-react';
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
  onEdit,
  onView,
  onDelete,
  isDeleting,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-shadow">
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{broker.name}</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              Not on EnforData
            </span>
          </div>
        </div>
        {/* Actions — only for the broker who added */}
        {broker.added_by === currentUserId && (
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(broker)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(broker)}
              disabled={isDeleting}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-medium break-all">{broker.mobile_number}</span>
        </div>
        {broker.area && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{broker.area}</span>
          </div>
        )}
        {broker.location && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{broker.location}</span>
          </div>
        )}
        {broker.notes && (
          <p className="text-xs text-gray-500 italic line-clamp-2 mt-1">{broker.notes}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Added by {broker.added_by === currentUserId ? 'you' : (broker.added_by_name ?? 'a broker')}
        </span>
        <button
          onClick={() => onView(broker)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View details
        </button>
      </div>
    </div>
  );
};
