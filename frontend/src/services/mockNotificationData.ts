import { Notification, NotificationStats } from './notificationApi';

// Mock notification data for testing
export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Appointment Scheduled',
    message: 'Client John Doe has scheduled a property viewing for tomorrow at 2:00 PM.',
    type: 'appointment',
    priority: 'high',
    read: false,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    action_url: '/appointments',
    metadata: {
      client_id: 'client_1',
      appointment_id: 'apt_1'
    }
  },
  {
    id: '2',
    title: 'Property Inquiry Received',
    message: 'New inquiry for 3BHK Apartment in Bandra West. Client is interested in viewing.',
    type: 'property',
    priority: 'medium',
    read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    action_url: '/properties',
    metadata: {
      property_id: 'prop_1'
    }
  },
  {
    id: '3',
    title: 'Payment Received',
    message: 'Commission payment of ₹25,000 has been credited to your account.',
    type: 'payment',
    priority: 'high',
    read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    metadata: {
      amount: 25000
    }
  },
  {
    id: '4',
    title: 'New Client Added',
    message: 'Sarah Wilson has been added to your client list. She is looking for a 2BHK apartment.',
    type: 'client',
    priority: 'medium',
    read: true,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    action_url: '/clients',
    metadata: {
      client_id: 'client_2'
    }
  },
  {
    id: '5',
    title: 'System Maintenance Scheduled',
    message: 'Platform maintenance is scheduled for tonight from 11 PM to 1 AM. Please save your work.',
    type: 'system',
    priority: 'medium',
    read: true,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    id: '6',
    title: 'Marketing Campaign Results',
    message: 'Your WhatsApp campaign reached 150 clients with 45% open rate. View detailed analytics.',
    type: 'marketing',
    priority: 'low',
    read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    action_url: '/marketing',
  },
  {
    id: '7',
    title: 'Appointment Reminder',
    message: 'Reminder: Property viewing with Mike Johnson is scheduled for today at 4:00 PM.',
    type: 'appointment',
    priority: 'high',
    read: true,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    action_url: '/appointments',
    metadata: {
      client_id: 'client_3',
      appointment_id: 'apt_2'
    }
  },
  {
    id: '8',
    title: 'Property Status Updated',
    message: 'Your property listing "Luxury Villa in Juhu" has been marked as sold.',
    type: 'property',
    priority: 'medium',
    read: true,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    action_url: '/properties',
    metadata: {
      property_id: 'prop_2'
    }
  }
];

export const mockNotificationStats: NotificationStats = {
  total: mockNotifications.length,
  unread: mockNotifications.filter(n => !n.read).length,
  by_type: {
    appointment: mockNotifications.filter(n => n.type === 'appointment').length,
    property: mockNotifications.filter(n => n.type === 'property').length,
    client: mockNotifications.filter(n => n.type === 'client').length,
    payment: mockNotifications.filter(n => n.type === 'payment').length,
    system: mockNotifications.filter(n => n.type === 'system').length,
    marketing: mockNotifications.filter(n => n.type === 'marketing').length,
  }
};