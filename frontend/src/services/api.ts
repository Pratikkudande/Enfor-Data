// API configuration and HTTP client
const API_BASE_URL = 'http://localhost:8080/api';

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface SignupRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  date_of_birth: string;
  firm_name: string;
  role: string;
  whatsapp_number: string;
  alternative_number?: string;
  foreign_number?: string;
  address: string;
  location: string;
  city: string;
  state: string;
  postal_code: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    firm_name: string;
    city: string;
    state: string;
    is_verified: boolean;
    created_at: string;
  };
}

export interface CreatePropertyRequest {
  title: string;
  type: 'apartment' | 'house' | 'commercial' | 'plot';
  listing_type: 'sale' | 'rent';
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: string;
  address: string;
  city: string;
  state: string;
  description: string;
  amenities: string[];
  client_id?: string;
}

export interface UpdatePropertyRequest {
  title?: string;
  type?: 'apartment' | 'house' | 'commercial' | 'plot';
  listing_type?: 'sale' | 'rent';
  price?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  description?: string;
  amenities?: string[];
  client_id?: string;
  status?: 'available' | 'sold' | 'rented' | 'under_negotiation';
}

export interface Property {
  id: string;
  title: string;
  type: 'apartment' | 'house' | 'commercial' | 'plot';
  listing_type: 'sale' | 'rent';
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: string;
  address: string;
  city: string;
  state: string;
  description: string;
  amenities: string[];
  status: 'available' | 'sold' | 'rented' | 'under_negotiation';
  broker_id: string;
  broker_name?: string;
  broker_city?: string;
  client_id?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: 'buyer' | 'seller' | 'tenant' | 'owner';
  status: 'active' | 'converted' | 'inactive';
  budget_min?: number;
  budget_max?: number;
  preferred_location: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  requirements: string;
  notes?: string;
  broker_id: string;
  broker_name?: string;
  broker_city?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateClientRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: 'buyer' | 'seller' | 'tenant' | 'owner';
  preferred_location: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  requirements: string;
  budget_min?: number;
  budget_max?: number;
  notes?: string;
}

export interface UpdateClientRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  type?: 'buyer' | 'seller' | 'tenant' | 'owner';
  status?: 'active' | 'converted' | 'inactive';
  preferred_location?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  requirements?: string;
  budget_min?: number;
  budget_max?: number;
  notes?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('enfor_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Parse validation errors from backend
        let errorMessage = data.error || 'Request failed';
        
        if (data.message) {
          // Show detailed validation error
          errorMessage = `${errorMessage}: ${data.message}`;
        }
        
        // Show alert with detailed error
        alert(`❌ Error: ${errorMessage}`);
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // If it's a network error (not our custom error)
      if (error instanceof TypeError) {
        const networkError = 'Network error: Unable to connect to server. Please check if the backend is running.';
        alert(`❌ ${networkError}`);
        throw new Error(networkError);
      }
      
      throw error;
    }
  }

  // Auth endpoints
  async signup(userData: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getMe(): Promise<ApiResponse<AuthResponse['user']>> {
    return this.request<AuthResponse['user']>('/auth/me');
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // File upload
  async uploadProfilePhoto(file: File): Promise<ApiResponse<{ profile_image: string }>> {
    const formData = new FormData();
    formData.append('profile_photo', file);

    return this.request<{ profile_image: string }>('/upload/profile-photo', {
      method: 'POST',
      headers: {}, // Don't set Content-Type for FormData
      body: formData,
    });
  }

  // Property endpoints
  async getProperties(): Promise<ApiResponse<Property[]>> {
    return this.request<Property[]>('/properties');
  }

  async createProperty(propertyData: CreatePropertyRequest): Promise<ApiResponse<Property>> {
    return this.request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async getProperty(id: string): Promise<ApiResponse<Property>> {
    return this.request<Property>(`/properties/${id}`);
  }

  async updateProperty(id: string, propertyData: UpdatePropertyRequest): Promise<ApiResponse<Property>> {
    return this.request<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async deleteProperty(id: string): Promise<ApiResponse> {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Client endpoints
  async getClients(): Promise<ApiResponse<Client[]>> {
    return this.request<Client[]>('/clients');
  }

  async createClient(clientData: CreateClientRequest): Promise<ApiResponse<Client>> {
    return this.request<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async getClient(id: string): Promise<ApiResponse<Client>> {
    return this.request<Client>(`/clients/${id}`);
  }

  async updateClient(id: string, clientData: UpdateClientRequest): Promise<ApiResponse<Client>> {
    return this.request<Client>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: string): Promise<ApiResponse> {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Appointment endpoints
  async getAppointments(): Promise<ApiResponse<Appointment[]>> {
    return this.request<Appointment[]>('/appointments');
  }

  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async getAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return this.request<Appointment>(`/appointments/${id}`);
  }

  async updateAppointment(id: string, appointmentData: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return this.request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(id: string): Promise<ApiResponse> {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  async getAppointmentStats(): Promise<ApiResponse<AppointmentStats>> {
    return this.request<AppointmentStats>('/appointments/stats');
  }
}

export interface Appointment {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'site_visit' | 'meeting' | 'call';
  client_id: string;
  client_name?: string;
  client_phone?: string;
  property_id?: string;
  property_title?: string;
  property_address?: string;
  broker_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentRequest {
  title: string;
  description?: string;
  date: string;
  time: string;
  type: 'site_visit' | 'meeting' | 'call';
  client_id: string;
  property_id?: string;
}

export interface UpdateAppointmentRequest {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  type?: 'site_visit' | 'meeting' | 'call';
  client_id?: string;
  property_id?: string;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today: number;
  upcoming: number;
}

export const apiClient = new ApiClient(API_BASE_URL);
