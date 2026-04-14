import Link from "next/link";
import Image from "next/image";
import AdaptiveAuthButton from "@/components/landing/AdaptiveAuthButton";

const chains = [
  "Binance",
  "Coinbase",
  "Kraken",
  "WazirX",
  "KuCoin",
  "Bybit",
  "Gemini",
  "CoinDCX",
  "CoinSpot",
  "Luno",
  "Newton",
  "Crypto.com",
];

const stats = [
  ["12+", "exchange formats"],
  ["5", "tax regimes"],
  ["FIFO", "HIFO, LIFO, ACB"],
];

const features = [
  {
    title: "One ledger for every trade",
    text: "Import exchange CSVs, normalize messy fills, and rebuild your cost basis without stitching spreadsheets together.",
  },
  {
    title: "Tax moves before year end",
    text: "See harvest candidates, strategy comparisons, and projected gains while there is still time to act.",
  },
  {
    title: "Filing exports ready",
    text: "Generate country-specific reports and downloadable tax files from the same transaction history.",
  },
];

const faq = [
  [
    "Can I import trades from multiple exchanges?",
    "Yes. Trader OS is built around normalized imports, so each source lands in one consistent tax ledger.",
  ],
  [
    "Does it only support one tax method?",
    "No. You can compare FIFO, HIFO, LIFO, ACB, and specific-identification style strategies where supported.",
  ],
  [
    "Is this meant for active traders?",
    "Yes. The product is designed for high-volume crypto activity where tax lots, disposals, and unrealized PnL need constant attention.",
  ],
];

function MiniChart() {
  return (
    <div className="grid h-28 grid-cols-12 items-end gap-1.5">
      {[42, 62, 48, 74, 58, 82, 66, 88, 72, 96, 84, 104].map((height, index) => (
        <div
          key={index}
          className="rounded-t bg-black"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div className="absolute -left-8 top-12 hidden h-28 w-28 rotate-[-10deg] items-center justify-center rounded-lg border-2 border-black bg-[#ffdf5d] text-center text-sm font-black uppercase md:flex">
        Loss
        <br />
        alert
      </div>
      <div className="absolute -right-6 bottom-16 hidden h-24 w-32 rotate-[8deg] items-center justify-center rounded-lg border-2 border-black bg-[#74e0ff] text-center text-sm font-black uppercase md:flex">
        FIFO
        <br />
        ready
      </div>
      <div className="overflow-hidden rounded-lg border-2 border-black bg-white shadow-[12px_12px_0_#111]">
        <div className="flex items-center justify-between border-b-2 border-black bg-[#f4f4f0] px-4 py-3">
          <div className="flex gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5c5c]" />
            <span className="h-3 w-3 rounded-full bg-[#ffcf5c]" />
            <span className="h-3 w-3 rounded-full bg-[#35c96e]" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.18em]">Trader OS console</p>
        </div>
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b-2 border-black p-5 lg:border-b-0 lg:border-r-2">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase text-zinc-500">Projected 2026 tax</p>
                <h3 className="mt-1 text-4xl font-black tracking-tighter text-black">$18,420</h3>
              </div>
              <span className="rounded-full bg-[#9dff7a] px-4 py-2 text-sm font-black text-black">
                -24.8%
              </span>
            </div>
            <MiniChart />
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Realized", "Harvest", "Unrealized"].map((label, index) => (
                <div key={label} className="rounded-md border-2 border-black p-3">
                  <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
                  <p className="mt-2 text-lg font-black">
                    {["$42.1k", "$8.6k", "$19.4k"][index]}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5">
            <p className="mb-4 text-sm font-black uppercase text-zinc-500">Next best actions</p>
            {[
              ["Sell SOL lot", "Harvest $1,840 loss"],
              ["Hold BTC lot", "Wash window active"],
              ["Export Form 8949", "428 disposals ready"],
            ].map(([title, text]) => (
              <div key={title} className="mb-3 rounded-md border-2 border-black bg-white p-4">
                <p className="font-black">{title}</p>
                <p className="text-sm font-semibold text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-black">
      
      <main>
        <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid min-h-[calc(100vh-120px)] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="mb-6 inline-flex rounded-full border-2 border-black bg-[#9dff7a] px-4 py-2 text-sm font-black uppercase">
                  Crypto tax control center
                </p>
                <h1 className="text-[4.5rem] font-black leading-[0.82] tracking-tighter sm:text-[7rem] lg:text-[9rem]">
                  Take
                  <br />
                  Ctrl
                  <span className="inline-block">.</span>
                </h1>
                <p className="mt-8 max-w-xl text-xl font-bold leading-tight text-zinc-700 sm:text-2xl">
                  Optimize every trade, minimize every tax, and keep every exchange in one clean portfolio ledger.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex h-14 items-center justify-center rounded-full bg-black px-7 text-base font-black text-white transition hover:bg-zinc-800"
                  >
                    Start tracking
                  </Link>
                  <Link
                    href="/dashboard/tax-tools"
                    className="inline-flex h-14 items-center justify-center rounded-full border-2 border-black px-7 text-base font-black text-black transition hover:bg-[#ffdf5d]"
                  >
                    Compare strategies
                  </Link>
                </div>
              </div>
              <div className="relative">
                <ProductMockup />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y-2 border-black bg-black py-4 text-white">
          <div className="flex min-w-max animate-[marquee_28s_linear_infinite] gap-4 whitespace-nowrap px-4">
            {[...chains, ...chains].map((chain, index) => (
              <span key={`${chain}-${index}`} className="rounded-full border border-white/30 px-5 py-2 text-sm font-black uppercase">
                {chain}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-[#f4f4f0] px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-sm font-black uppercase text-zinc-500">One tax brain</p>
                <h2 className="mt-4 max-w-2xl text-5xl font-black leading-none tracking-tighter sm:text-7xl">
                  Every lot. Every disposal. Every country.
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {stats.map(([value, label]) => (
                  <div key={label} className="rounded-lg border-2 border-black bg-white p-5 shadow-[6px_6px_0_#111]">
                    <p className="text-4xl font-black tracking-tighter">{value}</p>
                    <p className="mt-3 text-sm font-black uppercase text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-lg border-2 border-black bg-white p-6">
                  <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-md bg-black">
                    <Image src="/TraderOS_Logo_Final.png" alt="" width={28} height={28} className="rounded" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tighter">{feature.title}</h3>
                  <p className="mt-4 font-semibold leading-relaxed text-zinc-600">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border-2 border-black bg-[#74e0ff] p-8">
              <p className="text-sm font-black uppercase">Level up</p>
              <h2 className="mt-4 text-5xl font-black leading-none tracking-tighter sm:text-7xl">
                Capture deductions before they disappear.
              </h2>
            </div>
            <div className="space-y-4">
              {faq.map(([question, answer]) => (
                <details key={question} className="rounded-lg border-2 border-black bg-white p-5">
                  <summary className="cursor-pointer text-xl font-black tracking-tighter">{question}</summary>
                  <p className="mt-4 font-semibold leading-relaxed text-zinc-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t-2 border-black bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/TraderOS_Logo_Final.png" alt="Trader OS" width={44} height={44} className="rounded-md" />
            <p className="text-2xl font-black tracking-tighter">Trader OS.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-black uppercase text-white/70">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/filing-center">Tax filing</Link>
            <Link href="/csv/upload">CSV upload</Link>
          </div>
        </div>
      </footer>
      <AdaptiveAuthButton />
    </div>
  );
}
