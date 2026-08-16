import { api } from './apiClient';
import { SMSDLTTemplate } from './smsMarketingApi';

// Admin API for DLT Template Management

export const adminGetAllDLTTemplates = async (): Promise<{ templates: SMSDLTTemplate[]; total: number }> => {
  const response = await api.get<{ message: string; data: { templates: SMSDLTTemplate[]; total: number } }>('/admin/dlt-templates');
  return response.data || { templates: [], total: 0 };
};

export const adminGetDLTTemplate = async (templateId: string): Promise<{ template: SMSDLTTemplate }> => {
  const response = await api.get<{ message: string; data: { template: SMSDLTTemplate } }>(`/admin/dlt-templates/${templateId}`);
  return response.data || { template: {} as SMSDLTTemplate };
};

export const adminUpdateDLTTemplate = async (templateId: string, data: {
  header: string;
  template_id?: string;
  template_name: string;
  template_type: string;
  category: string;
  provider?: string;
  template_content: string;
  sample_content?: string;
  status: string;
  variable_count: number;
}) => {
  const response = await api.put(`/admin/dlt-templates/${templateId}`, data);
  return response;
};

export const adminDeleteDLTTemplate = async (templateId: string) => {
  const response = await api.delete(`/admin/dlt-templates/${templateId}`);
  return response;
};

// SMS Headers Admin API
export const adminGetAllSMSHeaders = async (): Promise<{ headers: any[]; total: number }> => {
  const response = await api.get<{ message: string; data: { headers: any[]; total: number } }>('/admin/sms-headers');
  return response.data || { headers: [], total: 0 };
};

export const adminGetSMSHeader = async (headerId: string): Promise<{ header: any }> => {
  const response = await api.get<{ message: string; data: { header: any } }>(`/admin/sms-headers/${headerId}`);
  return response.data || { header: {} };
};

export const adminCreateSMSHeader = async (data: {
  header: string;
  provider?: string;
  type: string;
  status: string;
}) => {
  const response = await api.post('/admin/sms-headers', data);
  return response;
};

export const adminUpdateSMSHeader = async (headerId: string, data: {
  header: string;
  provider?: string;
  type: string;
  status: string;
}) => {
  const response = await api.put(`/admin/sms-headers/${headerId}`, data);
  return response;
};

export const adminDeleteSMSHeader = async (headerId: string) => {
  const response = await api.delete(`/admin/sms-headers/${headerId}`);
  return response;
};
