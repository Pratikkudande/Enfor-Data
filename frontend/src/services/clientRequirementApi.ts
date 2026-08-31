import { api } from './apiClient';

export interface ClientRequirement {
  id: string;
  client_id: string;
  requirement_type: 'buy' | 'rent';
  buildup_area?: number;
  carpet_area?: number;
  measurement_unit?: 'sq_foot' | 'sq_meter' | 'acre' | 'guntha';
  min_budget?: number;
  max_budget?: number;
  deposit_budget?: number;
  preferred_location?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  enquiry?: string;
  notes?: string;
  status: 'active' | 'fulfilled' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_phone?: string;
}

export interface CreateClientRequirementRequest {
  client_id: string;
  requirement_type: 'buy' | 'rent';
  buildup_area?: number;
  carpet_area?: number;
  measurement_unit?: 'sq_foot' | 'sq_meter' | 'acre' | 'guntha';
  min_budget?: number;
  max_budget?: number;
  deposit_budget?: number;
  preferred_location?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  enquiry?: string;
  notes?: string;
  status: 'active' | 'fulfilled' | 'cancelled';
}

export const clientRequirementApi = {
  // Get all requirements for the broker
  getRequirements: async (): Promise<{ requirements: ClientRequirement[] }> => {
    const response = await api.get<{ requirements: ClientRequirement[] }>('/client-requirements');
    return response;
  },

  // Get a single requirement by ID
  getRequirement: async (id: string): Promise<{ requirement: ClientRequirement }> => {
    const response = await api.get<{ requirement: ClientRequirement }>(`/client-requirements/${id}`);
    return response;
  },

  // Get requirements for a specific client
  getRequirementsByClient: async (clientId: string): Promise<{ requirements: ClientRequirement[] }> => {
    const response = await api.get<{ requirements: ClientRequirement[] }>(`/client-requirements/client/${clientId}`);
    return response;
  },

  // Create a new requirement
  createRequirement: async (data: CreateClientRequirementRequest): Promise<{ data: ClientRequirement }> => {
    const response = await api.post('/client-requirements', data);
    return response;
  },

  // Update a requirement
  updateRequirement: async (id: string, data: Partial<CreateClientRequirementRequest>): Promise<{ data: ClientRequirement }> => {
    const response = await api.put(`/client-requirements/${id}`, data);
    return response;
  },

  // Delete a requirement
  deleteRequirement: async (id: string): Promise<void> => {
    await api.delete(`/client-requirements/${id}`);
  },
};
