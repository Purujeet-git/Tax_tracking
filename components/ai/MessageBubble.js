"use client";

import { Bot, User } from "lucide-react";

export default function MessageBubble({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[86%] rounded-lg border-2 p-5 ${
          isAssistant ? "border-black bg-[#f4f4f0]" : "border-black bg-[#9dff7a] text-black"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-md border-2 border-black ${
              isAssistant ? "bg-white" : "bg-black text-white"
            }`}
          >
            {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>

          <div>
            <p className="text-sm font-black text-black">
              {isAssistant ? "Trader OS Intelligence" : "You"}
            </p>

            <p className={`text-xs ${isAssistant ? "text-zinc-500" : "text-black/60"}`}>
              {formatTime(message.createdAt)}
            </p>
          </div>
        </div>

        {renderMessage(message, isAssistant)}
      </div>
    </div>
  );
}

function renderMessage(message, isAssistant) {
  switch (message.type) {
    case "text":
    default:
      return (
        <p
          className={`whitespace-pre-wrap leading-7 ${
            isAssistant ? "font-semibold text-zinc-700" : "font-semibold text-black"
          }`}
        >
          {message.content}
        </p>
      );
  }
}

function formatTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
