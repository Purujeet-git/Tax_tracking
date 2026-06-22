"use client";

import {
  ArrowLeftRight,
  Bitcoin,
  Calculator,
  FileText,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import SuggestedPrompts from "./SuggestedPrompts";

const capabilities = [
  {
    icon: Sparkles,
    title: "Explain taxes",
  },
  {
    icon: Wallet,
    title: "Review trades",
  },
  {
    icon: TrendingUp,
    title: "Optimize portfolio",
  },
  {
    icon: FileText,
    title: "Generate reports",
  },
  {
    icon: ShieldCheck,
    title: "Secure analysis",
  },
];

const prompts = [
  {
    id: "tax-summary",
    title: "Explain My Taxes",
    description: "Understand how your estimated tax liability is calculated.",
    icon: Calculator,
  },
  {
    id: "btc-review",
    title: "Review BTC Trades",
    description: "Analyze every Bitcoin purchase, sale, and realized gain.",
    icon: Bitcoin,
  },
  {
    id: "harvesting",
    title: "Find Tax Savings",
    description: "Discover opportunities to reduce your tax bill.",
    icon: TrendingDown,
  },
  {
    id: "fifo",
    title: "Compare FIFO vs HIFO",
    description: "See how different disposal strategies affect your taxes.",
    icon: ArrowLeftRight,
  },
];

export default function EmptyState({ onPromptClick }) {
  const hour = new Date().getHours();
  let greeting = "Good Evening";

  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <div className="flex flex-col px-1 py-8 sm:px-2 sm:py-10">
      <div className="max-w-3xl">
        <div className="mb-4 inline-flex rounded-full border-2 border-black bg-[#ffdf5d] px-4 py-2 text-xs font-black uppercase text-black">
          Trader OS Intelligence Online
        </div>

        <h2 className="text-4xl font-black tracking-tighter text-black sm:text-5xl">
          {greeting}
        </h2>

        <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-zinc-600">
          Review taxes, trades, harvest candidates, and CPA-ready exports with direct questions.
        </p>
      </div>

      <div className="mt-12 grid w-full max-w-6xl gap-6 lg:grid-cols-2">
        <div className="rounded-lg border-2 border-black bg-[#f4f4f0] p-6">
          <h3 className="mb-6 text-xs font-black uppercase text-zinc-500">
            Today's Brief
          </h3>

          <div className="space-y-5">
            <BriefItem label="Estimated Tax" value="Pending" />
            <BriefItem label="Portfolio Value" value="Pending" />
            <BriefItem label="Harvest Opportunities" value="Pending" />
            <BriefItem label="Exchange Status" value="Waiting for connection" />
          </div>
        </div>

        <div className="rounded-lg border-2 border-black bg-white p-6">
          <h3 className="mb-6 text-xs font-black uppercase text-zinc-500">
            Capabilities
          </h3>

          <div className="space-y-4">
            {capabilities.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-md border-2 border-black bg-[#f4f4f0] p-4"
                >
                  <Icon className="h-5 w-5 text-black" />
                  <span className="font-black text-black">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SuggestedPrompts
        prompts={prompts}
        onPromptClick={(prompt) => onPromptClick?.(prompt.title)}
      />
    </div>
  );
}

function BriefItem({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-black pb-3">
      <span className="font-semibold text-zinc-600">{label}</span>
      <span className="font-black text-black">{value}</span>
    </div>
  );
}
