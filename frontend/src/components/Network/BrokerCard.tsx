import React from 'react';
import { Building2, Star, MapPin, UserPlus, MessageCircle } from 'lucide-react';
import { Broker } from './types';

interface BrokerCardProps {
  broker: Broker;
}

const BrokerCard: React.FC<BrokerCardProps> = ({ broker }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
      <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                {broker.name.split(' ').map(n => n[0]).join('')}
              </div>
              {broker.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {broker.name}
              </h3>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <Building2 className="h-3.5 w-3.5 mr-1" />
                {broker.company}
              </div>
            </div>
          </div>

          <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="ml-1 text-sm font-semibold text-amber-700">{broker.rating}</span>
          </div>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
          {broker.city}, {broker.state}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {broker.specialization.map((spec) => (
            <span
              key={spec}
              className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
            >
              {spec}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{broker.experience}+</div>
            <div className="text-xs text-gray-500">Years Exp.</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-lg font-semibold text-gray-900">{broker.propertiesListed}</div>
            <div className="text-xs text-gray-500">Properties</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{broker.dealsClosed}</div>
            <div className="text-xs text-gray-500">Deals</div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-100">
          <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md">
            <UserPlus className="h-4 w-4" />
            <span className="font-medium text-sm">Connect</span>
          </button>
          <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center">
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrokerCard;
