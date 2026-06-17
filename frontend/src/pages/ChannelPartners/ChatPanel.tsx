import React, { useEffect, useRef } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ENV } from '../../config/env';
import type { useChat } from './useChat';

const resolvePhoto = (path?: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  return `${ENV.API_URL}${path}`;
};
const initials = (name: string) =>
  (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

type Chat = ReturnType<typeof useChat>;

const accentByRole = (color: 'indigo' | 'blue') =>
  color === 'indigo'
    ? { grad: 'from-indigo-500 to-purple-500', mine: 'bg-indigo-600', active: 'bg-indigo-50', btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'focus:ring-indigo-500', badge: 'bg-indigo-600' }
    : { grad: 'from-blue-500 to-cyan-500', mine: 'bg-blue-600', active: 'bg-blue-50', btn: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-500', badge: 'bg-blue-600' };

const ChatPanel: React.FC<{ chat: Chat; emptyHint: string; accent?: 'indigo' | 'blue' }> = ({ chat, emptyHint, accent = 'indigo' }) => {
  const { user } = useAuth();
  const threadRef = useRef<HTMLDivElement>(null);
  const a = accentByRole(accent);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [chat.messages]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[60vh]">
      {/* Conversation list */}
      <div className="border-r border-gray-100 overflow-y-auto">
        {chat.conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">{emptyHint}</div>
        ) : (
          chat.conversations.map((c) => {
            const photo = resolvePhoto(c.peer_image);
            return (
              <button
                key={c.id}
                onClick={() => chat.selectConversation(c)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 ${chat.activeConv?.id === c.id ? a.active : ''}`}
              >
                <div className={`w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br ${a.grad} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                  {photo ? <img src={photo} alt={c.peer_name} className="w-full h-full object-cover" /> : initials(c.peer_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.peer_name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.last_message_body || 'Start the conversation'}</p>
                </div>
                {c.unread_count > 0 && <span className={`${a.badge} text-white text-xs rounded-full px-1.5 py-0.5`}>{c.unread_count}</span>}
              </button>
            );
          })
        )}
      </div>

      {/* Thread */}
      <div className="md:col-span-2 flex flex-col">
        {!chat.activeConv ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Select a conversation</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br ${a.grad} flex items-center justify-center text-white text-sm font-bold`}>
                {resolvePhoto(chat.activeConv.peer_image)
                  ? <img src={resolvePhoto(chat.activeConv.peer_image) as string} alt={chat.activeConv.peer_name} className="w-full h-full object-cover" />
                  : initials(chat.activeConv.peer_name)}
              </div>
              <p className="font-semibold text-gray-900">{chat.activeConv.peer_name}</p>
            </div>
            <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {chat.messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? `${a.mine} text-white rounded-br-sm` : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'}`}>
                      {m.body}
                    </div>
                  </div>
                );
              })}
              {chat.messages.length === 0 && <p className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hello!</p>}
            </div>
            <form onSubmit={chat.handleSend} className="p-3 border-t border-gray-100 flex items-center gap-2">
              <input
                value={chat.messageBody}
                onChange={(e) => chat.setMessageBody(e.target.value)}
                placeholder="Type a message…"
                className={`flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:ring-2 ${a.ring} focus:border-transparent`}
              />
              <button type="submit" disabled={chat.sending || !chat.messageBody.trim()} className={`${a.btn} text-white p-2.5 rounded-full disabled:opacity-50`}>
                {chat.sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
