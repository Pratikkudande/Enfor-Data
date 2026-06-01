import React from 'react';
import { Building2, Star, MapPin, Briefcase, BarChart3, Phone, UserPlus, MessageCircle, Mail } from 'lucide-react';
import { Broker } from './types';

interface BrokerListItemProps {
  broker: Broker;
}

const BrokerListItem: React.FC<BrokerListItemProps> = ({ broker }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-6 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
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
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {broker.name}
                </h3>
                <div className="flex items-center text-gray-600 mt-1">
                  <Building2 className="h-4 w-4 mr-1.5" />
                  <span className="font-medium">{broker.company}</span>
                </div>
              </div>

              <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-lg">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="ml-1.5 font-semibold text-amber-700">{broker.rating}</span>
              </div>
            </div>

            <div className="flex items-center text-gray-600 mb-3">
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

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{broker.experience}+ Years</div>
                  <div className="text-xs text-gray-500">Experience</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{broker.propertiesListed}</div>
                  <div className="text-xs text-gray-500">Properties</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{broker.dealsClosed}</div>
                  <div className="text-xs text-gray-500">Deals Closed</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-900">{broker.phone}</div>
                  <div className="text-xs text-gray-500">Contact</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-6 py-2.5 btn-primary flex items-center space-x-2 shadow-sm hover:shadow-md">
                <UserPlus className="h-4 w-4" />
                <span className="font-medium text-sm">Connect</span>
              </button>
              <button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Message</span>
              </button>
              <button className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium text-sm">Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerListItem;
