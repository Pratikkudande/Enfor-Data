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
  const isTransitioningRef = useRef(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleTransitionEnd = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
    }, 350); // Slightly longer than CSS duration to guarantee completion
  }, []);

  const handleSelectConversation = useCallback((conv: Conversation) => {
    // Prevent rapid clicks during transition
    if (isTransitioningRef.current) return;

    props.onSelectConversation(conv);

    // On mobile, switch to chat view when conversation is selected
    isTransitioningRef.current = true;
    setShowConversationList(false);
    scheduleTransitionEnd();
  }, [props.onSelectConversation, scheduleTransitionEnd]);

  const handleBackToList = useCallback(() => {
    // Prevent rapid clicks during transition
    if (isTransitioningRef.current) return;

    isTransitioningRef.current = true;
    setShowConversationList(true);
    scheduleTransitionEnd();
  }, [scheduleTransitionEnd]);

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
      <div className="flex w-full h-full lg:hidden relative overflow-hidden">
        {/* Conversation List - Mobile */}
        <div className={`w-full h-full absolute inset-0 transition-transform duration-300 ease-in-out will-change-transform ${
          showConversationList ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}>
          <ConversationList
            conversations={props.conversations}
            activeConvId={props.activeConv?.id}
            onSelectConversation={handleSelectConversation}
          />
        </div>
        
        {/* Chat Area - Mobile */}
        <div className={`w-full h-full absolute inset-0 transition-transform duration-300 ease-in-out will-change-transform ${
          !showConversationList ? 'translate-x-0' : 'translate-x-full pointer-events-none'
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
