"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [message]);

  const sendMessage = () => {
    if (!message.trim() || disabled) return;

    onSendMessage?.(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;

    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="rounded-lg border-2 border-black bg-white">
      <textarea
        ref={textareaRef}
        rows={1}
        value={message}
        disabled={disabled}
        placeholder="Ask Trader OS Intelligence..."
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="max-h-52 min-h-[76px] w-full resize-none bg-transparent p-5 font-semibold text-black placeholder:text-zinc-500 focus:outline-none"
      />

      <div className="flex flex-col gap-3 border-t-2 border-black px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-black uppercase text-zinc-500">
          Shift + Enter for new line
        </span>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="text-xs font-black uppercase text-zinc-500">
            {message.length}/4000
          </span>

          <button
            disabled={!message.trim() || disabled}
            onClick={sendMessage}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-black uppercase text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizontal size={16} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
