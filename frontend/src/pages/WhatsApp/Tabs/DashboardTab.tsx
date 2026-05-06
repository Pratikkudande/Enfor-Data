import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Users, Clock, CheckCircle, BarChart3, AlertCircle } from 'lucide-react';
import StatsCard from '../../Dashboard/StatsCard';
import { whatsappApi, WhatsAppAccount, Campaign, MessageLog } from '../../../services/whatsappApi';
import { getStatusIcon, getTypeColor } from '../utils';
import { formatDistanceToNow } from '../../../utils/dateUtils';

interface DashboardTabProps {
  connected: boolean;
  account: WhatsAppAccount | null;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ connected, account }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (connected) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [connected]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, logsRes] = await Promise.all([
        whatsappApi.getCampaigns(),
        whatsappApi.getMessageLogs(),
      ]);
      setCampaigns(campaignsRes.campaigns || []);
      setLogs(logsRes.logs || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">WhatsApp Not Connected</h3>
        <p className="text-gray-600">Connect your WhatsApp account to view dashboard statistics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading dashboard...</p>
      </div>
    );
  }

  const messagesSent = account?.messages_sent_today || 0;
  const messagesRemaining = (account?.message_limit || 1000) - messagesSent;
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
  const totalSent = campaigns.reduce((sum, c) => sum + c.successful_sends, 0);
  const totalFailed = campaigns.reduce((sum, c) => sum + c.failed_sends, 0);
  const deliveryRate = totalSent + totalFailed > 0 
    ? Math.round((totalSent / (totalSent + totalFailed)) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Messages Sent Today"
          value={messagesSent}
          icon={MessageSquare}
          color="blue"
          subtitle="Current usage"
        />
        <StatsCard
          title="Messages Remaining"
          value={messagesRemaining}
          icon={Clock}
          color="orange"
          subtitle={`Limit: ${account?.message_limit || 1000}`}
        />
        <StatsCard
          title="Delivery Rate"
          value={`${deliveryRate}%`}
          icon={CheckCircle}
          color="green"
          subtitle="Successful deliveries"
        />
        <StatsCard
          title="Total Sent"
          value={totalSent}
          icon={Send}
          color="purple"
          subtitle="All campaigns"
        />
        <StatsCard
          title="Campaigns Completed"
          value={completedCampaigns}
          icon={BarChart3}
          color="teal"
          subtitle={`${campaigns.length} total`}
        />
        <StatsCard
          title="Failed Messages"
          value={totalFailed}
          icon={AlertCircle}
          color="red"
          subtitle="Needs attention"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No messages sent yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {log.recipient_phone}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(log.message_type)}`}>
                        {log.message_type}
                      </span>
                      {getStatusIcon(log.status)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 truncate">{log.message_text}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.sent_at), { addSuffix: true })}
                  </p>
                  {log.error_message && (
                    <p className="text-xs text-red-600 mt-1">Error: {log.error_message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Campaigns</h3>
          <div className="space-y-3">
            {campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {campaign.successful_sends} sent • {campaign.failed_sends} failed • {campaign.pending_sends} pending
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  campaign.status === 'completed' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'sending' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTab;
