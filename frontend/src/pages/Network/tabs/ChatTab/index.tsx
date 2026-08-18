import React, { useState, useCallback, useRef } from 'react';
import { Conversation, Message } from '../../types';
import { ConversationList } from './ConversationList';
import { MessageArea } from './MessageArea';

interface ChatTabProps {
  conversations: Conversation[];
  activeConv: Conversation | null;
  messages: Message[];
  msgInput: string;
  online: boolean;
  typingUser: string | null;
  propertyContext: any;
  propertyReferences: Map<string, any>;
  currentUserId?: string;
  onSelectConversation: (conv: Conversation) => void;
  onMsgInputChange: (value: string) => void;
  onSendMessage: () => void;
  onTyping: () => void;
  onClearPropertyContext: () => void;
  onPropertyClick: (property: any) => void;
}

export const ChatTab: React.FC<ChatTabProps> = (props) => {
  // State to track mobile view - true shows conversation list, false shows chat
  const [showConversationList, setShowConversationList] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    // Prevent rapid clicks during transition
    if (isTransitioning) return;
    
    props.onSelectConversation(conv);
    
    // On mobile, switch to chat view when conversation is selected
    setIsTransitioning(true);
    setShowConversationList(false);
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Set transition complete after animation duration
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Match CSS transition duration
  }, [isTransitioning, props]);

  const handleBackToList = useCallback(() => {
    // Prevent rapid clicks during transition
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setShowConversationList(true);
    
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    
    // Set transition complete after animation duration
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Match CSS transition duration
  }, [isTransitioning]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
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
            conversations={props.conversations}
            activeConvId={props.activeConv?.id}
            onSelectConversation={handleSelectConversation}
          />
        </div>
        
        {/* Chat Area - Mobile */}
        <div className={`w-full h-full absolute inset-0 transition-transform duration-300 ease-in-out ${
          !showConversationList ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <MessageArea
            conversation={props.activeConv}
            messages={props.messages}
            msgInput={props.msgInput}
            online={props.online}
            typingUser={props.typingUser}
            propertyContext={props.propertyContext}
            propertyReferences={props.propertyReferences}
            currentUserId={props.currentUserId}
            conversations={props.conversations}
            onMsgInputChange={props.onMsgInputChange}
            onSendMessage={props.onSendMessage}
            onTyping={props.onTyping}
            onClearPropertyContext={props.onClearPropertyContext}
            onPropertyClick={props.onPropertyClick}
            onBackToList={handleBackToList}
            showBackButton={true}
          />
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full h-full gap-4 p-4">
        <ConversationList
          conversations={props.conversations}
          activeConvId={props.activeConv?.id}
          onSelectConversation={props.onSelectConversation}
        />
        <MessageArea
          conversation={props.activeConv}
          messages={props.messages}
          msgInput={props.msgInput}
          online={props.online}
          typingUser={props.typingUser}
          propertyContext={props.propertyContext}
          propertyReferences={props.propertyReferences}
          currentUserId={props.currentUserId}
          conversations={props.conversations}
          onMsgInputChange={props.onMsgInputChange}
          onSendMessage={props.onSendMessage}
          onTyping={props.onTyping}
          onClearPropertyContext={props.onClearPropertyContext}
          onPropertyClick={props.onPropertyClick}
          showBackButton={false}
        />
      </div>
    </div>
  );
};
