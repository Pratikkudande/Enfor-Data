import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, UserCheck, Bell, MessageSquare, Wifi, WifiOff, UserX, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { networkApi } from '../../services/networkApi';
import { externalBrokerApi, ExternalBroker, CreateExternalBrokerRequest } from '../../services/externalBrokerApi';
import { api } from '../../services/api';
import {
  BrokerProfile, ConnectionRequest, Connection,
  Conversation, Message, WsOutbound
} from './types';
import PropertyViewModal from '../Properties/PropertyViewModal';
import { useNetworkWebSocket } from './hooks/useNetworkWebSocket';
import { DiscoverTab, ConnectionsTab, RequestsTab, ChatTab, ExternalBrokersTab } from './tabs';
import { ExternalBrokerModal } from './components';

const BrokerNetworkView: React.FC = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('enfor_token');
  const location = useLocation();
  const locationState = location.state as any;

  const [tab, setTab] = useState<'discover' | 'connections' | 'requests' | 'chat' | 'external'>(
    locationState?.tab || 'discover'
  );

  // State declarations
  const [brokers, setBrokers] = useState<BrokerProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingIn, setPendingIn] = useState<ConnectionRequest[]>([]);
  const [pendingOut, setPendingOut] = useState<ConnectionRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [propertyContext, setPropertyContext] = useState<any>(locationState?.propertyContext || null);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [propertyReferences, setPropertyReferences] = useState<Map<string, any>>(new Map());

  // External Brokers state
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
  const [extForm, setExtForm] = useState<CreateExternalBrokerRequest>(emptyExtForm);

  // Refs
  const isSendingRef = useRef(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<Conversation | null>(null);
  const wsSendRef = useRef<(data: object) => void>(() => {});

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Utility functions
  const showExtSuccess = (msg: string) => { 
    setExtSuccess(msg); 
    window.setTimeout(() => setExtSuccess(null), 4000); 
  };
  const showExtError = (msg: string) => { 
    setExtError(msg); 
    window.setTimeout(() => setExtError(null), 5000); 
  };

  const savePropertyReference = (messageId: string, propertyData: any) => {
    setPropertyReferences(prev => {
      const next = new Map(prev);
      next.set(messageId, propertyData);
      localStorage.setItem('property_references', JSON.stringify(Object.fromEntries(next)));
      return next;
    });
  };

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

  // WebSocket message handler
  const handleWsMessage = useCallback((msg: WsOutbound) => {
    if (msg.type === 'message') {
      const payload = msg.payload as Message;
      if (activeConvRef.current?.id === msg.conversation_id) {
        setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [payload, ...prev]);
        wsSendRef.current({ type: 'read', conversation_id: msg.conversation_id });

        const match = payload.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
        if (match) {
          api.getProperty(match[1]).then(r => {
            if (r.data) savePropertyReference(payload.id, r.data);
          }).catch(() => {});
        }
      }
      setConversations(prev => prev.map(c =>
        c.id === msg.conversation_id
          ? {
              ...c,
              last_message_body: payload.body.replace(/\[PROPERTY_REF:[^\]]+\]\s*/, ''),
              last_message_at: payload.created_at,
              unread_count: activeConvRef.current?.id === msg.conversation_id ? 0 : c.unread_count + 1,
            }
          : c
      ));
    }

    if (msg.type === 'typing' && activeConvRef.current?.id === msg.conversation_id &&
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
      setBrokers(prev => prev.map(b =>
        b.id === req.sender_id
          ? { ...b, connection_status: 'pending', sender_id: req.sender_id, request_id: req.id }
          : b
      ));
    }
  }, [user?.id]);

  // WebSocket connection
  const { online, send: wsSend, reconnectCount } = useNetworkWebSocket(token, handleWsMessage);
  useEffect(() => { wsSendRef.current = wsSend; }, [wsSend]);

  useEffect(() => {
    if (reconnectCount === 0) return;
    if (activeConvRef.current) {
      wsSend({ type: 'join', conversation_id: activeConvRef.current.id });
    }
    loadConversations();
  }, [reconnectCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Data loading effects
  useEffect(() => {
    loadBrokers();
    loadConnections();
    loadRequests();
    loadConversations();
    loadExtBrokers();
  }, []);
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

  // Data loading functions
  const loadBrokers = async () => {
    setLoadingBrokers(true);
    try { 
      const r = await networkApi.getBrokers(); 
      setBrokers(r.data || []); 
    } catch { /* ignore */ } 
    finally { setLoadingBrokers(false); }
  };

  const loadConnections = async () => {
    try { 
      const r = await networkApi.getConnections(); 
      setConnections(r.data || []); 
    } catch { /* */ }
  };

  const loadRequests = async () => {
    try {
      const [inc, out] = await Promise.all([networkApi.getPendingRequests(), networkApi.getSentRequests()]);
      setPendingIn(inc.data || []);
      setPendingOut(out.data || []);
    } catch { /* */ }
  };

  const loadConversations = async () => {
    try { 
      const r = await networkApi.getConversations('broker'); 
      setConversations(r.data || []); 
    } catch { /* */ }
  };

  const loadExtBrokers = async () => {
    setExtLoading(true);
    try { 
      const r = await externalBrokerApi.getAll(); 
      setExtBrokers(r.data || []); 
    } catch { /* ignore */ } 
    finally { setExtLoading(false); }
  };

  // Chat functions
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

  // Connection handlers
  const handleConnect = async (brokerId: string) => {
    setBrokers(prev => prev.map(b =>
      b.id === brokerId
        ? { ...b, connection_status: 'pending', sender_id: user?.id ?? '' }
        : b
    ));
    try {
      const res = await networkApi.sendRequest(brokerId);
      setBrokers(prev => prev.map(b =>
        b.id === brokerId ? { ...b, request_id: res.data?.id ?? '' } : b
      ));
    } catch (e: any) {
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
        if (req) {
          setBrokers(prev => prev.map(b =>
            b.id === req.sender_id ? { ...b, connection_status: 'connected' } : b
          ));
        }
      }
    } catch (e: any) { alert(e.message); }
  };
  // Message handlers
  const handleSendMessage = async () => {
    if (!activeConv || !msgInput.trim() || isSendingRef.current) return;

    const body = msgInput.trim();
    const msgBody = propertyContext ? `[PROPERTY_REF:${propertyContext.id}] ${body}` : body;
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
      if (response.data) {
        setMessages(prev => {
          if (prev.some(m => m.id === response.data!.id)) {
            return prev.filter(m => m.id !== tempId);
          }
          return prev.map(m => m.id === tempId ? response.data! : m);
        });
      }
    } catch (e: any) {
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

  // External broker handlers
  const openExtAdd = () => { 
    setExtForm(emptyExtForm); 
    setEditingExtId(null); 
    setExtViewOnly(false); 
    setExtFormError(null); 
    setShowExtModal(true); 
  };
  const openExtEdit = (b: ExternalBroker) => {
    setExtForm({ 
      name: b.name, 
      mobile_number: b.mobile_number, 
      area: b.area ?? '', 
      location: b.location ?? '', 
      notes: b.notes ?? '' 
    });
    setEditingExtId(b.id); 
    setExtViewOnly(false); 
    setExtFormError(null); 
    setShowExtModal(true);
  };

  const openExtView = (b: ExternalBroker) => { 
    openExtEdit(b); 
    setExtViewOnly(true); 
  };

  const closeExtModal = () => { 
    setShowExtModal(false); 
    setExtForm(emptyExtForm); 
    setEditingExtId(null); 
    setExtFormError(null); 
  };

  const handleExtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtFormError(null);
    if (!extForm.mobile_number.trim()) { 
      setExtFormError('Mobile number is required'); 
      return; 
    }
    if (!extForm.name.trim()) { 
      setExtFormError('Name is required'); 
      return; 
    }
    setExtSubmitting(true);
    try {
      const payload: CreateExternalBrokerRequest = {
        name: extForm.name.trim(),
        mobile_number: extForm.mobile_number.trim(),
        area: extForm.area?.trim() || undefined,
        location: extForm.location?.trim() || undefined,
        notes: extForm.notes?.trim() || undefined,
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
    } finally { 
      setExtSubmitting(false); 
    }
  };
  const handleExtDelete = async (b: ExternalBroker) => {
    if (!window.confirm(`Delete external broker "${b.name}"?`)) return;
    setDeletingExtId(b.id);
    try {
      await externalBrokerApi.delete(b.id);
      setExtBrokers(prev => prev.filter(x => x.id !== b.id));
      showExtSuccess('Broker removed successfully!');
    } catch (err) { 
      showExtError(err instanceof Error ? err.message : 'Failed to delete'); 
    } finally { 
      setDeletingExtId(null); 
    }
  };

  // Computed values
  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);
  const pendingCount = pendingIn.length;

  const tabs = [
    { id: 'discover', label: 'Discover', icon: Users },
    { id: 'connections', label: `Connections (${connections.length})`, icon: UserCheck },
    { id: 'requests', label: 'Requests', icon: Bell, badge: pendingCount },
    { id: 'chat', label: 'Messages', icon: MessageSquare, badge: totalUnread },
    { id: 'external', label: `External (${extBrokers.length})`, icon: UserX },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Broker Network</h1>
          <p className="text-gray-500 text-sm mt-0.5">Connect and chat with brokers across India</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium self-start sm:self-auto ${
          online ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
        }`}>
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {online ? 'Live' : 'Connecting…'}
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex overflow-x-auto border-b border-gray-200 px-2 sm:px-4 scrollbar-thin scrollbar-thumb-gray-300">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`relative flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
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
          {tab === 'discover' && (
            <DiscoverTab
              brokers={brokers}
              loading={loadingBrokers}
              search={search}
              onSearchChange={setSearch}
              onConnect={handleConnect}
              onOpenChat={openChatWith}
              currentUserId={user?.id}
            />
          )}

          {tab === 'connections' && (
            <ConnectionsTab
              connections={connections}
              onOpenChat={openChatWith}
            />
          )}

          {tab === 'requests' && (
            <RequestsTab
              pendingIn={pendingIn}
              pendingOut={pendingOut}
              onRespond={handleRespond}
            />
          )}

          {tab === 'chat' && (
            <ChatTab
              conversations={conversations}
              activeConv={activeConv}
              messages={messages}
              msgInput={msgInput}
              online={online}
              typingUser={typingUser}
              propertyContext={propertyContext}
              propertyReferences={propertyReferences}
              currentUserId={user?.id}
              onSelectConversation={openConversation}
              onMsgInputChange={setMsgInput}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onClearPropertyContext={() => { setPropertyContext(null); setMsgInput(''); }}
              onPropertyClick={(property) => { setSelectedProperty(property); setShowPropertyModal(true); }}
            />
          )}
          {tab === 'external' && (
            <ExternalBrokersTab
              brokers={extBrokers}
              loading={extLoading}
              search={extSearch}
              currentUserId={user?.id}
              onSearchChange={setExtSearch}
              onAdd={openExtAdd}
              onEdit={openExtEdit}
              onView={openExtView}
              onDelete={handleExtDelete}
              deletingId={deletingExtId}
            />
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {extSuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <CheckCircle className="h-5 w-5 mr-2" />
          {extSuccess}
        </div>
      )}
      {extError && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center z-50">
          <XCircle className="h-5 w-5 mr-2" />
          {extError}
        </div>
      )}

      {/* Property View Modal */}
      {showPropertyModal && selectedProperty && (
        <PropertyViewModal
          property={selectedProperty}
          onClose={() => { setShowPropertyModal(false); setSelectedProperty(null); }}
        />
      )}

      {/* External Broker Modal */}
      <ExternalBrokerModal
        isOpen={showExtModal}
        isViewOnly={extViewOnly}
        isEditing={!!editingExtId}
        formData={extForm}
        error={extFormError}
        submitting={extSubmitting}
        onClose={closeExtModal}
        onFormChange={(data) => setExtForm(prev => ({ ...prev, ...data }))}
        onSubmit={handleExtSubmit}
      />
    </div>
  );
};

export default BrokerNetworkView;