import React from 'react';
import { MessageSquare, Mail, Share2, ArrowRight, Eye, Target, TrendingUp } from 'lucide-react';
import { marketingStats, campaigns } from '../mockData';
import { getStatusColor } from '../utils';

interface OverviewTabProps {
  setActiveTab: (tab: 'campaigns') => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-semibold text-gray-900">Send WhatsApp Blast</span>
            </div>
            <p className="text-sm text-gray-600">Send bulk messages to clients</p>
          </button>

          <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-semibold text-gray-900">Email Campaign</span>
            </div>
            <p className="text-sm text-gray-600">Create and send email newsletters</p>
          </button>

          <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group text-left">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Share2 className="h-5 w-5 text-orange-600" />
              </div>
              <span className="font-semibold text-gray-900">Social Media Post</span>
            </div>
            <p className="text-sm text-gray-600">Share properties on social media</p>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-700">{marketingStats.whatsappMessages}</span>
            </div>
            <div className="font-semibold text-gray-900 mb-1">WhatsApp</div>
            <div className="text-sm text-gray-600 mb-3">Messages sent this month</div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
              <div className="bg-green-500 h-full" style={{ width: '82%' }}></div>
            </div>
            <div className="mt-2 text-xs text-gray-600">82% delivery rate</div>
          </div>

          <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-blue-700">{marketingStats.emailsSent}</span>
            </div>
            <div className="font-semibold text-gray-900 mb-1">Email</div>
            <div className="text-sm text-gray-600 mb-3">Emails sent this month</div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
              <div className="bg-blue-500 h-full" style={{ width: '65%' }}></div>
            </div>
            <div className="mt-2 text-xs text-gray-600">65% open rate</div>
          </div>

          <div className="p-5 border border-gray-200 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Share2 className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-semibold text-orange-700">{marketingStats.socialShares}</span>
            </div>
            <div className="font-semibold text-gray-900 mb-1">Social Media</div>
            <div className="text-sm text-gray-600 mb-3">Posts shared this month</div>
            <div className="w-full bg-white rounded-full h-2 overflow-hidden">
              <div className="bg-orange-500 h-full" style={{ width: '71%' }}></div>
            </div>
            <div className="mt-2 text-xs text-gray-600">71% engagement rate</div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
          <button
            onClick={() => setActiveTab('campaigns')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        <div className="space-y-3">
          {campaigns.slice(0, 3).map((campaign) => (
            <div
              key={campaign.id}
              className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={campaign.image}
                  alt={campaign.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {campaign.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(campaign.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Eye className="h-4 w-4 mr-1" />
                      {campaign.reach.toLocaleString()} reach
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Target className="h-4 w-4 mr-1" />
                      {campaign.leads} leads
                    </div>
                    <div className="flex items-center text-gray-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      {campaign.engagement}% engagement
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
