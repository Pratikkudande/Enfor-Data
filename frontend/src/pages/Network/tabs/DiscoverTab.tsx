import React from 'react';
import { Search, Users, MessageSquare, Check, MapPin, Phone, Briefcase, Home, TrendingUp } from 'lucide-react';
import { BrokerProfile } from '../types';
import { AvatarCircle } from '../components/AvatarCircle';

interface DiscoverTabProps {
  brokers: BrokerProfile[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onConnect: (brokerId: string) => void;
  onOpenChat: (brokerId: string) => void;
  currentUserId?: string;
}

export const DiscoverTab: React.FC<DiscoverTabProps> = ({
  brokers,
  loading,
  search,
  onSearchChange,
  onConnect,
  onOpenChat,
  currentUserId,
}) => {
  const filteredBrokers = brokers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase()) ||
    (b.firm_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, city or firm..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrokers.map(broker => (
            <div key={broker.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
              {/* Header: firm name */}
              <div className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center px-4">
                <p className="text-white text-xl font-bold text-center drop-shadow leading-snug line-clamp-2">
                  {broker.firm_name}
                </p>
              </div>

              <div className="px-4 pb-4">
                {/* Avatar */}
                <div className="flex justify-center -mt-8 mb-3">
                  <div className="relative">
                    <AvatarCircle name={broker.name} img={broker.profile_image} size="w-16 h-16" />
                    {broker.connection_status === 'connected' && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="mb-3 space-y-1">
                  <h3 className="font-bold text-gray-900 text-lg text-center truncate">{broker.name}</h3>
                  {broker.location && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{broker.location}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    {broker.city}, {broker.state}
                  </p>
                  {broker.whatsapp_number && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      <span>{broker.whatsapp_number}</span>
                    </p>
                  )}
                </div>

                {/* Specializations */}
                {broker.specializations && broker.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {broker.specializations.slice(0, 2).map((spec, idx) => (
                      <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                        {spec}
                      </span>
                    ))}
                    {broker.specializations.length > 2 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                        +{broker.specializations.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3 py-3 border-y border-gray-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-lg font-bold text-gray-900">{broker.years_experience || 0}+</p>
                    </div>
                    <p className="text-xs text-gray-500">Years Exp.</p>
                  </div>
                  <div className="text-center border-x border-gray-100">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Home className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-lg font-bold text-gray-900">{broker.properties_count || 0}</p>
                    </div>
                    <p className="text-xs text-gray-500">Properties</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-lg font-bold text-gray-900">{broker.deals_completed || 0}</p>
                    </div>
                    <p className="text-xs text-gray-500">Deals</p>
                  </div>
                </div>

                {/* Action */}
                {broker.connection_status === 'connected' ? (
                  <button
                    onClick={() => onOpenChat(broker.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg py-2.5 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
                  >
                    <MessageSquare className="h-4 w-4" /> Message
                  </button>
                ) : broker.connection_status === 'pending' ? (
                  <div className="w-full text-center bg-yellow-50 text-yellow-700 rounded-lg py-2.5 text-sm font-medium border border-yellow-200">
                    {broker.sender_id === currentUserId ? 'Request Sent' : 'Respond to Request'}
                  </div>
                ) : (
                  <button
                    onClick={() => onConnect(broker.id)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg py-2.5 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
                  >
                    <Users className="h-4 w-4" /> Connect
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredBrokers.length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-gray-500">No brokers found</div>
          )}
        </div>
      )}
    </div>
  );
};
