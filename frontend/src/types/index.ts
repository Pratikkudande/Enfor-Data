export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'broker' | 'channel_partner' | 'admin';
  city: string;
  state: string;
  company_name?: string;
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
  images: string[];
  status: 'available' | 'sold' | 'rented' | 'under_negotiation';
  owner_id: string;
  broker_id: string;
  client_id?: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'buyer' | 'seller' | 'tenant' | 'owner';
  budget_min?: number;
  budget_max?: number;
  preferred_location: string;
  requirements: string;
  status: 'active' | 'converted' | 'inactive';
  broker_id: string;
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
  property_id?: string;
  broker_id: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'site_visit' | 'meeting' | 'call';
  created_at: string;
  updated_at: string;
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
  city: string;
  state: string;
  project_type: 'residential' | 'commercial' | 'mixed';
  total_units: number;
  available_units: number;
  price_range_min: number;
  price_range_max: number;
  amenities: string[];
  description: string;
  images: string[];
  brochure_url?: string;
  channel_partner_id: string;
  launch_date: string;
  possession_date: string;
  status: 'upcoming' | 'launched' | 'under_construction' | 'ready';
  created_at: string;
  updated_at: string;
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
