import React from 'react';
import { MessageSquare, Mail, Share2, Eye, Heart, Target } from 'lucide-react';
import { analyticsData } from '../mockData';
import { getChannelIcon } from '../utils';

const AnalyticsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Channel</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Sent</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Delivered</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Opened</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Clicked</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.channelPerformance.map((channel) => (
                <tr key={channel.channel} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(channel.channel.toLowerCase().replace(' ', '')) === MessageSquare && (
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      )}
                      {getChannelIcon(channel.channel.toLowerCase().replace(' ', '')) === Mail && (
                        <Mail className="h-5 w-5 text-blue-600" />
                      )}
                      {getChannelIcon(channel.channel.toLowerCase().replace(' ', '')) === Share2 && (
                        <Share2 className="h-5 w-5 text-orange-600" />
                      )}
                      <span className="font-medium text-gray-900">{channel.channel}</span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4 text-gray-900">{channel.sent.toLocaleString()}</td>
                  <td className="text-center py-4 px-4 text-gray-900">{channel.delivered.toLocaleString()}</td>
                  <td className="text-center py-4 px-4 text-gray-900">{channel.opened.toLocaleString()}</td>
                  <td className="text-center py-4 px-4 text-gray-900">{channel.clicked.toLocaleString()}</td>
                  <td className="text-center py-4 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {channel.conversion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Content</h3>
        <div className="space-y-3">
          {analyticsData.topPerformingContent.map((content, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">{content.title}</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Eye className="h-4 w-4 mr-1" />
                      {content.views.toLocaleString()} views
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Heart className="h-4 w-4 mr-1" />
                      {content.engagement}% engagement
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Target className="h-4 w-4 mr-1" />
                      {content.leads} leads
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">#{index + 1}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
