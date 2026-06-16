import { apiClient } from './apiClient';
import { ApiResponse } from '../types';
import {
  BrokerProfile, ConnectionRequest, Connection,
  Conversation, Message
} from '../pages/Network/types';

const BASE = '/network';

// Channel partner the broker can discover & follow
export interface ChannelPartnerProfile {
  id: string;
  name: string;
  city: string;
  state: string;
  firm_name: string;
  profile_image?: string | null;
  years_experience?: number;
  deals_completed?: number;
  specializations?: string[];
  projects_count?: number;
  whatsapp_number?: string;
  location?: string;
  is_following: boolean;
}

// Broker who follows a channel partner
export interface FollowerProfile {
  id: string;
  name: string;
  city: string;
  state: string;
  firm_name: string;
  profile_image?: string | null;
  whatsapp_number?: string;
  location?: string;
  properties_count?: number;
  followed_at: string;
}

export const networkApi = {
  // Discovery
  getBrokers: () =>
    apiClient.request<ApiResponse<BrokerProfile[]>>(`${BASE}/brokers`),

  // ── Channel Partner follows ──
  getChannelPartners: () =>
    apiClient.request<ApiResponse<ChannelPartnerProfile[]>>(`${BASE}/channel-partners`),

  followPartner: (partnerId: string) =>
    apiClient.request<ApiResponse<null>>(`${BASE}/channel-partners/${partnerId}/follow`, { method: 'POST' }),

  unfollowPartner: (partnerId: string) =>
    apiClient.request<ApiResponse<null>>(`${BASE}/channel-partners/${partnerId}/follow`, { method: 'DELETE' }),

  getFollowers: () =>
    apiClient.request<ApiResponse<FollowerProfile[]>>(`${BASE}/followers`),

  // Lightweight connection status for a single broker (used by property cards)
  getConnectionStatus: (brokerId: string) =>
    apiClient.request<ApiResponse<{ connection_status: 'none' | 'pending' | 'connected' | null; request_id: string | null; sender_id: string | null }>>(
      `${BASE}/brokers/${brokerId}/connection-status`
    ),

  // Connections
  sendRequest: (receiverId: string) =>
    apiClient.request<ApiResponse<ConnectionRequest>>(`${BASE}/connect/send`, {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId }),
    }),

  respondRequest: (requestId: string, action: 'accept' | 'reject') =>
    apiClient.request<ApiResponse<null>>(`${BASE}/connect/respond`, {
      method: 'POST',
      body: JSON.stringify({ request_id: requestId, action }),
    }),

  getConnections: () =>
    apiClient.request<ApiResponse<Connection[]>>(`${BASE}/connections`),

  getPendingRequests: () =>
    apiClient.request<ApiResponse<ConnectionRequest[]>>(`${BASE}/requests`),

  getSentRequests: () =>
    apiClient.request<ApiResponse<ConnectionRequest[]>>(`${BASE}/requests/sent`),

  // Messaging
  ensureConversation: (peerId: string) =>
    apiClient.request<ApiResponse<Conversation>>(`${BASE}/conversations/ensure`, {
      method: 'POST',
      body: JSON.stringify({ peer_id: peerId }),
    }),

  getConversations: () =>
    apiClient.request<ApiResponse<Conversation[]>>(`${BASE}/conversations`),

  getMessages: (convId: string, limit = 50, offset = 0) =>
    apiClient.request<ApiResponse<Message[]>>(
      `${BASE}/conversations/${convId}/messages?limit=${limit}&offset=${offset}`
    ),

  sendMessage: (convId: string, body: string) =>
    apiClient.request<ApiResponse<Message>>(`${BASE}/conversations/${convId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
};
