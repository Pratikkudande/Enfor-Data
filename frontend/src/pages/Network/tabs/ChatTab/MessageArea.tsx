import React, { useRef, useEffect } from 'react';
import { Send, MessageSquare, X, ArrowLeft } from 'lucide-react';
import { Conversation, Message } from '../../types';
import { AvatarCircle } from '../../components/AvatarCircle';
import { PropertyReferenceCard } from './PropertyReferenceCard';

interface MessageAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  msgInput: string;
  online: boolean;
  typingUser: string | null;
  propertyContext: any;
  propertyReferences: Map<string, any>;
  currentUserId?: string;
  conversations?: Conversation[]; // Add this to check if conversations exist
  onMsgInputChange: (value: string) => void;
  onSendMessage: () => void;
  onTyping: () => void;
  onClearPropertyContext: () => void;
  onPropertyClick: (property: any) => void;
  onBackToList?: () => void;
  showBackButton?: boolean;
}

export const MessageArea: React.FC<MessageAreaProps> = ({
  conversation,
  messages,
  msgInput,
  online,
  typingUser,
  propertyContext,
  propertyReferences,
  currentUserId,
  conversations = [], // Default to empty array
  onMsgInputChange,
  onSendMessage,
  onTyping,
  onClearPropertyContext,
  onPropertyClick,
  onBackToList,
  showBackButton = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation && conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 h-full">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Conversations Yet</h3>
          <p className="text-sm max-w-xs mx-auto leading-relaxed">
            Connect with brokers to start chatting.<br/>
            Go to Discover or Connections tab to find brokers.
          </p>
        </div>
      </div>
    );
  }

  if (!conversation) {
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
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {showBackButton && (
          <button
            onClick={onBackToList}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors lg:hidden"
            style={{ 
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        
        <AvatarCircle 
          name={conversation.peer_name} 
          img={conversation.peer_image} 
          size="w-10 h-10" 
        />
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">{conversation.peer_name}</p>
          {typingUser ? (
            <p className="text-xs text-green-500 animate-pulse">typing…</p>
          ) : (
            <p className="text-xs text-gray-500">
              {online ? 'online' : 'last seen recently'}
            </p>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        <div className="flex flex-col gap-2 py-4">
          {/* Welcome message for new conversations */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg inline-block text-sm">
                🔒 Messages are end-to-end encrypted. No one outside of this chat can read them.
              </div>
            </div>
          )}

          {messages.map(msg => {
            const isMe = msg.sender_id === currentUserId;
            const propertyRefMatch = msg.body.match(/\[PROPERTY_REF:([^\]]+)\]/);
            const propertyData = propertyRefMatch ? propertyReferences.get(msg.id) : null;
            const timestamp = new Date(msg.created_at);
            const timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            if (propertyRefMatch && propertyData) {
              const displayText = msg.body.replace(/\[PROPERTY_REF:[^\]]+\]\s*/, '').trim();
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[80%]">
                    <PropertyReferenceCard
                      property={propertyData}
                      displayText={displayText}
                      onClick={() => onPropertyClick(propertyData)}
                    />
                    <p className={`text-xs mt-1 px-2 ${isMe ? 'text-right text-gray-500' : 'text-gray-500'}`}>
                      {timeStr}
                      {isMe && msg.is_read && (
                        <span className="ml-1 text-blue-500">
                          <svg width="16" height="8" viewBox="0 0 16 8" className="inline">
                            <path fill="currentColor" d="M1 4l3 3 8-8" stroke="currentColor" strokeWidth="1"/>
                            <path fill="currentColor" d="M5 4l3 3 8-8" stroke="currentColor" strokeWidth="1"/>
                          </svg>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[70%] group">
                  <div className={`px-3 py-2 rounded-lg text-sm shadow-sm ${
                    isMe 
                      ? 'bg-green-500 text-white rounded-br-none' 
                      : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                  }`}>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.body}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                      isMe ? 'text-green-100' : 'text-gray-400'
                    }`}>
                      <span className="text-xs">{timeStr}</span>
                      {isMe && (
                        <span className="text-xs">
                          {msg.is_read ? (
                            <svg width="16" height="8" viewBox="0 0 16 8" className="inline">
                              <path fill="currentColor" d="M1.5 4.5l2.83 2.83L11.17.5" strokeWidth="1"/>
                              <path fill="currentColor" d="M5.5 4.5l2.83 2.83L15.17.5" strokeWidth="1"/>
                            </svg>
                          ) : (
                            <svg width="12" height="8" viewBox="0 0 12 8" className="inline">
                              <path fill="currentColor" d="M1.5 4.5l2.83 2.83L11.17.5" strokeWidth="1"/>
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Property Context Card */}
      {propertyContext && (
        <div className="px-4 py-2 bg-white border-t border-gray-200">
          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3">
            <button
              onClick={onClearPropertyContext}
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 bg-white rounded-full p-1 shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>
            <PropertyReferenceCard property={propertyContext} displayText="" onClick={() => {}} isContext />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={msgInput}
              onChange={e => {
                onMsgInputChange(e.target.value);
                onTyping();
              }}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
              placeholder="Type a message"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            onClick={onSendMessage}
            disabled={!msgInput.trim()}
            className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
