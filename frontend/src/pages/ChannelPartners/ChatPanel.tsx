import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Loader2, MessageSquare, Search, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ENV } from '../../config/env';
import type { useChat } from './useChat';
import type { Conversation } from '../Network/types';

const resolvePhoto = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${ENV.API_URL}${path}`;
};
const initialsOf = (name: string) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

type Chat = ReturnType<typeof useChat>;

const accentMap = (color: 'indigo' | 'blue') =>
  color === 'indigo'
    ? { grad: 'from-indigo-500 to-purple-500', mine: 'bg-indigo-600', active: 'bg-indigo-50 border-r-4 border-indigo-500', btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'focus:ring-indigo-500', badge: 'bg-indigo-600', unreadTime: 'text-indigo-500' }
    : { grad: 'from-blue-500 to-cyan-500', mine: 'bg-blue-600', active: 'bg-blue-50 border-r-4 border-blue-500', btn: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-500', badge: 'bg-blue-600', unreadTime: 'text-blue-500' };

/* ─── Avatar ────────────────────────────────────────────────────────── */
const Avatar: React.FC<{ name: string; img?: string | null; grad: string; size?: string }> = ({ name, img, grad, size = 'w-10 h-10 text-sm' }) => {
  const photo = resolvePhoto(img);
  return (
    <div className={`${size} rounded-full overflow-hidden bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : initialsOf(name)}
    </div>
  );
};

/* ─── Conversation List ─────────────────────────────────────────────── */
const ConversationList: React.FC<{
  conversations: Chat['conversations'];
  activeConvId?: string;
  onSelect: (c: Conversation) => void;
  accent: ReturnType<typeof accentMap>;
  emptyHint: string;
}> = ({ conversations, activeConvId, onSelect, accent, emptyHint }) => {
  return (
    <div className="w-full lg:w-80 lg:flex-shrink-0 lg:border-r border-gray-200 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations"
            className={`w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent`}
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-gray-400 mb-4">
              <MessageSquare className="w-12 h-12 mx-auto opacity-30" />
            </div>
            <p className="text-gray-500 text-sm mb-2">No conversations yet</p>
            <p className="text-gray-400 text-xs">{emptyHint}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((c) => {
              const lastTime = c.last_message_at
                ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()
                : '';

              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                    activeConvId === c.id ? accent.active : ''
                  }`}
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  <Avatar name={c.peer_name} img={c.peer_image} grad={accent.grad} size="w-12 h-12 text-lg" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium truncate ${c.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {c.peer_name}
                      </p>
                      {lastTime && (
                        <span className={`text-xs ${c.unread_count > 0 ? `${accent.unreadTime} font-medium` : 'text-gray-400'}`}>
                          {lastTime}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate max-w-[180px] ${c.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {c.last_message_body || 'No messages yet'}
                      </p>
                      {c.unread_count > 0 && (
                        <span className={`${accent.badge} text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0 ml-2`}>
                          {c.unread_count > 99 ? '99+' : c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Message Thread ────────────────────────────────────────────────── */
const MessageThread: React.FC<{
  chat: Chat;
  accent: ReturnType<typeof accentMap>;
  currentUserId?: string;
  showBackButton: boolean;
  onBack?: () => void;
}> = ({ chat, accent, currentUserId, showBackButton, onBack }) => {
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [chat.messages]);

  if (!chat.activeConv && chat.conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 h-full">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Conversations Yet</h3>
          <p className="text-sm max-w-xs mx-auto leading-relaxed">
            Follow a channel partner and tap Message to start chatting.
          </p>
        </div>
      </div>
    );
  }

  if (!chat.activeConv) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 h-full">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Conversation</h3>
          <p className="text-sm max-w-xs mx-auto leading-relaxed">
            Choose a conversation from the list to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors lg:hidden"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <Avatar name={chat.activeConv.peer_name} img={chat.activeConv.peer_image} grad={accent.grad} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{chat.activeConv.peer_name}</p>
          <p className="text-xs text-gray-500">online</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={threadRef}
        className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="flex flex-col gap-2 py-4">
          {chat.messages.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg inline-block text-sm">
                🔒 Messages are end-to-end encrypted. No one outside of this chat can read them.
              </div>
            </div>
          )}

          {chat.messages.map((m) => {
            const mine = m.sender_id === currentUserId;
            const timeStr = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[70%] group">
                  <div className={`px-3 py-2 rounded-lg text-sm shadow-sm ${
                    mine
                      ? `${accent.mine} text-white rounded-br-none`
                      : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                  }`}>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${mine ? 'text-white/60' : 'text-gray-400'}`}>
                      <span className="text-xs">{timeStr}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={chat.handleSend} className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              value={chat.messageBody}
              onChange={(e) => chat.setMessageBody(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && chat.handleSend(e)}
              placeholder="Type a message"
              className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 ${accent.ring} focus:border-transparent resize-none`}
            />
          </div>
          <button
            type="submit"
            disabled={chat.sending || !chat.messageBody.trim()}
            className={`${accent.btn} text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0`}
          >
            {chat.sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─── Main ChatPanel ────────────────────────────────────────────────── */
const ChatPanel: React.FC<{ chat: Chat; emptyHint: string; accent?: 'indigo' | 'blue' }> = ({ chat, emptyHint, accent = 'indigo' }) => {
  const { user } = useAuth();
  const a = accentMap(accent);

  const [showConversationList, setShowConversationList] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    if (isTransitioning) return;
    chat.selectConversation(conv);
    setIsTransitioning(true);
    setShowConversationList(false);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, chat]);

  const handleBackToList = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowConversationList(true);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex h-[520px] relative bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Mobile Layout */}
      <div className="flex w-full h-full lg:hidden relative">
        {/* Conversation List - Mobile */}
        <div className={`w-full h-full absolute inset-0 transition-transform duration-300 ease-in-out ${
          showConversationList ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <ConversationList
            conversations={chat.conversations}
            activeConvId={chat.activeConv?.id}
            onSelect={handleSelectConversation}
            accent={a}
            emptyHint={emptyHint}
          />
        </div>

        {/* Chat Area - Mobile */}
        <div className={`w-full h-full absolute inset-0 transition-transform duration-300 ease-in-out ${
          !showConversationList ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <MessageThread
            chat={chat}
            accent={a}
            currentUserId={user?.id}
            showBackButton={true}
            onBack={handleBackToList}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full h-full">
        <ConversationList
          conversations={chat.conversations}
          activeConvId={chat.activeConv?.id}
          onSelect={(conv) => chat.selectConversation(conv)}
          accent={a}
          emptyHint={emptyHint}
        />
        <MessageThread
          chat={chat}
          accent={a}
          currentUserId={user?.id}
          showBackButton={false}
        />
      </div>
    </div>
  );
};

export default ChatPanel;
