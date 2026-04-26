export interface BrokerProfile {
  id: string;
  name: string;
  city: string;
  state: string;
  firm_name: string;
  profile_image?: string | null;
  connection_status: 'none' | 'pending' | 'connected' | null;
  request_id?: string | null;
  sender_id?: string | null;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender_name?: string;
  sender_city?: string;
  sender_firm?: string;
  sender_image?: string | null;
  receiver_name?: string;
  receiver_city?: string;
  receiver_firm?: string;
}

export interface Connection {
  id: string;
  broker_a: string;
  broker_b: string;
  created_at: string;
  peer_id: string;
  peer_name: string;
  peer_city: string;
  peer_firm: string;
  peer_image?: string | null;
}

export interface Conversation {
  id: string;
  broker_a: string;
  broker_b: string;
  last_message_at: string;
  created_at: string;
  peer_id: string;
  peer_name: string;
  peer_image?: string | null;
  last_message_body?: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_image?: string | null;
}

export type WsOutbound =
  | { type: 'message'; conversation_id: string; payload: Message; timestamp: string }
  | { type: 'typing'; conversation_id: string; payload: { user_id: string }; timestamp: string }
  | { type: 'read'; conversation_id: string; payload: { reader_id: string }; timestamp: string }
  | { type: 'connection_request'; payload: ConnectionRequest; timestamp: string }
  | { type: 'error'; error: string; timestamp: string };
