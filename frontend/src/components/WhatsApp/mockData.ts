import { WhatsAppStats, RecentMessage, MessageTemplate, WhatsAppClient } from './types';

export const whatsappStats: WhatsAppStats = {
  messagesSent: 1250,
  messagesRemaining: 750,
  deliveryRate: 98,
  responseRate: 45,
  campaignsSent: 15,
  activeClients: 320
};

export const recentMessages: RecentMessage[] = [
  {
    id: '1',
    recipient: 'John Doe',
    message: 'New property available in Bandra...',
    type: 'marketing',
    status: 'delivered',
    sentAt: '2 hours ago'
  },
  {
    id: '2',
    recipient: 'Bulk Campaign',
    message: 'Festival greetings and special offers...',
    type: 'bulk',
    status: 'sent',
    sentAt: '4 hours ago',
    recipientCount: 150
  },
  {
    id: '3',
    recipient: 'Sarah Wilson',
    message: 'Appointment confirmed for tomorrow...',
    type: 'appointment',
    status: 'read',
    sentAt: '6 hours ago'
  }
];

export const messageTemplates: MessageTemplate[] = [
  {
    id: '1',
    name: 'New Property Alert',
    category: 'marketing',
    template: 'Hi {name}, we have a new {propertyType} property available in {location} within your budget of ₹{budget}. Would you like to schedule a viewing?'
  },
  {
    id: '2',
    name: 'Appointment Reminder',
    category: 'appointment',
    template: 'Hi {name}, this is a reminder for your property viewing appointment tomorrow at {time}. Location: {address}. Contact me if you need to reschedule.'
  },
  {
    id: '3',
    name: 'Thank You Message',
    category: 'acknowledgment',
    template: 'Thank you {name} for visiting the property today. I hope you liked it. Please let me know if you have any questions or would like to proceed.'
  }
];

export const clients: WhatsAppClient[] = [
  { id: '1', name: 'John Doe', phone: '+91 9876543210', type: 'buyer' },
  { id: '2', name: 'Sarah Wilson', phone: '+91 9876543211', type: 'seller' },
  { id: '3', name: 'Mike Johnson', phone: '+91 9876543212', type: 'tenant' },
  { id: '4', name: 'Emma Davis', phone: '+91 9876543213', type: 'owner' }
];
