import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { campaigns } from '../mockData';
import { getStatusColor, getChannelIcon } from '../utils';

const CampaignsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <option>All Status</option>
          <option>Active</option>
          <option>Scheduled</option>
          <option>Completed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group">
            <div className="relative h-48 overflow-hidden">
              <img
                src={campaign.image}
                alt={campaign.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {campaign.name}
              </h3>

              <div className="flex items-center space-x-2 mb-4">
                {campaign.channels.map((channel) => {
                  const Icon = getChannelIcon(channel);
                  return (
                    <div
                      key={channel}
                      className="p-1.5 bg-gray-100 rounded-lg"
                      title={channel}
                    >
                      <Icon className="h-4 w-4 text-gray-600" />
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="text-lg font-bold text-gray-900">{campaign.reach.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">Reach</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{campaign.engagement}%</div>
                  <div className="text-xs text-gray-500">Engagement</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{campaign.leads}</div>
                  <div className="text-xs text-gray-500">Leads</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-semibold text-gray-900">
                    ₹{campaign.spent.toLocaleString()} / ₹{campaign.budget.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full"
                    style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignsTab;
