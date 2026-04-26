import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, UserCheck, Bell, MessageSquare, Search,
  MapPin, Building, Phone, Send, Check, X, Wifi, WifiOff, Home, Bed, Bath, Square, ExternalLink, Star, Briefcase, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { networkApi } from '../../services/networkApi';
import { api } from '../../services/api';
import {
  BrokerProfile, ConnectionRequest, Connection,
  Conversation, Message, WsOutbound
} from './types';
import { ENV } from '../../config/env';
import { Property } from '../../types';
import PropertyViewModal from '../Properties/PropertyViewModal';

// ── helpers ───────────────────────────────────────────────────────────────────
const avatar = (name: string, img?: string | null) =>
  img ? (
    <img src={img} alt={name} className="w-full h-full object-cover rounded-full" />
  ) : (
    <span className="text-sm font-bold text-white">
      {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );

const AvatarCircle: React.FC<{ name: string; img?: string | null; size?: string }> = ({
  name, img, size = 'w-10 h-10'
}) => (
  <div className={`${size} rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0`}>
    {avatar(name, img)}
  </div>
);

// ── WebSocket hook ────────────────────────────────────────────────────────────
function useNetworkWS(token: string | null, onMessage: (msg: WsOutbound) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!token) return;
    const wsBase = ENV.API_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/network/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setOnline(true);
    ws.onclose = () => setOnline(false);
    ws.onerror = () => setOnline(false);
    ws.onmessage = (e) => {
      try { onMessage(JSON.parse(e.data)); } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [token]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { online, send };
}

// ── Main component ────────────────────────────────────────────────────────────
const BrokerNetworkView: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('enfor_token');
  const location = useLocation();
  const locationState = location.state as any;

  const [tab, setTab] = useState<'discover' | 'connections' | 'requests' | 'chat'>(
    locationState?.tab || 'discover'
  );

  // Discover
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  // Connections
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingIn, setPendingIn] = useState<ConnectionRequest[]>([]);
  const [pendingOut, setPendingOut] = useState<ConnectionRequest[]>([]);

  // Chat
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [propertyContext, setPropertyContext] = useState<any>(locationState?.propertyContext || null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [propertyReferences, setPropertyReferences] = useState<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load property references from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('property_references');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPropertyReferences(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Failed to parse property references:', e);
      }
    }
  }, []);

  // Save property references to localStorage
  const savePropertyReference = (messageId: string, propertyData: any) => {
    setPropertyReferences(prev => {
      const newRefs = new Map(prev);
      newRefs.set(messageId, propertyData);
      localStorage.setItem('property_references', JSON.stringify(Object.fromEntries(newRefs)));
      return newRefs;
    });
  };

  // WS
  const { online, send: wsSend } = useNetworkWS(token, (msg) => {
    if (msg.type === 'message') {
      if (activeConv?.id === msg.conversation_id) {
        setMessages(prev => [msg.payload, ...prev]);
        wsSend({ type: 'read', conversation_id: msg.conversation_id });
        
        // Check if this is a property reference message and load property data
        const match = msg.payload.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
        if (match) {
          const propertyId = match[1];
          // Load property data asynchronously
          api.getProperty(propertyId).then(propResponse => {
            if (propResponse.data) {
              savePropertyReference(msg.payload.id, propResponse.data);
            }
          }).catch(error => {
            console.error('Failed to load property:', propertyId, error);
          });
        }
      }
      setConversations(prev => prev.map(c =>
        c.id === msg.conversation_id
          ? { ...c, last_message_body: msg.payload.body.replace(/\[PROPERTY_REF:[^\]]+\]\s*/, ''), last_message_at: msg.payload.created_at, unread_count: activeConv?.id === msg.conversation_id ? 0 : c.unread_count + 1 }
          : c
      ));
    }
    if (msg.type === 'typing' && activeConv?.id === msg.conversation_id && msg.payload.user_id !== user?.id) {
      setTypingUser(msg.payload.user_id);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
    }
    if (msg.type === 'read' && activeConv?.id === msg.conversation_id) {
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    }
    if (msg.type === 'connection_request') {
      setPendingIn(prev => [msg.payload, ...prev]);
    }
  });

  // ── data loaders ─────────────────────────────────────────────────────────
  useEffect(() => { loadBrokers(); loadConnections(); loadRequests(); loadConversations(); }, []);

  // Handle navigation from property card
  const propertyRefSentRef = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (locationState?.conversationId && conversations.length > 0 && locationState?.propertyContext) {
      const conv = conversations.find(c => c.id === locationState.conversationId);
      
      if (conv) {
        openConversation(conv);
        setPropertyContext(locationState.propertyContext);
        // Pre-fill the message input
        setMsgInput("Hi! I'm interested in this property.");
      }
    }
  }, [locationState?.conversationId, conversations.length]);

  const loadBrokers = async () => {
    setLoadingBrokers(true);
    try { const r = await networkApi.getBrokers(); setBrokers(r.data || []); }
    catch { /* ignore */ } finally { setLoadingBrokers(false); }
  };

  const loadConnections = async () => {
    try { const r = await networkApi.getConnections(); setConnections(r.data || []); } catch { /* */ }
  };

  const loadRequests = async () => {
    try {
      const [inc, out] = await Promise.all([networkApi.getPendingRequests(), networkApi.getSentRequests()]);
      setPendingIn(inc.data || []);
      setPendingOut(out.data || []);
    } catch { /* */ }
  };

  const loadConversations = async () => {
    try { const r = await networkApi.getConversations(); setConversations(r.data || []); } catch { /* */ }
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setTab('chat');
    wsSend({ type: 'join', conversation_id: conv.id });
    try {
      const r = await networkApi.getMessages(conv.id);
      const msgs = r.data || [];
      setMessages(msgs);
      
      // Load property data for any property reference messages
      const propertyLoadPromises = msgs.map(async (msg) => {
        const match = msg.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
        if (match) {
          const propertyId = match[1];
          // Check if we already have this property data
          if (!propertyReferences.has(msg.id)) {
            try {
              const propResponse = await api.getProperty(propertyId);
              if (propResponse.data) {
                savePropertyReference(msg.id, propResponse.data);
              }
            } catch (error) {
              console.error('Failed to load property:', propertyId, error);
            }
          }
        }
      });
      
      // Wait for all properties to load
      await Promise.all(propertyLoadPromises);
      
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    } catch { /* */ }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── actions ───────────────────────────────────────────────────────────────
  const handleConnect = async (brokerId: string) => {
    try {
      await networkApi.sendRequest(brokerId);
      setBrokers(prev => prev.map(b => b.id === brokerId ? { ...b, connection_status: 'pending' } : b));
    } catch (e: any) { alert(e.message); }
  };

  const handleRespond = async (reqId: string, action: 'accept' | 'reject') => {
    try {
      await networkApi.respondRequest(reqId, action);
      setPendingIn(prev => prev.filter(r => r.id !== reqId));
      if (action === 'accept') { loadConnections(); loadConversations(); }
    } catch (e: any) { alert(e.message); }
  };

  const handleSendMessage = async () => {
    if (!activeConv || !msgInput.trim() || sendingMsg) return;
    const body = msgInput.trim();
    setMsgInput('');
    setSendingMsg(true);
    
    try {
      // If there's a property context, send it as a property reference
      if (propertyContext) {
        const propertyMessage = `[PROPERTY_REF:${propertyContext.id}] ${body}`;
        const response = await networkApi.sendMessage(activeConv.id, propertyMessage);
        
        // Store property data linked to this message
        if (response.data?.id) {
          savePropertyReference(response.data.id, propertyContext);
        }
        
        // Clear property context after sending
        setPropertyContext(null);
      } else {
        // Regular message
        await networkApi.sendMessage(activeConv.id, body);
      }
    } catch (e: any) { 
      alert(e.message); 
    } finally { 
      setSendingMsg(false); 
    }
  };

  const handleTyping = () => {
    if (activeConv) wsSend({ type: 'typing', conversation_id: activeConv.id });
  };

  // ── filtered brokers ──────────────────────────────────────────────────────
  const filteredBrokers = brokers.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.city.toLowerCase().includes(search.toLowerCase()) ||
    (b.firm_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);
  const pendingCount = pendingIn.length;

  // ── tab bar ───────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'discover', label: 'Discover', icon: Users },
    { id: 'connections', label: `Connections (${connections.length})`, icon: UserCheck },
    { id: 'requests', label: 'Requests', icon: Bell, badge: pendingCount },
    { id: 'chat', label: 'Messages', icon: MessageSquare, badge: totalUnread },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broker Network</h1>
          <p className="text-gray-500 text-sm mt-0.5">Connect and chat with brokers across India</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${online ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-200 px-4">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`relative flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
                {'badge' in t && t.badge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {t.badge > 9 ? '9+' : t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {/* ── DISCOVER ── */}
          {tab === 'discover' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text" placeholder="Search by name, city or firm..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {loadingBrokers ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredBrokers.map(broker => (
                    <div key={broker.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200">
                      {/* Header with gradient */}
                      <div className="h-16 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                      
                      <div className="px-4 pb-4 -mt-8">
                        {/* Avatar */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="relative">
                            <AvatarCircle name={broker.name} img={broker.profile_image} size="w-16 h-16" />
                            {broker.connection_status === 'connected' && (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* Rating placeholder */}
                          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-semibold text-amber-700">4.8</span>
                          </div>
                        </div>
                        
                        {/* Broker Info */}
                        <div className="mb-3">
                          <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{broker.name}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                            <Building className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{broker.firm_name}</span>
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            {broker.city}, {broker.state}
                          </p>
                        </div>
                        
                        {/* Specializations */}
                        {broker.specializations && broker.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {broker.specializations.slice(0, 2).map((spec, idx) => (
                              <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                {spec}
                              </span>
                            ))}
                            {broker.specializations.length > 2 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                                +{broker.specializations.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-3 py-3 border-y border-gray-100">
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                              <p className="text-lg font-bold text-gray-900">{broker.years_experience || 0}+</p>
                            </div>
                            <p className="text-xs text-gray-500">Years Exp.</p>
                          </div>
                          <div className="text-center border-x border-gray-100">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Home className="h-3.5 w-3.5 text-gray-400" />
                              <p className="text-lg font-bold text-gray-900">{broker.properties_count || 0}</p>
                            </div>
                            <p className="text-xs text-gray-500">Properties</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                              <p className="text-lg font-bold text-gray-900">{broker.deals_completed || 0}</p>
                            </div>
                            <p className="text-xs text-gray-500">Deals</p>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        {broker.connection_status === 'connected' ? (
                          <button
                            onClick={() => {
                              const conv = conversations.find(c => c.peer_id === broker.id);
                              if (conv) openConversation(conv);
                            }}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg py-2.5 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Message
                          </button>
                        ) : broker.connection_status === 'pending' ? (
                          <div className="w-full text-center bg-yellow-50 text-yellow-700 rounded-lg py-2.5 text-sm font-medium border border-yellow-200">
                            {broker.sender_id === user?.id ? 'Request Sent' : 'Respond to Request'}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(broker.id)}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg py-2.5 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
                          >
                            <Users className="h-4 w-4" />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredBrokers.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-500">No brokers found</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CONNECTIONS ── */}
          {tab === 'connections' && (
            <div className="space-y-3">
              {connections.length === 0 && (
                <div className="text-center py-8 text-gray-500">No connections yet. Discover brokers to connect.</div>
              )}
              {connections.map(conn => {
                const conv = conversations.find(c => c.peer_id === conn.peer_id);
                return (
                  <div key={conn.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <AvatarCircle name={conn.peer_name} img={conn.peer_image} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{conn.peer_name}</p>
                      <p className="text-xs text-gray-500">{conn.peer_firm} · {conn.peer_city}</p>
                    </div>
                    <button
                      onClick={() => conv && openConversation(conv)}
                      className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Chat
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── REQUESTS ── */}
          {tab === 'requests' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Incoming ({pendingIn.length})</h3>
                {pendingIn.length === 0 && <p className="text-sm text-gray-400">No pending requests</p>}
                {pendingIn.map(req => (
                  <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
                    <AvatarCircle name={req.sender_name || '?'} img={req.sender_image} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{req.sender_name}</p>
                      <p className="text-xs text-gray-500">{req.sender_firm} · {req.sender_city}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRespond(req.id, 'accept')}
                        className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleRespond(req.id, 'reject')}
                        className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Sent ({pendingOut.length})</h3>
                {pendingOut.length === 0 && <p className="text-sm text-gray-400">No sent requests</p>}
                {pendingOut.map(req => (
                  <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
                    <AvatarCircle name={req.receiver_name || '?'} img={null} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{req.receiver_name}</p>
                      <p className="text-xs text-gray-500">{req.receiver_firm} · {req.receiver_city}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>{req.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CHAT ── */}
          {tab === 'chat' && (
            <div className="flex gap-4 h-[520px]">
              {/* Conversation list */}
              <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-y-auto pr-3 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Conversations</p>
                {conversations.length === 0 && (
                  <p className="text-sm text-gray-400">No conversations yet. Accept a connection to start chatting.</p>
                )}
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      activeConv?.id === conv.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <AvatarCircle name={conv.peer_name} img={conv.peer_image} size="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{conv.peer_name}</p>
                      <p className="text-xs text-gray-400 truncate">{conv.last_message_body || 'No messages yet'}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Message area */}
              {activeConv ? (
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Chat header */}
                  <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-3">
                    <AvatarCircle name={activeConv.peer_name} img={activeConv.peer_image} size="w-8 h-8" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{activeConv.peer_name}</p>
                      {typingUser && <p className="text-xs text-blue-500 animate-pulse">typing...</p>}
                    </div>
                  </div>

                  {/* Messages (newest at bottom) */}
                  <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-2 px-1">
                    <div ref={messagesEndRef} />
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      
                      // Check if this is a property reference message
                      const propertyRefMatch = msg.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
                      const propertyData = propertyRefMatch ? propertyReferences.get(msg.id) : null;
                      
                      // Render as property card if we have property data
                      if (propertyRefMatch && propertyData) {
                        const displayText = msg.body.replace(/\[PROPERTY_REF:[^\]]+\]\s*/, '').trim();
                        
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[80%]">
                              <button
                                onClick={() => {
                                  setSelectedProperty(propertyData);
                                  setShowPropertyModal(true);
                                }}
                                className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 hover:shadow-lg transition-all duration-200 hover:border-blue-400 text-left group"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Property Image */}
                                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                    <img
                                      src={propertyData.images?.[0] || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'}
                                      alt={propertyData.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  
                                  {/* Property Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1">
                                      <Home className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                      <p className="text-xs font-semibold text-blue-900 uppercase">Property</p>
                                      <ExternalLink className="h-3.5 w-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                    </div>
                                    
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">
                                      {propertyData.title}
                                    </h4>
                                    
                                    <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{propertyData.location}</span>
                                    </p>
                                    
                                    {/* Property Specs */}
                                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                      {propertyData.bedrooms !== undefined && (
                                        <div className="flex items-center gap-0.5">
                                          <Bed className="h-3 w-3" />
                                          {propertyData.bedrooms}
                                        </div>
                                      )}
                                      {propertyData.bathrooms !== undefined && (
                                        <div className="flex items-center gap-0.5">
                                          <Bath className="h-3 w-3" />
                                          {propertyData.bathrooms}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-0.5">
                                        <Square className="h-3 w-3" />
                                        {propertyData.area} sq ft
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-bold text-blue-700">
                                        ₹{propertyData.price.toLocaleString()}
                                      </p>
                                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                                        {propertyData.listing_type === 'sale' ? 'Sale' : 'Rent'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {displayText && (
                                  <div className="mt-2 pt-2 border-t border-blue-200">
                                    <p className="text-sm text-gray-700">{displayText}</p>
                                  </div>
                                )}
                              </button>
                              <p className={`text-xs mt-1 ${isMe ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMe && msg.is_read && <span className="ml-1">✓✓</span>}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Regular message
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                            isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            <p className={`text-xs mt-0.5 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && msg.is_read && <span className="ml-1">✓✓</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Property Context Card - Above Input */}
                  {propertyContext && (
                    <div className="pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setShowPropertyModal(true)}
                        className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 hover:shadow-md transition-all duration-200 hover:border-blue-300 text-left group relative"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPropertyContext(null);
                            setMsgInput('');
                          }}
                          className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 bg-white rounded-full p-1 shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-start gap-3">
                          {/* Property Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                            <img
                              src={propertyContext.images?.[0] || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'}
                              alt={propertyContext.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Property Details */}
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-1 mb-1">
                              <Home className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Property Reference</p>
                            </div>
                            
                            <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
                              {propertyContext.title}
                            </h4>
                            
                            <p className="text-xs text-gray-600 flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{propertyContext.location}</span>
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-bold text-blue-700">
                                ₹{propertyContext.price.toLocaleString()}
                              </p>
                              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                                {propertyContext.listing_type === 'sale' ? 'Sale' : 'Rent'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 pt-2 border-t border-blue-200 text-center">
                          <p className="text-xs text-blue-600 font-medium">
                            Your message will reference this property
                          </p>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <input
                      type="text"
                      value={msgInput}
                      onChange={e => { setMsgInput(e.target.value); handleTyping(); }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!msgInput.trim() || sendingMsg}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Select a conversation</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Property Details Modal */}
      {showPropertyModal && (selectedProperty || propertyContext) && (
        <PropertyViewModal
          property={(selectedProperty || propertyContext) as Property}
          currentUserId={user?.id || ''}
          onClose={() => {
            setShowPropertyModal(false);
            setSelectedProperty(null);
          }}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
};

export default BrokerNetworkView;
