import { apiClient } from './apiClient';

export interface ExternalBroker {
  id: string;
  name: string;
  mobile_number: string;
  area?: string;
  location?: string;
  notes?: string;
  added_by: string;
  added_by_name?: string;
  added_by_city?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExternalBrokerRequest {
  name: string;
  mobile_number: string;
  area?: string;
  location?: string;
  notes?: string;
}

export interface UpdateExternalBrokerRequest {
  name?: string;
  mobile_number?: string;
  area?: string;
  location?: string;
  notes?: string;
}

interface ListResponse { message: string; data: ExternalBroker[]; }
interface SingleResponse { message: string; data: ExternalBroker; }

export const externalBrokerApi = {
  getAll: (filters?: { area?: string; location?: string }): Promise<ListResponse> => {
    const p = new URLSearchParams();
    if (filters?.area)     p.set('area', filters.area);
    if (filters?.location) p.set('location', filters.location);
    const q = p.toString() ? `?${p.toString()}` : '';
    return apiClient.request(`/external-brokers${q}`);
  },

  create: (data: CreateExternalBrokerRequest): Promise<SingleResponse> =>
    apiClient.request('/external-brokers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: UpdateExternalBrokerRequest): Promise<SingleResponse> =>
    apiClient.request(`/external-brokers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient.request(`/external-brokers/${id}`, { method: 'DELETE' }),
};
