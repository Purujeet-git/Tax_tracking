"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  FileText,
  ShieldCheck,
  Upload,
  WalletCards,
} from "lucide-react";

import CSVUploadPreviewCard from "@/components/dashboard/CSVUploadPreviewCard";
import ExchangeConnectionsCard from "@/components/dashboard/ExchangeConnectionsCard";
import FilingExportsCard from "@/components/dashboard/FilingExportsCard";
import TaxOptimizerCard from "@/components/dashboard/TaxOptimizerCard";
import TaxStrategySimulationCard from "@/components/dashboard/TaxStrategySimulationCard";
import TaxYearSummaryCard from "@/components/dashboard/TaxYearSummaryCard";
import TradeHistoryCard from "@/components/dashboard/TradeHistoryCard";

const quickActions = [
  {
    title: "Import trades",
    text: "Upload CSVs or map an exchange export.",
    href: "/csv/mapper",
    icon: Upload,
    color: "bg-[#9dff7a]",
  },
  {
    title: "Review tax year",
    text: "Check gains, disposals, and tax estimate.",
    href: "/dashboard/tax-summary",
    icon: Calculator,
    color: "bg-[#ffdf5d]",
  },
  {
    title: "File reports",
    text: "Download country-specific PDF and CSV exports.",
    href: "/dashboard/filing-center",
    icon: FileText,
    color: "bg-[#74e0ff]",
  },
];

const trustPillars = [
  ["Encrypted exchange vault", "Read-only API keys stay protected."],
  ["Tax-lot engine", "Lots, disposals, and strategies are rebuilt from trades."],
  ["Filing-ready exports", "USA, UK, India, Canada, and Australia flows are supported."],
];

function CommandMetric({ label, value, tone = "white" }) {
  const toneClass = {
    white: "bg-white text-black",
    green: "bg-[#9dff7a] text-black",
    yellow: "bg-[#ffdf5d] text-black",
  }[tone];

  return (
    <div className={`${toneClass} rounded-lg border-2 border-black p-4 shadow-[5px_5px_0_#111]`}>
      <p className="text-xs font-black uppercase text-black/60">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tighter">{value}</p>
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-black uppercase text-zinc-500">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black tracking-tighter text-black md:text-4xl">{title}</h2>
      </div>
      {text ? <p className="max-w-xl font-semibold leading-relaxed text-zinc-600">{text}</p> : null}
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-white text-black">
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-12">
          <section className="overflow-hidden rounded-lg border-2 border-black bg-[#f4f4f0] shadow-[12px_12px_0_#111]">
            <div className="grid gap-0 lg:grid-cols-[1fr_0.86fr]">
              <div className="border-b-2 border-black p-6 sm:p-8 lg:border-b-0 lg:border-r-2 lg:p-10">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase">
                  <ShieldCheck className="h-4 w-4" />
                  Crypto tax control center
                </div>
                <h1 className="max-w-4xl text-6xl font-black leading-[0.86] tracking-tighter sm:text-7xl lg:text-8xl">
                  Know your tax position before the next trade.
                </h1>
                <p className="mt-6 max-w-2xl text-xl font-bold leading-tight text-zinc-700">
                  Connect exchanges, import CSVs, rebuild tax lots, compare strategies, and export filing reports from one command center.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/csv/mapper"
                    className="inline-flex h-14 items-center justify-center rounded-full bg-black px-7 text-sm font-black uppercase text-white transition hover:bg-zinc-800"
                  >
                    Import trades
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                  <Link
                    href="/dashboard/filing-center"
                    className="inline-flex h-14 items-center justify-center rounded-full border-2 border-black bg-white px-7 text-sm font-black uppercase text-black transition hover:bg-[#ffdf5d]"
                  >
                    Prepare filing
                  </Link>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 lg:p-10">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-zinc-500">System snapshot</p>
                    <h2 className="text-3xl font-black tracking-tighter">Trader OS</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black text-white">
                    <WalletCards className="h-6 w-6" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  <CommandMetric label="Import paths" value="CSV + API" tone="green" />
                  <CommandMetric label="Tax regimes" value="5" tone="yellow" />
                  <CommandMetric label="Strategies" value="FIFO+" />
                </div>
                <div className="mt-6 space-y-3">
                  {trustPillars.map(([title, text]) => (
                    <div key={title} className="rounded-lg border-2 border-black bg-[#f4f4f0] p-4">
                      <div className="flex items-start gap-3">
                        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-black">{title}</p>
                          <p className="text-sm font-semibold text-zinc-600">{text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="Start here"
              title="Pick the next move"
              text="The dashboard is organized around the actions that build trust: get data in, understand the tax impact, then export clean reports."
            />
            <div className="grid gap-4 md:grid-cols-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-lg border-2 border-black bg-white p-5 shadow-[6px_6px_0_#111] transition hover:-translate-y-1"
                >
                  <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-md border-2 border-black ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter">{action.title}</h3>
                  <p className="mt-2 font-semibold text-zinc-600">{action.text}</p>
                  <span className="mt-5 inline-flex items-center text-sm font-black uppercase">
                    Open
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="File"
              title="Turn your ledger into filing-ready reports"
              text="This is the highest-value workflow today: choose the tax region, review the numbers, and export reports your accountant can work with."
            />
            <div className="grid items-stretch gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <FilingExportsCard />
              <div className="rounded-lg border-2 border-black bg-[#f4f4f0] p-6 shadow-[6px_6px_0_#111]">
                <p className="text-xs font-black uppercase text-zinc-500">Filing coverage</p>
                <h3 className="mt-3 text-4xl font-black leading-none tracking-tighter">
                  USA, UK, India, Canada, and Australia.
                </h3>
                <p className="mt-4 max-w-2xl font-semibold leading-relaxed text-zinc-600">
                  Reports are generated from normalized trades, matched lots, and disposal summaries. Export PDFs for review and CSVs for deeper accountant workflows.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Form 8949", "Schedule VDA", "UK CGT", "T5008", "AUS CGT"].map((item) => (
                    <span key={item} className="rounded-full border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="Connect"
              title="Bring your exchange data into the vault"
              text="A trustworthy dashboard starts with clear source data. Connect read-only APIs or import CSV files before reviewing tax outcomes."
            />
            <div className="grid items-stretch gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <ExchangeConnectionsCard />
              <CSVUploadPreviewCard />
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="Optimize"
              title="Find the tax-aware move"
              text="See harvest opportunities and compare sell strategies before you create a taxable event."
            />
            <div className="grid gap-5">
              <TaxOptimizerCard />
              <TaxStrategySimulationCard />
            </div>
          </section>

          <section>
            <SectionHeader
              eyebrow="Review"
              title="Audit gains, trades, and filing readiness"
              text="Use the summary and ledger views to understand what happened before sending reports to an accountant."
            />
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-5">
                <TaxYearSummaryCard />
              </div>
              <TradeHistoryCard />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
