import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, MessageSquare, Users, Calendar, Loader } from 'lucide-react';
import { whatsappApi, Campaign, MessageLog } from '../../../services/whatsappApi';
import { formatDistanceToNow } from '../../../utils/dateUtils';
import { getStatusIcon } from '../utils';

const AnalyticsTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [campaignsRes, logsRes] = await Promise.all([
        whatsappApi.getCampaigns(),
        whatsappApi.getMessageLogs(),
      ]);
      setCampaigns(campaignsRes.campaigns || []);
      setLogs(logsRes.logs || []);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-600 mt-4">Loading analytics...</p>
      </div>
    );
  }

  const totalSent = campaigns.reduce((sum, c) => sum + c.successful_sends, 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + c.failed_sends, 0);
  const totalPending = campaigns.reduce((sum, c) => sum + c.pending_sends, 0);
  const successRate = totalSent + totalFailed > 0 
    ? Math.round((totalSent / (totalSent + totalFailed)) * 100) 
    : 0;

  const campaignsByStatus = {
    completed: campaigns.filter(c => c.status === 'completed').length,
    sending: campaigns.filter(c => c.status === 'sending').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    failed: campaigns.filter(c => c.status === 'failed').length,
  };

  const messagesByType = logs.reduce((acc, log) => {
    acc[log.message_type] = (acc[log.message_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Total Sent</h4>
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalSent}</p>
          <p className="text-xs text-gray-500 mt-1">Successful deliveries</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Success Rate</h4>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{successRate}%</p>
          <p className="text-xs text-gray-500 mt-1">{totalFailed} failed</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Total Campaigns</h4>
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{campaigns.length}</p>
          <p className="text-xs text-gray-500 mt-1">{campaignsByStatus.completed} completed</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">Pending</h4>
            <Calendar className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalPending}</p>
          <p className="text-xs text-gray-500 mt-1">Messages in queue</p>
        </div>
      </div>

      {/* Campaign Status Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">{campaignsByStatus.completed}</p>
            <p className="text-sm text-green-600 mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{campaignsByStatus.sending}</p>
            <p className="text-sm text-blue-600 mt-1">Sending</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">{campaignsByStatus.draft}</p>
            <p className="text-sm text-gray-600 mt-1">Draft</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">{campaignsByStatus.failed}</p>
            <p className="text-sm text-red-600 mt-1">Failed</p>
          </div>
        </div>
      </div>

      {/* Message Types */}
      {Object.keys(messagesByType).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages by Type</h3>
          <div className="space-y-3">
            {Object.entries(messagesByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Campaigns Performance */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Campaign</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Recipients</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Sent</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Failed</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 10).map((campaign) => {
                  const rate = campaign.successful_sends + campaign.failed_sends > 0
                    ? Math.round((campaign.successful_sends / (campaign.successful_sends + campaign.failed_sends)) * 100)
                    : 0;
                  
                  return (
                    <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-gray-900">{campaign.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                          campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                          campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">{campaign.total_recipients}</td>
                      <td className="py-3 px-4 text-right text-sm text-green-600 font-medium">{campaign.successful_sends}</td>
                      <td className="py-3 px-4 text-right text-sm text-red-600 font-medium">{campaign.failed_sends}</td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-gray-900">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message Activity Log */}
      {logs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{log.recipient_phone}</p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{log.message_text}</p>
                  {log.error_message && (
                    <p className="text-xs text-red-600 mt-1">Error: {log.error_message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {campaigns.length === 0 && logs.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Yet</h3>
          <p className="text-gray-600">Start sending messages to see analytics and insights</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsTab;
