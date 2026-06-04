import { apiClient } from './apiClient';

export interface BuildingContact {
  id: string;
  owner_name?: string;
  mobile_number: string;
  building_name?: string;
  area?: string;
  notes?: string;
  broker_id: string;
  broker_name?: string;
  broker_city?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBuildingContactRequest {
  owner_name?: string;
  mobile_number: string;
  building_name?: string;
  area?: string;
  notes?: string;
}

export interface UpdateBuildingContactRequest {
  owner_name?: string;
  mobile_number?: string;
  building_name?: string;
  area?: string;
  notes?: string;
}

export interface BuildingContactsResponse {
  message: string;
  data: BuildingContact[];
}

export interface BuildingContactResponse {
  message: string;
  data: BuildingContact;
}

export const buildingApi = {
  getContacts: (filters?: { area?: string; building?: string }): Promise<BuildingContactsResponse> => {
    const params = new URLSearchParams();
    if (filters?.area) params.set('area', filters.area);
    if (filters?.building) params.set('building', filters.building);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.request(`/building-contacts${query}`);
  },

  getContact: (id: string): Promise<BuildingContactResponse> =>
    apiClient.request(`/building-contacts/${id}`),

  createContact: (data: CreateBuildingContactRequest): Promise<BuildingContactResponse> =>
    apiClient.request('/building-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateContact: (id: string, data: UpdateBuildingContactRequest): Promise<BuildingContactResponse> =>
    apiClient.request(`/building-contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteContact: (id: string): Promise<{ message: string }> =>
    apiClient.request(`/building-contacts/${id}`, { method: 'DELETE' }),

  // Excel upload functionality
  uploadExcel: (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.request('/upload/building-contacts-excel', {
      method: 'POST',
      body: formData,
    });
  },
};
