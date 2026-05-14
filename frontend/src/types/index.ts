export interface User {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone: string;
  role: 'broker' | 'channel_partner' | 'admin';
  city: string;
  state: string;
  company_name?: string;
  firm_name?: string;
  profile_image?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
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
  images?: string[];
  status: 'available' | 'sold' | 'rented' | 'under_negotiation';
  owner_id?: string;
  broker_id: string;
  broker_name?: string;
  broker_city?: string;
  broker_whatsapp?: string;
  broker_email?: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: 'buyer' | 'seller' | 'tenant' | 'owner' | 'list_property_for_rent';
  status: 'active' | 'converted' | 'inactive';
  budget_min?: number;
  budget_max?: number;
  expected_amount?: number;
  preferred_location: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  requirements: string;
  notes?: string;
  broker_id: string;
  broker_name?: string;
  broker_city?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  client_id: string;
  client_name?: string;
  client_phone?: string;
  property_id?: string;
  property_title?: string;
  property_address?: string;
  broker_id: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'site_visit' | 'meeting' | 'call';
  created_at: string;
  updated_at: string;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today: number;
  upcoming: number;
}

export interface Agreement {
  id: string;
  property_id: string;
  property_title?: string;
  property_address?: string;
  client_id?: string;
  client_name?: string;
  broker_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface CreateAgreementRequest {
  property_id: string;
  client_id?: string;
  start_date: string;
  end_date: string;
}

export interface WhatsAppMessage {
  id: string;
  recipient_type: 'individual' | 'bulk';
  recipient_ids: string[];
  message: string;
  type: 'marketing' | 'acknowledgment' | 'appointment' | 'general';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sender_id: string;
  sent_at: string;
}

export interface BrokerNetwork {
  id: string;
  broker_id: string;
  connected_broker_id: string;
  city: string;
  state: string;
  connection_status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  builder_name: string;
  location: string;
  address: string;
  city: string;
  state: string;
  project_type: 'residential' | 'commercial' | 'mixed';
  description: string;
  total_units: number;
  available_units: number;
  price_range_min: number;
  price_range_max: number;
  amenities: string[];
  brochure_url?: string;
  channel_partner_id: string;
  partner_name?: string;
  partner_firm?: string;
  launch_date: string;
  possession_date: string;
  status: 'upcoming' | 'launched' | 'under_construction' | 'ready' | 'sold_out';
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  builder_name: string;
  project_type: 'residential' | 'commercial' | 'mixed';
  description: string;
  location: string;
  address: string;
  city: string;
  state: string;
  total_units: number;
  available_units: number;
  price_range_min: number;
  price_range_max: number;
  amenities: string[];
  launch_date: string;
  possession_date: string;
  status: 'upcoming' | 'launched' | 'under_construction' | 'ready' | 'sold_out';
  brochure_url?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  builder_name?: string;
  project_type?: 'residential' | 'commercial' | 'mixed';
  description?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  total_units?: number;
  available_units?: number;
  price_range_min?: number;
  price_range_max?: number;
  amenities?: string[];
  launch_date?: string;
  possession_date?: string;
  status?: 'upcoming' | 'launched' | 'under_construction' | 'ready' | 'sold_out';
  brochure_url?: string;
}

export interface BusinessPost {
  id: string;
  title: string;
  category: 'property' | 'furniture' | 'staff';
  subcategory: 'sale' | 'rent' | 'requirement';
  description: string;
  price?: number;
  images: string[];
  location: string;
  contact_info: {
    name: string;
    phone: string;
    email?: string;
  };
  user_id: string;
  status: 'active' | 'sold' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalProperties: number;
  totalClients: number;
  totalAppointments: number;
  whatsappMessagesCount: number;
  remainingMessages: number;
  // Number of active properties across the system (not scoped to the user)
  activeProperties?: number;
  // Number of clients added by the current user/broker
  userClientsCount?: number;
  // Number of today's appointments for the current user/broker
  todaysAppointments?: number;
  clientsByType: {
    buyers: number;
    sellers: number;
    tenants: number;
    owners: number;
  };
  propertiesByStatus: {
    available: number;
    sold: number;
    rented: number;
    under_negotiation: number;
  };
}

// --- API Request/Response Interfaces ---

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
  refresh_token: string;
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

export interface CreateClientRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  type: 'buyer' | 'seller' | 'tenant' | 'owner' | 'list_property_for_rent';
  preferred_location: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  requirements: string;
  budget_min?: number;
  budget_max?: number;
  expected_amount?: number;
  notes?: string;
}

export interface UpdateClientRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  type?: 'buyer' | 'seller' | 'tenant' | 'owner' | 'list_property_for_rent';
  status?: 'active' | 'converted' | 'inactive';
  preferred_location?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  requirements?: string;
  budget_min?: number;
  budget_max?: number;
  expected_amount?: number;
  notes?: string;
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
