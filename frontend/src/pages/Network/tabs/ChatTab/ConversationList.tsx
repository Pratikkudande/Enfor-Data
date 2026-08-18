import React from 'react';
import { Search } from 'lucide-react';
import { Conversation } from '../../types';
import { AvatarCircle } from '../../components/AvatarCircle';

interface ConversationListProps {
  conversations: Conversation[];
  activeConvId?: string;
  onSelectConversation: (conv: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConvId,
  onSelectConversation,
}) => {
  return (
    <div className="w-full lg:w-80 lg:flex-shrink-0 lg:border-r border-gray-200 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations"
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm mb-2">No conversations yet</p>
            <p className="text-gray-400 text-xs">Accept a connection to start chatting</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map(conv => {
              const lastMessageTime = conv.last_message_at ? 
                new Date(conv.last_message_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                }).toLowerCase() : '';

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                    activeConvId === conv.id ? 'bg-green-50 border-r-4 border-green-500' : ''
                  }`}
                  style={{ 
                    touchAction: 'manipulation', // Prevent double-tap zoom on mobile
                    WebkitTapHighlightColor: 'transparent' // Remove blue highlight on tap
                  }}
                >
                  <div className="relative">
                    <AvatarCircle 
                      name={conv.peer_name} 
                      img={conv.peer_image} 
                      size="w-12 h-12 text-lg" 
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={`text-sm font-medium truncate ${
                        conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {conv.peer_name}
                      </p>
                      {lastMessageTime && (
                        <span className={`text-xs ${
                          conv.unread_count > 0 ? 'text-green-500 font-medium' : 'text-gray-400'
                        }`}>
                          {lastMessageTime}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate max-w-[180px] ${
                        conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {conv.last_message_body || 'No messages yet'}
                      </p>
                      
                      {conv.unread_count > 0 && (
                        <span className="bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                          {conv.unread_count > 99 ? '99+' : conv.unread_count}
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
