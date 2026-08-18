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

export interface SMSProviderInfo {
  provider: string;
  enabled: boolean;
  sender_id?: string;
  auth_key_set?: boolean;
  initialized?: boolean;
}

export interface SMSAccountResponse {
  connected: boolean;
  account: SMSAccount | null;
  provider: SMSProviderInfo;
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

export interface SMSDLTTemplate {
  id: string;
  user_id: string;
  created_by_name?: string;
  header: string;
  template_id?: string;
  template_name: string;
  template_type: 'Promotional' | 'Service';
  category: 'FOR_SALE' | 'FOR_RENT' | 'FOR_BUY' | 'LIST_FOR_RENT' | 'SERVICES';
  provider?: string;
  template_content: string;
  sample_content?: string;
  status: 'Registered' | 'Approved' | 'Active' | 'Inactive' | 'Rejected' | 'Created';
  variable_count: number;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDLTTemplateRequest {
  header: string;
  template_id?: string;
  template_name: string;
  template_type: 'Promotional' | 'Service';
  category: 'FOR_SALE' | 'FOR_RENT' | 'FOR_BUY' | 'LIST_FOR_RENT' | 'SERVICES';
  provider?: string;
  template_content: string;
  sample_content?: string;
  status: 'Registered' | 'Approved' | 'Active' | 'Inactive' | 'Rejected' | 'Created';
  variable_count: number;
}

export interface SendDLTMessageRequest {
  template_id: string;
  variable_values: Record<string, string>;
  client_ids: string[];
  building_contact_ids?: string[]; // Add building contact IDs support
  property_ids?: string[]; // Add property IDs support
}

// ============================================================
// SMS Headers
// ============================================================

export interface SMSHeader {
  id: string;
  user_id: string;
  created_by_name?: string;
  header: string;
  provider?: string;
  type: 'Promotional' | 'Service' | 'Implicit';
  status: 'Created' | 'Approved' | 'Active' | 'Inactive' | 'Rejected';
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at: string;
}

export interface CreateSMSHeaderRequest {
  header: string;
  provider?: string;
  type: 'Promotional' | 'Service' | 'Implicit';
  status: string;
}

export const getSMSHeaders = async (): Promise<{ headers: SMSHeader[] }> => {
  try {
    const response = await api.get<{ headers: SMSHeader[] }>('/sms-marketing/headers');
    // api.get returns the parsed response directly
    return response || { headers: [] };
  } catch (error) {
    console.error('getSMSHeaders error:', error);
    return { headers: [] };
  }
};

export const getSMSHeader = async (headerId: string): Promise<{ header: SMSHeader }> => {
  const response = await api.get<{ header: SMSHeader }>(`/sms-marketing/headers/${headerId}`);
  return response;
};

export const createSMSHeader = async (data: CreateSMSHeaderRequest) => {
  const response = await api.post('/sms-marketing/headers', data);
  return response;
};

export const updateSMSHeader = async (headerId: string, data: Partial<CreateSMSHeaderRequest>) => {
  const response = await api.put(`/sms-marketing/headers/${headerId}`, data);
  return response;
};

export const deleteSMSHeader = async (headerId: string) => {
  const response = await api.delete(`/sms-marketing/headers/${headerId}`);
  return response;
};

// Get available headers for dropdown by type (Promotional, Service, Implicit)
export const getAvailableHeadersByType = async (type: 'Promotional' | 'Service' | 'Implicit'): Promise<{ headers: SMSHeader[] }> => {
  try {
    const response = await api.get<{ headers: SMSHeader[] }>(`/sms-marketing/headers/available/${type}`);
    return response || { headers: [] };
  } catch (error) {
    console.error('getAvailableHeadersByType error:', error);
    return { headers: [] };
  }
};

// ============================================================
// Account Management
// ============================================================

export const getSMSAccount = async (): Promise<SMSAccountResponse> => {
  const response = await api.get<SMSAccountResponse>('/sms-marketing/account');
  // api.get already returns the parsed data directly
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

// ============================================================
// DLT Templates (Regulatory Compliance)
// ============================================================

export const getDLTTemplates = async (): Promise<{ templates: SMSDLTTemplate[] }> => {
  try {
    const response = await api.get<{ templates: SMSDLTTemplate[] }>('/sms-marketing/dlt-templates');
    // api.get returns the parsed response directly
    return response;
  } catch (error) {
    console.error('getDLTTemplates error:', error);
    // Return empty array on error
    return { templates: [] };
  }
};

// Get available templates (active/approved) created by admin or the broker - for Send Message tab
export const getAvailableDLTTemplates = async (): Promise<{ templates: SMSDLTTemplate[] }> => {
  try {
    const response = await api.get<{ templates: SMSDLTTemplate[] }>('/sms-marketing/dlt-templates/available');
    // api.get returns the parsed response directly
    return response;
  } catch (error) {
    console.error('getAvailableDLTTemplates error:', error);
    // Return empty array on error
    return { templates: [] };
  }
};

export const createDLTTemplate = async (data: CreateDLTTemplateRequest) => {
  const response = await api.post('/sms-marketing/dlt-templates', data);
  return response;
};

export const getDLTTemplate = async (templateId: string): Promise<{ template: SMSDLTTemplate }> => {
  const response = await api.get<{ template: SMSDLTTemplate }>(`/sms-marketing/dlt-templates/${templateId}`);
  return response;
};

export const updateDLTTemplate = async (templateId: string, data: Partial<CreateDLTTemplateRequest>) => {
  const response = await api.put(`/sms-marketing/dlt-templates/${templateId}`, data);
  return response;
};

export const deleteDLTTemplate = async (templateId: string) => {
  const response = await api.delete(`/sms-marketing/dlt-templates/${templateId}`);
  return response;
};

export const sendDLTMessage = async (data: SendDLTMessageRequest) => {
  const response = await api.post('/sms-marketing/send-dlt', data);
  return response;
};
