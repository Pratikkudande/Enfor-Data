import React, { useState } from 'react';
import {
  Megaphone,
  TrendingUp,
  Users,
  BarChart3,
  Target,
  Sparkles,
  FileText,
  Plus
} from 'lucide-react';
import { marketingStats } from './mockData';
import OverviewTab from './Tabs/OverviewTab';
import CampaignsTab from './Tabs/CampaignsTab';
import TemplatesTab from './Tabs/TemplatesTab';
import AnalyticsTab from './Tabs/AnalyticsTab';

const MarketingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'templates' | 'analytics'>('overview');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketing Center</h1>
            <p className="text-gray-600">Manage campaigns, templates, and track your marketing performance</p>
          </div>

          <button
            onClick={() => setShowCreateCampaign(true)}
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Create Campaign</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <span className="text-3xl font-bold">{marketingStats.totalCampaigns}</span>
            </div>
            <div className="text-blue-100 text-sm font-medium mb-1">Total Campaigns</div>
            <div className="text-xs text-blue-200">{marketingStats.activeCampaigns} active campaigns</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{marketingStats.totalReach.toLocaleString()}</span>
            </div>
            <div className="text-gray-600 text-sm font-medium mb-1">Total Reach</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last month
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{marketingStats.leadsGenerated}</span>
            </div>
            <div className="text-gray-600 text-sm font-medium mb-1">Leads Generated</div>
            <div className="flex items-center text-xs text-orange-600">
              <Sparkles className="h-3 w-3 mr-1" />
              {marketingStats.conversionRate}% conversion rate
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{marketingStats.engagementRate}%</span>
            </div>
            <div className="text-gray-600 text-sm font-medium mb-1">Engagement Rate</div>
            <div className="flex items-center text-xs text-purple-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Above industry average
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-2">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} />}
          {activeTab === 'campaigns' && <CampaignsTab />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
};

export default MarketingView;
