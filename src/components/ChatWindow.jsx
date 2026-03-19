import React from 'react';
import EmptyState from './EmptyState';
import MessageList from './MessageList';

const ChatWindow = ({ messages, isTyping, onSuggestionClick }) => {
  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden">
      {messages.length === 0 ? (
        <EmptyState onSuggestionClick={onSuggestionClick} />
      ) : (
        <MessageList messages={messages} isTyping={isTyping} />
      )}
    </div>
  );
};

export default ChatWindow;
