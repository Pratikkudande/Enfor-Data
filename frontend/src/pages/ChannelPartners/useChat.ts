import { useCallback, useEffect, useRef, useState } from 'react';
import { networkApi } from '../../services/networkApi';
import { Conversation, Message } from '../../pages/Network/types';

// Shared messaging logic for broker ↔ channel-partner chat (used on both the
// broker's Channel Partners page and the channel partner's Brokers page).
export function useChat(active: boolean, peerRole?: 'broker' | 'channel_partner') {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const r = await networkApi.getConversations(peerRole);
      setConversations(r.data || []);
    } catch { /* ignore */ }
  }, [peerRole]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const r = await networkApi.getMessages(convId, 100, 0);
      // API returns newest-first; reverse so the thread reads oldest → newest.
      setMessages((r.data || []).slice().reverse());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Poll while the messages view is active.
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      loadConversations();
      if (activeIdRef.current) loadMessages(activeIdRef.current);
    }, 4000);
    return () => clearInterval(t);
  }, [active, loadConversations, loadMessages]);

  const selectConversation = useCallback((conv: Conversation) => {
    setActiveConv(conv);
    activeIdRef.current = conv.id;
    loadMessages(conv.id);
  }, [loadMessages]);

  const openChat = useCallback(async (peerId: string) => {
    setError(null);
    try {
      const res = await networkApi.ensureConversation(peerId);
      if (res.data) {
        setActiveConv(res.data);
        activeIdRef.current = res.data.id;
        loadMessages(res.data.id);
        loadConversations();
      }
    } catch (e: any) {
      setError(e?.message || 'Could not open conversation');
    }
  }, [loadMessages, loadConversations]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !messageBody.trim()) return;
    const body = messageBody.trim();
    setSending(true);
    setMessageBody('');
    try {
      await networkApi.sendMessage(activeConv.id, body);
      await loadMessages(activeConv.id);
      loadConversations();
    } catch {
      setMessageBody(body);
    } finally {
      setSending(false);
    }
  }, [activeConv, messageBody, loadMessages, loadConversations]);

  return {
    conversations, activeConv, messages, messageBody, setMessageBody,
    sending, error, openChat, selectConversation, handleSend,
  };
}
