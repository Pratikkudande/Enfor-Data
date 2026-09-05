import React from 'react';
import { Search, UserX } from 'lucide-react';
import { ExternalBroker } from '../../../../services/externalBrokerApi';
import { ExternalBrokerCard } from './ExternalBrokerCard';

interface ExternalBrokersTabProps {
  brokers: ExternalBroker[];
  loading: boolean;
  search: string;
  currentUserId?: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;          // kept for interface compat — not used in this tab
  onEdit: (broker: ExternalBroker) => void;
  onView: (broker: ExternalBroker) => void;
  onDelete: (broker: ExternalBroker) => void;
  deletingId: string | null;
}

export const ExternalBrokersTab: React.FC<ExternalBrokersTabProps> = ({
  brokers,
  loading,
  search,
  currentUserId,
  onSearchChange,
  onView,
  onDelete,
  onEdit,
  deletingId,
}) => {
  const filteredBrokers = brokers.filter(b => {
    const t = search.toLowerCase();
    return b.name.toLowerCase().includes(t) ||
      b.mobile_number.includes(t) ||
      (b.area?.toLowerCase().includes(t) ?? false) ||
      (b.location?.toLowerCase().includes(t) ?? false);
  });

  return (
    <div className="space-y-4 min-w-0">
      {/* Sub-header — view only for normal users */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900">Non-EnforData Brokers</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Brokers not yet on EnforData — auto-removed when they join the platform
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, mobile, area or location…"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Stats */}
      <p className="text-xs sm:text-sm text-gray-500">
        <UserX className="inline h-4 w-4 mr-1 text-gray-400" />
        {filteredBrokers.length} broker{filteredBrokers.length !== 1 ? 's' : ''}
        {search ? ' matching search' : ' total'}
      </p>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      )}

      {/* Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrokers.map(b => (
            <ExternalBrokerCard
              key={b.id}
              broker={b}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              isDeleting={deletingId === b.id}
            />
          ))}

          {filteredBrokers.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 px-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <UserX className="h-8 w-8 text-indigo-300" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">No external brokers found</h3>
              <p className="text-sm text-gray-500">
                {search ? 'Try adjusting your search' : 'No external brokers have been added yet'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
