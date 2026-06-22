"use client";

import { useState } from "react";

import ChatInput from "./ChatInput";
import EmptyState from "./EmptyState";
import MessageList from "./MessageList";

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (content) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      type: "text",
      content,
      createdAt: new Date(),
      metadata: {},
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        type: "text",
        content:
          "This is a temporary AI response. In the next milestone this message will come from Gemini/OpenAI through the Intelligence API.",
        createdAt: new Date(),
        metadata: {},
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-[680px] flex-col overflow-hidden rounded-lg border-2 border-black bg-white shadow-[8px_8px_0_#111]">
      <div className="flex items-center justify-between border-b-2 border-black bg-black px-5 py-3 text-white">
        <p className="text-xs font-black uppercase">Tax intelligence console</p>
        <p className="text-xs font-black uppercase text-white/60">Ask. Audit. Act.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        {messages.length === 0 ? (
          <EmptyState onPromptClick={(prompt) => handleSendMessage(prompt.title ?? prompt)} />
        ) : (
          <MessageList messages={messages} isTyping={isTyping} />
        )}
      </div>

      <div className="border-t-2 border-black bg-[#f4f4f0] p-4 sm:p-6">
        <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  );
}
