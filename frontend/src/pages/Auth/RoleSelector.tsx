import React from 'react';

interface RoleSelectorProps {
  role: string;
  onChange: (role: 'broker' | 'channel_partner') => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ role, onChange }) => {
  return (
    <div className="mb-8">
      <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
        Select Your Role
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onChange('broker')}
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
            role === 'broker'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center mb-3">
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              role === 'broker'
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {role === 'broker' && (
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              )}
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Real Estate Broker</h4>
          </div>
          <p className="text-sm text-gray-600 ml-8">Manage properties, clients, and grow your business</p>
        </div>
        
        <div
          onClick={() => onChange('channel_partner')}
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
            role === 'channel_partner'
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center mb-3">
            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
              role === 'channel_partner'
                ? 'border-teal-500 bg-teal-500'
                : 'border-gray-300'
            }`}>
              {role === 'channel_partner' && (
                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
              )}
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Channel Partner</h4>
          </div>
          <p className="text-sm text-gray-600 ml-8">Showcase projects and connect with brokers</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
