import { apiClient } from './apiClient';
import { ApiResponse } from '../types';
import {
  BrokerProfile, ConnectionRequest, Connection,
  Conversation, Message
} from '../pages/Network/types';

const BASE = '/network';

export const networkApi = {
  // Discovery
  getBrokers: () =>
    apiClient.request<ApiResponse<BrokerProfile[]>>(`${BASE}/brokers`),

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
