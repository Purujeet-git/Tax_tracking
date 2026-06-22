"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

const STATUS_MESSAGES = [
  "Analyzing your portfolio...",
  "Reviewing transactions...",
  "Calculating tax lots...",
  "Searching for tax-saving opportunities...",
  "Preparing your response...",
];

export default function TypingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="max-w-sm rounded-lg border-2 border-black bg-[#f4f4f0] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-black bg-white">
            <Bot className="h-4 w-4 text-black" />
          </div>

          <div>
            <p className="text-sm font-black text-black">
              Trader OS Intelligence
            </p>

            <p className="text-xs font-semibold text-zinc-500">
              {STATUS_MESSAGES[index]}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="h-2 w-2 animate-bounce rounded-full bg-black"
              style={{
                animationDelay: `${dot * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
