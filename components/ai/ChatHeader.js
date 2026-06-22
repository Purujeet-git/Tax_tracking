"use client";

import {
  CalendarDays,
  Cpu,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function ChatHeader() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="w-full overflow-hidden rounded-lg border-2 border-black bg-[#f4f4f0] shadow-[8px_8px_0_#111]">
      <div className="grid gap-0 lg:grid-cols-[1fr_0.36fr]">
        <div className="border-b-2 border-black p-6 sm:p-8 lg:border-b-0 lg:border-r-2">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#9dff7a] px-4 py-2 text-xs font-black uppercase">
            <Sparkles className="h-4 w-4" />
            Intelligence online
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[0.88] tracking-tighter text-black sm:text-6xl lg:text-7xl">
            Trader OS Intelligence
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-bold leading-tight text-zinc-700">
            Ask for tax impact, lot strategy, harvest opportunities, and filing-ready next moves.
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-2 text-sm font-black uppercase text-zinc-500">
            <CalendarDays className="h-4 w-4" />
            <span>{today}</span>
          </div>

          <div className="grid gap-3">
            <StatusBadge icon={<Database className="h-4 w-4" />} label="Portfolio connected" />
            <StatusBadge icon={<Cpu className="h-4 w-4" />} label="Tax engine ready" />
            <StatusBadge icon={<ShieldCheck className="h-4 w-4" />} label="Secure analysis" />
          </div>
        </div>
      </div>
    </header>
  );
}

function StatusBadge({ icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-[#f4f4f0] px-4 py-3">
      <span className="text-black">{icon}</span>
      <span className="text-xs font-black uppercase text-black">{label}</span>
    </div>
  );
}
