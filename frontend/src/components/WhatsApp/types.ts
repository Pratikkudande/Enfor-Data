export interface WhatsAppStats {
  messagesSent: number;
  messagesRemaining: number;
  deliveryRate: number;
  responseRate: number;
  campaignsSent: number;
  activeClients: number;
}

export interface RecentMessage {
  id: string;
  recipient: string;
  message: string;
  type: string;
  status: string;
  sentAt: string;
  recipientCount?: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
}

export interface WhatsAppClient {
  id: string;
  name: string;
  phone: string;
  type: string;
}
