import { apiClient } from './apiClient';
import {
  ApiResponse,
  SignupRequest,
  LoginRequest,
  AuthResponse,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  Property,
  CreateClientRequest,
  UpdateClientRequest,
  Client,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  Appointment,
  AppointmentStats,
  Agreement,
  CreateAgreementRequest,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../types';

export * from '../types'; // Re-export types so we don't break existing imports relying on api.ts

class ApiService {
  // Auth endpoints
  async signup(userData: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.request<ApiResponse<AuthResponse>>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.request<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refresh(): Promise<ApiResponse<AuthResponse>> {
    const refreshToken = localStorage.getItem('enfor_refresh_token');
    return apiClient.request<ApiResponse<AuthResponse>>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipAuth: true,
    });
  }

  async getMe(): Promise<ApiResponse<AuthResponse['user']>> {
    return apiClient.request<ApiResponse<AuthResponse['user']>>('/auth/me');
  }

  async logout(): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>('/auth/logout', {
      method: 'POST',
    });
  }

  // File upload
  async uploadProfilePhoto(file: File): Promise<ApiResponse<{ profile_image: string }>> {
    return apiClient.upload('/upload/profile-photo', file, 'profile_photo');
  }

  // Bulk Excel uploads
  async uploadClientsExcel(file: File): Promise<ApiResponse> {
    return apiClient.upload('/upload/clients-excel', file, 'file');
  }

  async uploadPropertiesExcel(file: File): Promise<ApiResponse> {
    return apiClient.upload('/upload/properties-excel', file, 'file');
  }

  async uploadBuildingContactsExcel(file: File): Promise<ApiResponse> {
    return apiClient.upload('/upload/building-contacts-excel', file, 'file');
  }

  // Property endpoints
  async getAllProperties(): Promise<ApiResponse<Property[]>> {
    return apiClient.request<ApiResponse<Property[]>>('/properties/all');
  }

  async getProperties(): Promise<ApiResponse<Property[]>> {
    return apiClient.request<ApiResponse<Property[]>>('/properties');
  }

  async createProperty(propertyData: CreatePropertyRequest): Promise<ApiResponse<Property>> {
    return apiClient.request<ApiResponse<Property>>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    return apiClient.request<ApiResponse<Property>>(`/properties/view/${id}`);
  }

  async updateProperty(id: string, propertyData: UpdatePropertyRequest): Promise<ApiResponse<Property>> {
    return apiClient.request<ApiResponse<Property>>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async deleteProperty(id: string): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Client endpoints
  async getClients(): Promise<ApiResponse<Client[]>> {
    return apiClient.request<ApiResponse<Client[]>>('/clients');
  }

  async createClient(clientData: CreateClientRequest): Promise<ApiResponse<Client>> {
    return apiClient.request<ApiResponse<Client>>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async getClient(id: string): Promise<ApiResponse<Client>> {
    return apiClient.request<ApiResponse<Client>>(`/clients/${id}`);
  }

  async updateClient(id: string, clientData: UpdateClientRequest): Promise<ApiResponse<Client>> {
    return apiClient.request<ApiResponse<Client>>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: string): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment endpoints
  async getAppointments(): Promise<ApiResponse<Appointment[]>> {
    return apiClient.request<ApiResponse<Appointment[]>>('/appointments');
  }

  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return apiClient.request<ApiResponse<Appointment>>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return apiClient.request<ApiResponse<Appointment>>(`/appointments/${id}`);
  }

  async updateAppointment(id: string, appointmentData: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return apiClient.request<ApiResponse<Appointment>>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(id: string): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  async getAppointmentStats(): Promise<ApiResponse<AppointmentStats>> {
    return apiClient.request<ApiResponse<AppointmentStats>>('/appointments/stats');
  }

  // Agreement endpoints
  async getAgreements(): Promise<ApiResponse<Agreement[]>> {
    return apiClient.request<ApiResponse<Agreement[]>>('/agreements');
  }

  async createAgreement(data: CreateAgreementRequest): Promise<ApiResponse<Agreement>> {
    return apiClient.request<ApiResponse<Agreement>>('/agreements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAgreement(id: string): Promise<ApiResponse<Agreement>> {
    return apiClient.request<ApiResponse<Agreement>>(`/agreements/${id}`);
  }

  async updateAgreement(id: string, status: string): Promise<ApiResponse<Agreement>> {
    return apiClient.request<ApiResponse<Agreement>>(`/agreements/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteAgreement(id: string): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>(`/agreements/${id}`, {
      method: 'DELETE',
    });
  }

  // Project endpoints
  async getMyProjects(): Promise<ApiResponse<Project[]>> {
    return apiClient.request<ApiResponse<Project[]>>('/projects');
  }

  async getAllProjects(): Promise<ApiResponse<Project[]>> {
    return apiClient.request<ApiResponse<Project[]>>('/projects/all');
  }

  async createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return apiClient.request<ApiResponse<Project>>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return apiClient.request<ApiResponse<Project>>(`/projects/${id}`);
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    return apiClient.request<ApiResponse<Project>>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    return apiClient.request<ApiResponse>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

// Export a singleton instance that matches the original exported name
export const api = new ApiService();
// To maintain backward compatibility with old code relying on `apiClient` instance in api.ts
export const apiClientInstance = api; 
// Let's actually export it as `apiClient` to not break existing imports:
export { api as apiClient };
