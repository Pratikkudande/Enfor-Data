import { apiClient } from './apiClient';

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location: string;
  city: string;
  state: string;
  postal_code: string;
  broker_id: string;
  created_at: string;
  updated_at: string;
}

export const clientApi = {
  getClients: async (): Promise<{ clients: Client[] }> => {
    const response: any = await apiClient.request('/clients');
    // Backend returns { data: [...] }, we need to transform to { clients: [...] }
    return { clients: response.data || [] };
  },

  getClient: async (id: string): Promise<{ client: Client }> => {
    const response: any = await apiClient.request(`/clients/${id}`);
    return { client: response.data };
  },

  createClient: async (data: Partial<Client>): Promise<{ data: Client }> => {
    return apiClient.request('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateClient: async (id: string, data: Partial<Client>): Promise<{ data: Client }> => {
    return apiClient.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteClient: async (id: string): Promise<void> => {
    return apiClient.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  },
};
