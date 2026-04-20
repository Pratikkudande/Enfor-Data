import React from 'react';
import { MessageSquare, Send, Users, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import StatsCard from '../../Dashboard/StatsCard';
import { whatsappStats, recentMessages } from '../mockData';
import { getStatusIcon, getTypeColor } from '../utils';

const DashboardTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Messages Sent"
          value={whatsappStats.messagesSent}
          icon={MessageSquare}
          color="blue"
          subtitle="This month"
        />
        <StatsCard
          title="Messages Remaining"
          value={whatsappStats.messagesRemaining}
          icon={Clock}
          color="orange"
          subtitle="Available credits"
        />
        <StatsCard
          title="Delivery Rate"
          value={`${whatsappStats.deliveryRate}%`}
          icon={CheckCircle}
          color="green"
          subtitle="Successful deliveries"
        />
        <StatsCard
          title="Response Rate"
          value={`${whatsappStats.responseRate}%`}
          icon={BarChart3}
          color="purple"
          subtitle="Client responses"
        />
        <StatsCard
          title="Campaigns Sent"
          value={whatsappStats.campaignsSent}
          icon={Send}
          color="teal"
          subtitle="This month"
        />
        <StatsCard
          title="Active Clients"
          value={whatsappStats.activeClients}
          icon={Users}
          color="blue"
          subtitle="Receiving messages"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
        <div className="space-y-4">
          {recentMessages.map((message) => (
            <div key={message.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {message.recipient}
                    {message.recipientCount && (
                      <span className="text-gray-500 ml-1">
                        ({message.recipientCount} recipients)
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(message.type)}`}>
                      {message.type}
                    </span>
                    {getStatusIcon(message.status)}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{message.message}</p>
                <p className="text-xs text-gray-500">{message.sentAt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
