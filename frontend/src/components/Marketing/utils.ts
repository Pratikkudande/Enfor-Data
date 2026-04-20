import { MessageSquare, Mail, Share2, Megaphone } from 'lucide-react';

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'scheduled':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'completed':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'paused':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'whatsapp':
      return MessageSquare;
    case 'email':
      return Mail;
    case 'social':
      return Share2;
    default:
      return Megaphone;
  }
};
