import { api } from './apiClient';

// ============================================================
// Types
// ============================================================

export interface SMSAccount {
  id: string;
  user_id: string;
  msg91_sender_id?: string;
  status: 'connected' | 'not_connected' | 'suspended';
  connection_error?: string;
  message_limit: number;
  messages_sent_today: number;
  last_reset_date: string;
  connected_at?: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SMSCampaign {
  id: string;
  user_id: string;
  sms_account_id?: string;
  name: string;
  message_text: string;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  pending_sends: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'cancelled';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SMSCampaignRecipient {
  id: string;
  campaign_id: string;
  client_id: string;
  recipient_name?: string;
  recipient_phone: string;
  send_status: 'pending' | 'sent' | 'delivered' | 'failed';
  provider_message_id?: string;
  error_message?: string;
  queued_at: string;
  sent_at?: string;
  delivered_at?: string;
  failed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SMSMessageTemplate {
  id: string;
  user_id: string;
  name: string;
  category: string;
  template_text: string;
  variables?: string[];
  usage_count: number;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SMSMessageLog {
  id: string;
  user_id: string;
  campaign_id?: string;
  client_id?: string;
  message_type: 'individual' | 'campaign' | 'appointment';
  message_text: string;
  recipient_phone: string;
  status: 'sent' | 'delivered' | 'failed';
  provider_message_id?: string;
  error_message?: string;
  sent_at: string;
}

export interface SMSStats {
  total_sent: number;
  successful: number;
  failed: number;
  success_rate: number;
  messages_sent_today: number;
  message_limit: number;
}

// ============================================================
// Account Management
// ============================================================

export const getSMSAccount = async () => {
  const response = await api.get('/sms-marketing/account');
  return response;
};

export const connectSMSAccount = async (data?: {}) => {
  const response = await api.post('/sms-marketing/connect', data || {});
  return response.data;
};

export const disconnectSMSAccount = async () => {
  const response = await api.post('/sms-marketing/disconnect');
  return response.data;
};

// ============================================================
// Message Sending
// ============================================================

export const sendSMS = async (data: { client_id: string; message: string }) => {
  const response = await api.post('/sms-marketing/send', data);
  return response.data;
};

export const sendBulkSMS = async (data: { client_ids: string[]; message: string }) => {
  const response = await api.post('/sms-marketing/send-bulk', data);
  return response.data;
};

// ============================================================
// Campaign Management
// ============================================================

export const createSMSCampaign = async (data: {
  name: string;
  message: string;
  client_ids: string[];
}) => {
  const response = await api.post('/sms-marketing/campaigns', data);
  return response.data;
};

export const getSMSCampaigns = async (): Promise<{ campaigns: SMSCampaign[] }> => {
  const response = await api.get('/sms-marketing/campaigns');
  return response.data;
};

export const getSMSCampaignDetails = async (
  campaignId: string
): Promise<{ campaign: SMSCampaign; recipients: SMSCampaignRecipient[] }> => {
  const response = await api.get(`/sms-marketing/campaigns/${campaignId}`);
  return response.data;
};

export const sendSMSCampaign = async (campaignId: string) => {
  const response = await api.post(`/sms-marketing/campaigns/${campaignId}/send`);
  return response.data;
};

// ============================================================
// Templates
// ============================================================

export const getSMSTemplates = async (): Promise<{ templates: SMSMessageTemplate[] }> => {
  const response = await api.get('/sms-marketing/templates');
  return response.data;
};

export const createSMSTemplate = async (data: {
  name: string;
  category: string;
  template_text: string;
  variables?: string[];
}) => {
  const response = await api.post('/sms-marketing/templates', data);
  return response.data;
};

export const deleteSMSTemplate = async (templateId: string) => {
  const response = await api.delete(`/sms-marketing/templates/${templateId}`);
  return response.data;
};

// ============================================================
// Analytics
// ============================================================

export const getSMSMessageLogs = async (): Promise<{ logs: SMSMessageLog[] }> => {
  const response = await api.get('/sms-marketing/logs');
  return response.data;
};

export const getSMSStats = async (): Promise<{ stats: SMSStats }> => {
  const response = await api.get('/sms-marketing/stats');
  return response.data;
};
