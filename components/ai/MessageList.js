"use client";

import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({
  messages = [],
  isTyping = false,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col gap-6 py-6">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
        />
      ))}

      {isTyping && <TypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}