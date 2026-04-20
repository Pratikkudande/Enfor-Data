import { Campaign, Template, AnalyticsData, MarketingStats } from './types';

export const marketingStats: MarketingStats = {
  totalCampaigns: 24,
  activeCampaigns: 5,
  totalReach: 15420,
  engagementRate: 68,
  leadsGenerated: 342,
  conversionRate: 12.5,
  whatsappMessages: 1250,
  emailsSent: 890,
  socialShares: 456
};

export const campaigns: Campaign[] = [
  {
    id: '1',
    name: 'Luxury Apartments Launch - Q1 2024',
    type: 'property_launch',
    status: 'active',
    channels: ['whatsapp', 'email', 'social'],
    reach: 2500,
    engagement: 72,
    leads: 45,
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    budget: 25000,
    spent: 18500,
    image: 'https://images.pexels.com/photos/1918291/pexels-photo-1918291.jpeg'
  },
  {
    id: '2',
    name: 'Festival Special Offers',
    type: 'promotional',
    status: 'active',
    channels: ['whatsapp', 'social'],
    reach: 3200,
    engagement: 65,
    leads: 78,
    startDate: '2024-01-10',
    endDate: '2024-01-25',
    budget: 15000,
    spent: 12000,
    image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'
  },
  {
    id: '3',
    name: 'Commercial Space Campaign',
    type: 'targeted',
    status: 'scheduled',
    channels: ['email', 'whatsapp'],
    reach: 0,
    engagement: 0,
    leads: 0,
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    budget: 30000,
    spent: 0,
    image: 'https://images.pexels.com/photos/159306/construction-site-build-construction-work-159306.jpeg'
  },
  {
    id: '4',
    name: 'New Year Property Deals',
    type: 'seasonal',
    status: 'completed',
    channels: ['whatsapp', 'email', 'social'],
    reach: 5200,
    engagement: 71,
    leads: 125,
    startDate: '2023-12-20',
    endDate: '2024-01-05',
    budget: 35000,
    spent: 32000,
    image: 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg'
  }
];

export const templates: Template[] = [
  {
    id: '1',
    name: 'Property Launch Announcement',
    category: 'WhatsApp',
    type: 'property_launch',
    preview: 'New luxury apartments launching in [Location]! 🏠 Premium amenities, modern design...',
    uses: 145,
    engagement: 75
  },
  {
    id: '2',
    name: 'Open House Invitation',
    category: 'Email',
    type: 'event',
    preview: 'You are invited to an exclusive open house event at our latest property...',
    uses: 89,
    engagement: 62
  },
  {
    id: '3',
    name: 'Property Showcase Post',
    category: 'Social Media',
    type: 'showcase',
    preview: 'Discover your dream home! Beautiful 3BHK with panoramic city views...',
    uses: 234,
    engagement: 81
  },
  {
    id: '4',
    name: 'Client Testimonial',
    category: 'Social Media',
    type: 'testimonial',
    preview: 'Hear what our satisfied clients have to say about their property journey...',
    uses: 67,
    engagement: 69
  },
  {
    id: '5',
    name: 'Market Update Newsletter',
    category: 'Email',
    type: 'newsletter',
    preview: 'This month in real estate: Latest market trends, property values, and opportunities...',
    uses: 156,
    engagement: 58
  },
  {
    id: '6',
    name: 'Limited Time Offer',
    category: 'WhatsApp',
    type: 'promotional',
    preview: 'Special discount on booking fees! Limited time offer for selected properties...',
    uses: 198,
    engagement: 78
  }
];

export const analyticsData: AnalyticsData = {
  channelPerformance: [
    { channel: 'WhatsApp', sent: 1250, delivered: 1225, opened: 980, clicked: 650, conversion: 82 },
    { channel: 'Email', sent: 890, delivered: 865, opened: 520, clicked: 280, conversion: 45 },
    { channel: 'Social Media', sent: 456, delivered: 456, opened: 380, clicked: 190, conversion: 28 }
  ],
  topPerformingContent: [
    { title: 'Luxury Apartment Showcase', views: 2500, engagement: 82, leads: 45 },
    { title: 'Investment Opportunity Guide', views: 1800, engagement: 75, leads: 38 },
    { title: 'Virtual Property Tours', views: 2100, engagement: 79, leads: 42 },
    { title: 'Festival Special Offers', views: 3200, engagement: 71, leads: 78 }
  ]
};
