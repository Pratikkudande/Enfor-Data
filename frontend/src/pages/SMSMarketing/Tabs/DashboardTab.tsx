import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { SMSAccount, getSMSStats, getSMSCampaigns, SMSStats, SMSCampaign } from '../../../services/smsMarketingApi';

interface DashboardTabProps {
  account: SMSAccount | null;
  isConnected: boolean;
  onRefresh: () => void;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ account, isConnected }) => {
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isConnected]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, campaignsData] = await Promise.all([
        getSMSStats(),
        getSMSCampaigns(),
      ]);
      setStats(statsData.stats);
      setCampaigns(campaignsData.campaigns.slice(0, 5)); // Latest 5 campaigns
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SMS Marketing</h2>
          <p className="text-gray-600 mb-6">
            Connect your Twilio account to start sending SMS campaigns to your clients.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">What you can do:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Send individual SMS messages to clients</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Create and manage SMS campaigns</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Use message templates for quick sending</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Track delivery status and analytics</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Total Sent</span>
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.total_sent || 0}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Successful</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.successful || 0}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Failed</span>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats?.failed || 0}</div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Success Rate</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.success_rate?.toFixed(1) || 0}%
          </div>
        </div>
      </div>

      {/* Usage Limit */}
      {account && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Daily Usage</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Messages sent today</span>
              <span className="font-medium text-gray-900">
                {account.messages_sent_today} / {account.message_limit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((account.messages_sent_today / account.message_limit) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {campaigns.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No campaigns yet. Create your first campaign to get started.
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {campaign.message_text}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Recipients: {campaign.total_recipients}</span>
                      <span>Sent: {campaign.successful_sends}</span>
                      <span>Failed: {campaign.failed_sends}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${
                          campaign.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : campaign.status === 'sending'
                            ? 'bg-blue-100 text-blue-800'
                            : campaign.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      `}
                    >
                      {campaign.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
