import { apiClient } from './apiClient';

export interface WhatsAppAccount {
  id: string;
  user_id: string;
  phone_number: string;
  display_name?: string;
  status: string;
  message_limit: number;
  messages_sent_today: number;
  connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  message_text: string;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  pending_sends: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  client_id: string;
  recipient_name?: string;
  recipient_phone: string;
  send_status: string;
  provider_message_id?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string;
  template_text: string;
  variables: string[];
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  user_id: string;
  campaign_id?: string;
  client_id?: string;
  message_type: string;
  message_text: string;
  recipient_phone: string;
  status: string;
  provider_message_id?: string;
  error_message?: string;
  sent_at: string;
}

export interface ConnectAccountRequest {
  phone_number: string;
  display_name: string;
}

export interface SendMessageRequest {
  client_id: string;
  message: string;
}

export interface CreateCampaignRequest {
  name: string;
  message: string;
  client_ids: string[];
}

export interface CreateTemplateRequest {
  name: string;
  category: string;
  template_text: string;
  variables?: string[];
}

export const whatsappApi = {
  // Account Management
  getAccount: async (): Promise<{ connected: boolean; account: WhatsAppAccount | null }> => {
    return apiClient.request('/whatsapp/account');
  },

  connectAccount: async (data: ConnectAccountRequest): Promise<void> => {
    return apiClient.request('/whatsapp/connect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  disconnectAccount: async (): Promise<void> => {
    return apiClient.request('/whatsapp/disconnect', {
      method: 'POST',
    });
  },

  // Message Sending
  sendMessage: async (data: SendMessageRequest): Promise<void> => {
    return apiClient.request('/whatsapp/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Campaign Management
  getCampaigns: async (): Promise<{ campaigns: Campaign[] }> => {
    return apiClient.request('/whatsapp/campaigns');
  },

  createCampaign: async (data: CreateCampaignRequest): Promise<{ data: Campaign }> => {
    return apiClient.request('/whatsapp/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getCampaignDetails: async (id: string): Promise<{ campaign: Campaign; recipients: CampaignRecipient[] }> => {
    return apiClient.request(`/whatsapp/campaigns/${id}`);
  },

  sendCampaign: async (id: string): Promise<void> => {
    return apiClient.request(`/whatsapp/campaigns/${id}/send`, {
      method: 'POST',
    });
  },

  // Templates
  getTemplates: async (): Promise<{ templates: MessageTemplate[] }> => {
    return apiClient.request('/whatsapp/templates');
  },

  createTemplate: async (data: CreateTemplateRequest): Promise<void> => {
    return apiClient.request('/whatsapp/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteTemplate: async (id: string): Promise<void> => {
    return apiClient.request(`/whatsapp/templates/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  getMessageLogs: async (): Promise<{ logs: MessageLog[] }> => {
    return apiClient.request('/whatsapp/logs');
  },
};
