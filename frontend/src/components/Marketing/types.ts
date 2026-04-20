export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  channels: string[];
  reach: number;
  engagement: number;
  leads: number;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  image: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  type: string;
  preview: string;
  uses: number;
  engagement: number;
}

export interface ChannelPerformance {
  channel: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  conversion: number;
}

export interface TopContent {
  title: string;
  views: number;
  engagement: number;
  leads: number;
}

export interface AnalyticsData {
  channelPerformance: ChannelPerformance[];
  topPerformingContent: TopContent[];
}

export interface MarketingStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalReach: number;
  engagementRate: number;
  leadsGenerated: number;
  conversionRate: number;
  whatsappMessages: number;
  emailsSent: number;
  socialShares: number;
}
