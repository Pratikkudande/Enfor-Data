import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, UserCheck, Bell, MessageSquare, Search,
  MapPin, Phone, Send, Check, X, Wifi, WifiOff, Home, Bed, Bath, Square, ExternalLink,
  Briefcase, TrendingUp, UserX, Plus, Edit2, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { networkApi } from '../../services/networkApi';
import { externalBrokerApi, ExternalBroker, CreateExternalBrokerRequest } from '../../services/externalBrokerApi';
import { api } from '../../services/api';
import {
  BrokerProfile, ConnectionRequest, Connection,
  Conversation, Message, WsOutbound
} from './types';
import { ENV } from '../../config/env';
import { Property } from '../../types';
import PropertyViewModal from '../Properties/PropertyViewModal';
import { getPropertyImageUrl } from '../Properties/PropertyCard';

// ── helpers ───────────────────────────────────────────────────────────────────

// Profile images are stored as relative paths (/uploads/file.jpg).
// Resolve them against the API base URL so the browser loads from the backend.
const resolveImgUrl = (img?: string | null): string | null => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${ENV.API_URL}${img}`;
};

const avatar = (name: string, img?: string | null) => {
  const src = resolveImgUrl(img);
  return src ? (
    <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
  ) : (
    <span className="text-sm font-bold text-white">
      {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </span>
  );
};

const AvatarCircle: React.FC<{ name: string; img?: string | null; size?: string }> = ({
  name, img, size = 'w-10 h-10'
}) => (
  <div className={`${size} rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0`}>
    {avatar(name, img)}
  </div>
);

// ── WebSocket hook — reconnects automatically with exponential back-off ───────
function useNetworkWS(
  token: string | null,
  onMessage: (msg: WsOutbound) => void,
) {
  const wsRef        = useRef<WebSocket | null>(null);
  const [online, setOnline] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0); // bumped on every successful open
  const mountedRef   = useRef(true);
  const delayRef     = useRef(1000); // ms, doubles on each failure (capped 30 s)
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always call the latest onMessage without recreating the WS
  const onMsgRef     = useRef(onMessage);
  useEffect(() => { onMsgRef.current = onMessage; });

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return;
    // Don't stack connections
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    const wsBase = ENV.API_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/network/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setOnline(true);
      delayRef.current = 1000; // reset back-off on success
      setReconnectCount(c => c + 1);
    };

    ws.onclose = (e) => {
      if (!mountedRef.current) return;
      setOnline(false);
      // Normal close (1000 / 1001) → don't reconnect
      if (e.code !== 1000 && e.code !== 1001) {
        timerRef.current = setTimeout(() => {
          delayRef.current = Math.min(delayRef.current * 2, 30_000);
          connect();
        }, delayRef.current);
      }
    };

    ws.onerror = () => { ws.close(); };

    ws.onmessage = (e) => {
      try { onMsgRef.current(JSON.parse(e.data) as WsOutbound); } catch { /* ignore parse errors */ }
    };
  }, [token]); // only recreate when token changes

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close(1000, 'unmount');
    };
  }, [connect]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { online, send, reconnectCount };
}

// ── Main component ────────────────────────────────────────────────────────────
const BrokerNetworkView: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('enfor_token');
  const location = useLocation();
  const locationState = location.state as any;

  const [tab, setTab] = useState<'discover' | 'connections' | 'requests' | 'chat' | 'external'>(
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
  const isSendingRef = useRef(false); // guard against double-send without blocking re-renders
  const [propertyContext, setPropertyContext] = useState<any>(locationState?.propertyContext || null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [propertyReferences, setPropertyReferences] = useState<Map<string, any>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── External Brokers state ────────────────────────────────────────────────
  const [extBrokers, setExtBrokers] = useState<ExternalBroker[]>([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extSearch, setExtSearch] = useState('');
  const [showExtModal, setShowExtModal] = useState(false);
  const [editingExtId, setEditingExtId] = useState<string | null>(null);
  const [extViewOnly, setExtViewOnly] = useState(false);
  const [deletingExtId, setDeletingExtId] = useState<string | null>(null);
  const [extSubmitting, setExtSubmitting] = useState(false);
  const [extFormError, setExtFormError] = useState<string | null>(null);
  const [extSuccess, setExtSuccess] = useState<string | null>(null);
  const [extError, setExtError] = useState<string | null>(null);
  const emptyExtForm = { name: '', mobile_number: '', area: '', location: '', notes: '' };
  const [extForm, setExtForm] = useState(emptyExtForm);

  const showExtSuccess = (msg: string) => { setExtSuccess(msg); window.setTimeout(() => setExtSuccess(null), 4000); };
  const showExtError   = (msg: string) => { setExtError(msg);   window.setTimeout(() => setExtError(null),   5000); };

  const loadExtBrokers = async () => {
    setExtLoading(true);
    try { const r = await externalBrokerApi.getAll(); setExtBrokers(r.data || []); }
    catch { /* ignore */ } finally { setExtLoading(false); }
  };

  const openExtAdd = () => { setExtForm(emptyExtForm); setEditingExtId(null); setExtViewOnly(false); setExtFormError(null); setShowExtModal(true); };
  const openExtEdit = (b: ExternalBroker) => {
    setExtForm({ name: b.name, mobile_number: b.mobile_number, area: b.area ?? '', location: b.location ?? '', notes: b.notes ?? '' });
    setEditingExtId(b.id); setExtViewOnly(false); setExtFormError(null); setShowExtModal(true);
  };
  const openExtView = (b: ExternalBroker) => { openExtEdit(b); setExtViewOnly(true); };
  const closeExtModal = () => { setShowExtModal(false); setExtForm(emptyExtForm); setEditingExtId(null); setExtFormError(null); };

  const handleExtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtFormError(null);
    if (!extForm.mobile_number.trim()) { setExtFormError('Mobile number is required'); return; }
    if (!extForm.name.trim()) { setExtFormError('Name is required'); return; }
    setExtSubmitting(true);
    try {
      const payload: CreateExternalBrokerRequest = {
        name: extForm.name.trim(),
        mobile_number: extForm.mobile_number.trim(),
        area: extForm.area.trim() || undefined,
        location: extForm.location.trim() || undefined,
        notes: extForm.notes.trim() || undefined,
      };
      if (editingExtId) {
        const res = await externalBrokerApi.update(editingExtId, payload);
        setExtBrokers(prev => prev.map(b => b.id === editingExtId ? res.data : b));
        showExtSuccess('Broker updated successfully!');
      } else {
        const res = await externalBrokerApi.create(payload);
        setExtBrokers(prev => [res.data, ...prev]);
        showExtSuccess('Broker added successfully!');
      }
      closeExtModal();
    } catch (err) {
      setExtFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally { setExtSubmitting(false); }
  };

  const handleExtDelete = async (b: ExternalBroker) => {
    if (!window.confirm(`Delete external broker "${b.name}"?`)) return;
    setDeletingExtId(b.id);
    try {
      await externalBrokerApi.delete(b.id);
      setExtBrokers(prev => prev.filter(x => x.id !== b.id));
      showExtSuccess('Broker removed successfully!');
    } catch (err) { showExtError(err instanceof Error ? err.message : 'Failed to delete'); }
    finally { setDeletingExtId(null); }
  };

  const filteredExtBrokers = extBrokers.filter(b => {
    const t = extSearch.toLowerCase();
    return b.name.toLowerCase().includes(t) ||
      b.mobile_number.includes(t) ||
      (b.area?.toLowerCase().includes(t) ?? false) ||
      (b.location?.toLowerCase().includes(t) ?? false);
  });
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs for the values needed inside WS callbacks (avoids stale closures)
  const activeConvRef  = useRef<Conversation | null>(null);
  const wsSendRef      = useRef<(data: object) => void>(() => {});
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Load property references from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('property_references');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPropertyReferences(new Map(Object.entries(parsed)));
      } catch { /* ignore */ }
    }
  }, []);

  const savePropertyReference = (messageId: string, propertyData: any) => {
    setPropertyReferences(prev => {
      const next = new Map(prev);
      next.set(messageId, propertyData);
      localStorage.setItem('property_references', JSON.stringify(Object.fromEntries(next)));
      return next;
    });
  };

  // ── WS message handler ────────────────────────────────────────────────────
  const handleWsMessage = useCallback((msg: WsOutbound) => {
    if (msg.type === 'message') {
      const payload = msg.payload as Message;
      if (activeConvRef.current?.id === msg.conversation_id) {
        // Dedup: skip if we already have this message (optimistic send may have added it)
        setMessages(prev =>
          prev.some(m => m.id === payload.id) ? prev : [payload, ...prev]
        );
        wsSendRef.current({ type: 'read', conversation_id: msg.conversation_id });

        // Resolve property references in incoming messages
        const match = payload.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
        if (match) {
          const propertyId = match[1];
          api.getProperty(propertyId).then(r => {
            if (r.data) savePropertyReference(payload.id, r.data);
          }).catch(() => {});
        }
      }
      // Update conversation list preview + unread count
      setConversations(prev => prev.map(c =>
        c.id === msg.conversation_id
          ? {
              ...c,
              last_message_body: payload.body.replace(/\[PROPERTY_REF:[^\]]+\]\s*/, ''),
              last_message_at: payload.created_at,
              unread_count: activeConvRef.current?.id === msg.conversation_id
                ? 0
                : c.unread_count + 1,
            }
          : c
      ));
    }

    if (msg.type === 'typing' &&
        activeConvRef.current?.id === msg.conversation_id &&
        (msg.payload as any)?.user_id !== user?.id) {
      setTypingUser((msg.payload as any).user_id);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingUser(null), 2000);
    }

    if (msg.type === 'read' && activeConvRef.current?.id === msg.conversation_id) {
      setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
    }

    if (msg.type === 'connection_request') {
      const req = msg.payload as ConnectionRequest;
      setPendingIn(prev => [req, ...prev]);
      // Update discover tab: mark sender's card as "pending"
      setBrokers(prev => prev.map(b =>
        b.id === req.sender_id
          ? { ...b, connection_status: 'pending', sender_id: req.sender_id, request_id: req.id }
          : b
      ));
    }
  }, [user?.id]);

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const { online, send: wsSend, reconnectCount } = useNetworkWS(token, handleWsMessage);

  // Keep send ref in sync so WS callbacks can call it
  useEffect(() => { wsSendRef.current = wsSend; }, [wsSend]);

  // On reconnect: rejoin active conversation room and refresh conversations list
  useEffect(() => {
    if (reconnectCount === 0) return; // first open, not a reconnect
    if (activeConvRef.current) {
      wsSend({ type: 'join', conversation_id: activeConvRef.current.id });
    }
    loadConversations();
  }, [reconnectCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── data loaders ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadBrokers();
    loadConnections();
    loadRequests();
    loadConversations();
    loadExtBrokers();
  }, []);

  // Handle navigation from property card
  useEffect(() => {
    if (locationState?.conversationId && conversations.length > 0 && locationState?.propertyContext) {
      const conv = conversations.find(c => c.id === locationState.conversationId);
      if (conv) {
        openConversation(conv);
        setPropertyContext(locationState.propertyContext);
        setMsgInput("Hi! I'm interested in this property.");
      }
    }
  }, [locationState?.conversationId, conversations.length]); // eslint-disable-line react-hooks/exhaustive-deps

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
    try { const r = await networkApi.getConversations('broker'); setConversations(r.data || []); } catch { /* */ }
  };

  // Opens the conversation with a peer — gets or creates one if not yet in local state
  const openChatWith = async (peerId: string) => {
    let conv = conversations.find(c => c.peer_id === peerId);
    if (!conv) {
      try {
        const res = await networkApi.ensureConversation(peerId);
        conv = res.data;
        if (conv) setConversations(prev => [...prev, conv!]);
      } catch (e: any) {
        alert(e.message);
        return;
      }
    }
    if (conv) openConversation(conv);
  };

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setTab('chat');
    wsSend({ type: 'join', conversation_id: conv.id });
    try {
      const r = await networkApi.getMessages(conv.id);
      const msgs = r.data || [];
      setMessages(msgs);

      // Resolve property references
      await Promise.all(msgs.map(async (msg) => {
        const match = msg.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
        if (match && !propertyReferences.has(msg.id)) {
          try {
            const propR = await api.getProperty(match[1]);
            if (propR.data) savePropertyReference(msg.id, propR.data);
          } catch { /* */ }
        }
      }));

      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c));
    } catch { /* */ }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── actions ───────────────────────────────────────────────────────────────
  const handleConnect = async (brokerId: string) => {
    // Optimistic update: flip button instantly before the API responds
    setBrokers(prev => prev.map(b =>
      b.id === brokerId
        ? { ...b, connection_status: 'pending', sender_id: user?.id ?? '' }
        : b
    ));
    try {
      const res = await networkApi.sendRequest(brokerId);
      // Patch in the real request_id once we have it
      setBrokers(prev => prev.map(b =>
        b.id === brokerId ? { ...b, request_id: res.data?.id ?? '' } : b
      ));
    } catch (e: any) {
      // Revert on failure
      setBrokers(prev => prev.map(b =>
        b.id === brokerId
          ? { ...b, connection_status: 'none', sender_id: undefined, request_id: undefined }
          : b
      ));
      alert(e.message);
    }
  };

  const handleRespond = async (reqId: string, action: 'accept' | 'reject') => {
    const req = pendingIn.find(r => r.id === reqId);
    try {
      await networkApi.respondRequest(reqId, action);
      setPendingIn(prev => prev.filter(r => r.id !== reqId));
      if (action === 'accept') {
        loadConnections();
        loadConversations();
        // Live update discover tab status
        if (req) {
          setBrokers(prev => prev.map(b =>
            b.id === req.sender_id ? { ...b, connection_status: 'connected' } : b
          ));
        }
      }
    } catch (e: any) { alert(e.message); }
  };

  const handleSendMessage = async () => {
    if (!activeConv || !msgInput.trim() || isSendingRef.current) return;

    const body = msgInput.trim();
    const msgBody = propertyContext
      ? `[PROPERTY_REF:${propertyContext.id}] ${body}`
      : body;

    // ── Optimistic update: message appears instantly ──
    setMsgInput('');
    isSendingRef.current = true;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: activeConv.id,
      sender_id: user?.id ?? '',
      body: msgBody,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: user?.name ?? '',
    };
    setMessages(prev => [optimisticMsg, ...prev]);
    setConversations(prev => prev.map(c =>
      c.id === activeConv.id
        ? { ...c, last_message_body: body, last_message_at: optimisticMsg.created_at }
        : c
    ));

    try {
      const response = await networkApi.sendMessage(activeConv.id, msgBody);

      if (propertyContext) {
        if (response.data?.id) savePropertyReference(response.data.id, propertyContext);
        setPropertyContext(null);
      }

      // Swap temp message with the real one from server
      if (response.data) {
        setMessages(prev => {
          // Handle race: WS echo may have already inserted the real message
          if (prev.some(m => m.id === response.data!.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? response.data! : m);
        });
      }
    } catch (e: any) {
      // Revert optimistic message and restore input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMsgInput(body);
      alert(e.message);
    } finally {
      isSendingRef.current = false;
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
    { id: 'discover',    label: 'Discover',                            icon: Users },
    { id: 'connections', label: `Connections (${connections.length})`, icon: UserCheck },
    { id: 'requests',    label: 'Requests',                            icon: Bell,          badge: pendingCount },
    { id: 'chat',        label: 'Messages',                            icon: MessageSquare, badge: totalUnread },
    { id: 'external',    label: `External (${extBrokers.length})`,     icon: UserX },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broker Network</h1>
          <p className="text-gray-500 text-sm mt-0.5">Connect and chat with brokers across India</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium ${
          online ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
        }`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? 'Live' : 'Connecting…'}
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
                      {/* Header: firm name centered and large */}
                      <div className="h-20 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center px-4">
                        <p className="text-white text-xl font-bold text-center drop-shadow leading-snug line-clamp-2">
                          {broker.firm_name}
                        </p>
                      </div>

                      <div className="px-4 pb-4">
                        {/* Avatar — centered, overlapping the header */}
                        <div className="flex justify-center -mt-8 mb-3">
                          <div className="relative">
                            <AvatarCircle name={broker.name} img={broker.profile_image} size="w-16 h-16" />
                            {broker.connection_status === 'connected' && (
                              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="mb-3 space-y-1">
                          <h3 className="font-bold text-gray-900 text-lg text-center truncate">{broker.name}</h3>
                          {broker.location && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                              <span className="truncate">{broker.location}</span>
                            </p>
                          )}
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                            {broker.city}, {broker.state}
                          </p>
                          {broker.whatsapp_number && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                              <span>{broker.whatsapp_number}</span>
                            </p>
                          )}
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

                        {/* Action */}
                        {broker.connection_status === 'connected' ? (
                          <button
                            onClick={() => openChatWith(broker.id)}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg py-2.5 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-sm"
                          >
                            <MessageSquare className="h-4 w-4" /> Message
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
                            <Users className="h-4 w-4" /> Connect
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredBrokers.length === 0 && !loadingBrokers && (
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
                      onClick={() => openChatWith(conn.peer_id)}
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
                      req.status === 'pending'  ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'accepted' ? 'bg-green-100 text-green-700'  :
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
                      {typingUser
                        ? <p className="text-xs text-blue-500 animate-pulse">typing…</p>
                        : <p className="text-xs text-gray-400">{online ? 'Connected' : 'Offline'}</p>
                      }
                    </div>
                  </div>

                  {/* Messages (newest at bottom via flex-col-reverse) */}
                  <div className="flex-1 overflow-y-auto flex flex-col-reverse gap-2 px-1">
                    <div ref={messagesEndRef} />
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      const propertyRefMatch = msg.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
                      const propertyData = propertyRefMatch ? propertyReferences.get(msg.id) : null;

                      if (propertyRefMatch && propertyData) {
                        const displayText = msg.body.replace(/\[PROPERTY_REF:[^\]]+\]\s*/, '').trim();
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[80%]">
                              <button
                                onClick={() => { setSelectedProperty(propertyData); setShowPropertyModal(true); }}
                                className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3 hover:shadow-lg transition-all duration-200 hover:border-blue-400 text-left group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                    <img src={getPropertyImageUrl(propertyData)} alt={propertyData.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1">
                                      <Home className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                      <p className="text-xs font-semibold text-blue-900 uppercase">Property</p>
                                      <ExternalLink className="h-3.5 w-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-700 transition-colors">{propertyData.title}</h4>
                                    <p className="text-xs text-gray-600 flex items-center gap-1 mb-2">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{propertyData.location}</span>
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                      {propertyData.bedrooms !== undefined && <div className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{propertyData.bedrooms}</div>}
                                      {propertyData.bathrooms !== undefined && <div className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{propertyData.bathrooms}</div>}
                                      <div className="flex items-center gap-0.5"><Square className="h-3 w-3" />{propertyData.area} sq ft</div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-bold text-blue-700">₹{propertyData.price.toLocaleString()}</p>
                                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">{propertyData.listing_type === 'sale' ? 'Sale' : 'Rent'}</span>
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
                                {isMe && msg.is_read && <span className="ml-1 text-blue-500">✓✓</span>}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[70%]">
                            <div className={`px-3 py-2 rounded-2xl text-sm ${
                              isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                            </div>
                            <p className={`text-xs mt-0.5 ${isMe ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {isMe && msg.is_read && <span className="ml-1 text-blue-500">✓✓</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Property Context Card */}
                  {propertyContext && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3">
                        <button
                          onClick={() => { setPropertyContext(null); setMsgInput(''); }}
                          className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 bg-white rounded-full p-1 shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                            <img src={getPropertyImageUrl(propertyContext)} alt={propertyContext.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs font-semibold text-blue-900 uppercase mb-1">Property Reference</p>
                            <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{propertyContext.title}</h4>
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" /><span className="truncate">{propertyContext.location}</span>
                            </p>
                            <p className="text-sm font-bold text-blue-700 mt-1">₹{propertyContext.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="flex gap-2 pt-3 border-t border-gray-200 mt-1">
                    <input
                      type="text"
                      value={msgInput}
                      onChange={e => { setMsgInput(e.target.value); handleTyping(); }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Type a message…"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!msgInput.trim()}
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

          {/* ── EXTERNAL BROKERS ── */}
          {tab === 'external' && (
            <div className="space-y-4">
          {/* Sub-header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Non-EnforData Brokers</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Brokers not yet on EnforData — auto-removed when they join the platform
              </p>
            </div>
            <button
              onClick={openExtAdd}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Add Broker
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, area or location…"
              value={extSearch}
              onChange={e => setExtSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            />
          </div>

          {/* Stats */}
          <p className="text-sm text-gray-500">
            <UserX className="inline h-4 w-4 mr-1 text-gray-400" />
            {filteredExtBrokers.length} broker{filteredExtBrokers.length !== 1 ? 's' : ''}
            {extSearch ? ' matching search' : ' total'}
          </p>

          {extLoading && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          )}

          {/* Grid */}
          {!extLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredExtBrokers.map(b => (
                <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  {/* Top */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <UserX className="h-6 w-6 text-indigo-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{b.name}</h3>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Not on EnforData
                        </span>
                      </div>
                    </div>
                    {/* Actions — only for the broker who added */}
                    {b.added_by === user?.id && (
                      <div className="flex gap-1">
                        <button onClick={() => openExtEdit(b)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleExtDelete(b)}
                          disabled={deletingExtId === b.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-medium">{b.mobile_number}</span>
                    </div>
                    {b.area && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span>{b.area}</span>
                      </div>
                    )}
                    {b.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span>{b.location}</span>
                      </div>
                    )}
                    {b.notes && (
                      <p className="text-xs text-gray-500 italic line-clamp-2 mt-1">{b.notes}</p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Added by {b.added_by === user?.id ? 'you' : (b.added_by_name ?? 'a broker')}
                    </span>
                    <button
                      onClick={() => openExtView(b)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      View details
                    </button>
                  </div>
                </div>
              ))}

              {filteredExtBrokers.length === 0 && !extLoading && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserX className="h-8 w-8 text-indigo-300" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">No external brokers found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {extSearch ? 'Try adjusting your search' : 'Add brokers who are not yet on EnforData'}
                  </p>
                  {!extSearch && (
                    <button onClick={openExtAdd} className="btn-primary px-5 py-2">
                      Add External Broker
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
            </div>
          )}
        </div>
      </div>

      {/* External Broker Add / Edit Modal */}
      {showExtModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900">
                  {extViewOnly ? 'Broker Details' : editingExtId ? 'Edit External Broker' : 'Add External Broker'}
                </h2>
                <button onClick={closeExtModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExtSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input type="text" value={extForm.name}
                    onChange={e => setExtForm(p => ({ ...p, name: e.target.value }))}
                    disabled={extViewOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="Broker's full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-red-500">*</span></label>
                  <input type="tel" value={extForm.mobile_number}
                    onChange={e => setExtForm(p => ({ ...p, mobile_number: e.target.value.replace(/\D/g, '') }))}
                    disabled={extViewOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="Enter phone number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <input type="text" value={extForm.area}
                    onChange={e => setExtForm(p => ({ ...p, area: e.target.value }))}
                    disabled={extViewOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g. Andheri West" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={extForm.location}
                    onChange={e => setExtForm(p => ({ ...p, location: e.target.value }))}
                    disabled={extViewOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="e.g. Mumbai, Maharashtra" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea value={extForm.notes}
                    onChange={e => setExtForm(p => ({ ...p, notes: e.target.value }))}
                    disabled={extViewOnly} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="Any additional notes…" />
                </div>

                {extFormError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{extFormError}</div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeExtModal} disabled={extSubmitting}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50">
                    {extViewOnly ? 'Close' : 'Cancel'}
                  </button>
                  {!extViewOnly && (
                    <button type="submit" disabled={extSubmitting}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                      {extSubmitting
                        ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{editingExtId ? 'Updating…' : 'Adding…'}</>
                        : editingExtId ? 'Update Broker' : 'Add Broker'
                      }
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications for external brokers */}
      {extSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 max-w-sm">
          <CheckCircle className="h-5 w-5 flex-shrink-0" /><span className="text-sm">{extSuccess}</span>
        </div>
      )}
      {extError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 max-w-sm">
          <XCircle className="h-5 w-5 flex-shrink-0" /><span className="text-sm">{extError}</span>
        </div>
      )}

      {/* Property Details Modal */}
      {showPropertyModal && (selectedProperty || propertyContext) && (
        <PropertyViewModal
          property={(selectedProperty || propertyContext) as Property}
          currentUserId={user?.id || ''}
          onClose={() => { setShowPropertyModal(false); setSelectedProperty(null); }}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
};

export default BrokerNetworkView;
