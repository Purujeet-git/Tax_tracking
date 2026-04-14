"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BrainCircuit,
  Calculator,
  CheckCircle2,
  DatabaseZap,
  Loader2,
  ShieldAlert,
  Sparkles,
  TrendingDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const strategyOptions = ["FIFO", "LIFO", "HIFO", "ACB"];
const assets = ["BTC", "ETH", "SOL", "MATIC"];

const futureTools = [
  {
    title: "When to sell",
    text: "Use live lots, unrealized PnL, and tax rules to rank the next sell action.",
    status: "Active base",
    icon: TrendingDown,
    color: "bg-[#9dff7a]",
  },
  {
    title: "Tax loss harvesting",
    text: "Find underwater holdings that can offset gains before filing season.",
    status: "Active",
    icon: Sparkles,
    color: "bg-[#ffdf5d]",
  },
  {
    title: "Wash-sale guardrails",
    text: "Flag risky repurchases and region-specific holding period issues.",
    status: "Next",
    icon: ShieldAlert,
    color: "bg-[#74e0ff]",
  },
  {
    title: "Portfolio rebalance AI",
    text: "Suggest exits that improve tax outcome without ignoring concentration risk.",
    status: "Planned",
    icon: BrainCircuit,
    color: "bg-white",
  },
];

function formatMoney(num) {
  return `INR ${Number(num || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function ToolBadge({ children, tone = "white" }) {
  const tones = {
    white: "bg-white",
    green: "bg-[#9dff7a]",
    yellow: "bg-[#ffdf5d]",
    blue: "bg-[#74e0ff]",
  };

  return (
    <span className={`${tones[tone]} rounded-full border-2 border-black px-3 py-1 text-xs font-black uppercase`}>
      {children}
    </span>
  );
}

function ResultPill({ label, value, tone = "neutral" }) {
  const color = {
    neutral: "text-black",
    gain: "text-[#dc2626]",
    save: "text-[#15803d]",
  }[tone];

  return (
    <div className="rounded-md border-2 border-black bg-white p-3">
      <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
      <p className={`mt-1 font-black ${color}`}>{value}</p>
    </div>
  );
}

export default function TaxToolsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [asset, setAsset] = useState("BTC");
  const [quantity, setQuantity] = useState("");
  const [strategy, setStrategy] = useState("FIFO");
  const [simulation, setSimulation] = useState(null);
  const [compare, setCompare] = useState(null);
  const [toolLoading, setToolLoading] = useState(null);
  const [engineResult, setEngineResult] = useState(null);
  const [error, setError] = useState(null);

  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadPlan = async () => {
      try {
        setPlanLoading(true);
        const res = await fetch("/api/lots/harvest-plan");
        const json = await res.json();
        if (json.success && json.plan) setPlan(json.plan);
      } catch (err) {
        console.error("Failed to load intelligent plan", err);
      } finally {
        setPlanLoading(false);
      }
    };

    loadPlan();
  }, []);

  const bestAction = useMemo(() => {
    if (!plan?.actions?.length) return null;
    return [...plan.actions].sort((a, b) => Number(b.taxSaved || 0) - Number(a.taxSaved || 0))[0];
  }, [plan]);

  const runSimulation = async (override = {}) => {
    const targetAsset = override.asset || asset;
    const targetQuantity = Number(override.quantity || quantity);
    const targetStrategy = override.strategy || strategy;

    if (!targetAsset || !targetQuantity || targetQuantity <= 0) {
      setError("Enter a valid asset and quantity before running the AI check.");
      return;
    }

    setToolLoading("simulate");
    setError(null);
    setSimulation(null);

    try {
      const res = await fetch("/api/simulate/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: targetAsset,
          quantity: targetQuantity,
          strategy: targetStrategy,
        }),
      });
      const data = await res.json();

      if (!data.success && data.error) throw new Error(data.error);
      if (data.simulation?.error) throw new Error(data.simulation.error);

      setSimulation({
        asset: targetAsset,
        quantity: targetQuantity,
        strategy: targetStrategy,
        ...data.simulation,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Simulation failed.");
    } finally {
      setToolLoading(null);
    }
  };

  const compareStrategies = async () => {
    const targetQuantity = Number(quantity);
    if (!targetQuantity || targetQuantity <= 0) {
      setError("Enter a valid quantity before comparing strategies.");
      return;
    }

    setToolLoading("compare");
    setError(null);
    setCompare(null);

    try {
      const results = [];

      for (const option of strategyOptions) {
        try {
          const res = await fetch("/api/simulate/sell", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ asset, quantity: targetQuantity, strategy: option }),
          });
          const data = await res.json();
          if (data.success && !data.simulation?.error) {
            results.push({ strategy: option, ...data.simulation });
          }
        } catch {
          // Some strategies may be unavailable for the current data.
        }
      }

      if (!results.length) throw new Error("No strategies returned a valid simulation.");

      const sorted = results.sort((a, b) => Number(a.totalGain || 0) - Number(b.totalGain || 0));
      setCompare(sorted);
    } catch (err) {
      console.error(err);
      setError(err.message || "Strategy comparison failed.");
    } finally {
      setToolLoading(null);
    }
  };

  const runEngineAction = async (type) => {
    const endpoint = type === "lots" ? "/api/tax/generate-lots" : "/api/tax/run-fifo";
    setToolLoading(type);
    setEngineResult(null);
    setError(null);

    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      setEngineResult({ type, data });
    } catch (err) {
      console.error(err);
      setError("Tax engine action failed.");
    } finally {
      setToolLoading(null);
    }
  };

  const applyBestAction = () => {
    if (!bestAction) return;
    setAsset(bestAction.asset);
    setQuantity(String(bestAction.quantity));
    setStrategy("FIFO");
    runSimulation({
      asset: bestAction.asset,
      quantity: bestAction.quantity,
      strategy: "FIFO",
    });
  };

  if (status === "loading" || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-black sm:px-6 lg:px-8">
      <main className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase transition hover:bg-[#ffdf5d]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Dashboard
        </Link>

        <section className="overflow-hidden rounded-lg border-2 border-black bg-[#f4f4f0] shadow-[12px_12px_0_#111]">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
            <div className="border-b-2 border-black p-6 sm:p-8 lg:border-b-0 lg:border-r-2 lg:p-10">
              <ToolBadge tone="yellow">Trader OS tools</ToolBadge>
              <h1 className="mt-5 max-w-4xl text-6xl font-black leading-[0.86] tracking-tighter md:text-7xl">
                Intelligent trading tax tools.
              </h1>
              <p className="mt-5 max-w-2xl text-xl font-bold leading-tight text-zinc-700">
                Check when to sell, compare tax strategies, harvest losses, and prepare the AI features that will guide every taxable move.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={applyBestAction}
                  disabled={!bestAction || toolLoading === "simulate"}
                  className="h-14 rounded-full bg-black px-7 text-sm font-black uppercase text-white hover:bg-zinc-800"
                >
                  {toolLoading === "simulate" ? "Checking..." : "Run best AI move"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Link
                  href="/dashboard/tax-summary"
                  className="inline-flex h-14 items-center justify-center rounded-full border-2 border-black bg-white px-7 text-sm font-black uppercase text-black transition hover:bg-[#9dff7a]"
                >
                  Review tax summary
                </Link>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 lg:p-10">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase text-zinc-500">AI recommendation</p>
                  <h2 className="text-3xl font-black tracking-tighter">When to sell</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-black text-white">
                  <Bot className="h-6 w-6" />
                </div>
              </div>

              {planLoading ? (
                <div className="rounded-lg border-2 border-black bg-[#f4f4f0] p-5 font-black">
                  Scanning current lots...
                </div>
              ) : bestAction ? (
                <div className="rounded-lg border-2 border-black bg-[#9dff7a] p-5">
                  <p className="text-xs font-black uppercase text-black/60">Best available move</p>
                  <p className="mt-2 text-4xl font-black tracking-tighter">
                    Sell {bestAction.quantity} {bestAction.asset}
                  </p>
                  <p className="mt-3 font-semibold text-black/75">
                    Estimated tax avoided: {formatMoney(bestAction.taxSaved)}.
                  </p>
                  <p className="mt-2 text-sm font-black">{bestAction.reason || "Tax-aware sell candidate"}</p>
                </div>
              ) : (
                <div className="rounded-lg border-2 border-black bg-[#f4f4f0] p-5">
                  <p className="font-black">No urgent sell move right now.</p>
                  <p className="mt-2 text-sm font-semibold text-zinc-600">
                    Import more trades or refresh lots to unlock stronger recommendations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {futureTools.map((tool) => (
            <Card key={tool.title} className="rounded-lg border-2 border-black bg-white py-0 shadow-[6px_6px_0_#111]">
              <CardContent className="p-5">
                <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-md border-2 border-black ${tool.color}`}>
                  <tool.icon className="h-6 w-6" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-2xl font-black tracking-tighter">{tool.title}</h3>
                  <span className="rounded-full border-2 border-black bg-[#f4f4f0] px-2 py-1 text-[10px] font-black uppercase">
                    {tool.status}
                  </span>
                </div>
                <p className="mt-3 font-semibold leading-relaxed text-zinc-600">{tool.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-lg border-2 border-black bg-white py-0 shadow-[6px_6px_0_#111]">
            <CardContent className="p-5">
              <p className="text-xs font-black uppercase text-zinc-500">Sell intelligence</p>
              <h2 className="mt-1 text-3xl font-black tracking-tighter">Simulate before selling</h2>
              <p className="mt-2 font-semibold text-zinc-600">
                Choose an asset, quantity, and tax-lot strategy to see the taxable impact before making a trade.
              </p>

              <div className="mt-5 grid gap-4 rounded-md border-2 border-black bg-[#f4f4f0] p-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-zinc-500">Asset</label>
                  <Select value={asset} onValueChange={setAsset}>
                    <SelectTrigger className="border-2 border-black bg-white font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-zinc-500">Quantity</label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder="e.g. 0.25"
                    className="border-2 border-black bg-white font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-zinc-500">Strategy</label>
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger className="border-2 border-black bg-white font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {strategyOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => runSimulation()}
                  disabled={toolLoading === "simulate"}
                  className="h-11 rounded-full bg-black px-6 font-black uppercase text-white hover:bg-zinc-800"
                >
                  {toolLoading === "simulate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                  Simulate sale
                </Button>
                <Button
                  onClick={compareStrategies}
                  disabled={toolLoading === "compare"}
                  className="h-11 rounded-full border-2 border-black bg-white px-6 font-black uppercase text-black hover:bg-[#ffdf5d]"
                >
                  {toolLoading === "compare" ? "Comparing..." : "Compare strategies"}
                </Button>
              </div>

              {error && (
                <div className="mt-4 rounded-md border-2 border-black bg-[#ff5c5c] p-3 font-black text-black">
                  {error}
                </div>
              )}

              {simulation && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <ResultPill label="Total gain/loss" value={formatMoney(simulation.totalGain)} tone={simulation.totalGain > 0 ? "gain" : "save"} />
                  <ResultPill label="Short term" value={formatMoney(simulation.shortTermGain)} />
                  <ResultPill label="Long term" value={formatMoney(simulation.longTermGain)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg border-2 border-black bg-[#f4f4f0] py-0 shadow-[6px_6px_0_#111]">
            <CardContent className="p-5">
              <p className="text-xs font-black uppercase text-zinc-500">AI roadmap</p>
              <h2 className="mt-1 text-3xl font-black tracking-tighter">Feature queue</h2>
              <div className="mt-5 space-y-3">
                {[
                  "Live sell alerts based on tax impact and market price.",
                  "Personalized exit windows for short-term versus long-term treatment.",
                  "Country-aware warnings for wash-sale and superficial-loss rules.",
                  "Natural-language AI assistant for portfolio tax questions.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-md border-2 border-black bg-white p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="font-semibold text-zinc-700">{item}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {compare && (
          <section className="rounded-lg border-2 border-black bg-white p-5 shadow-[6px_6px_0_#111]">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-black uppercase text-zinc-500">Strategy result</p>
                <h2 className="text-3xl font-black tracking-tighter">Lowest taxable outcome: {compare[0].strategy}</h2>
              </div>
              <ToolBadge tone="green">Best: {formatMoney(compare[0].totalGain)}</ToolBadge>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              {compare.map((item) => (
                <div key={item.strategy} className="rounded-md border-2 border-black bg-[#f4f4f0] p-4">
                  <p className="text-xl font-black">{item.strategy}</p>
                  <p className={`mt-2 font-black ${item.totalGain > 0 ? "text-[#dc2626]" : "text-[#15803d]"}`}>
                    {formatMoney(item.totalGain)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-zinc-600">
                    ST {formatMoney(item.shortTermGain)} | LT {formatMoney(item.longTermGain)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-lg border-2 border-black bg-black p-5 text-white shadow-[6px_6px_0_#999]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase text-white/60">Tax engine ops</p>
              <h2 className="mt-1 text-3xl font-black tracking-tighter">Refresh the ledger when data changes.</h2>
              <p className="mt-2 max-w-2xl font-semibold text-white/70">
                These are admin-style tools for rebuilding lots and running FIFO matching after imports.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => runEngineAction("lots")}
                disabled={toolLoading === "lots"}
                className="h-11 rounded-full bg-[#9dff7a] px-6 font-black uppercase text-black hover:bg-[#85ef62]"
              >
                <DatabaseZap className="mr-2 h-4 w-4" />
                {toolLoading === "lots" ? "Generating..." : "Generate lots"}
              </Button>
              <Button
                onClick={() => runEngineAction("fifo")}
                disabled={toolLoading === "fifo"}
                className="h-11 rounded-full border-2 border-white bg-black px-6 font-black uppercase text-white hover:bg-zinc-800"
              >
                {toolLoading === "fifo" ? "Running..." : "Run FIFO matching"}
              </Button>
            </div>
          </div>

          {engineResult && (
            <pre className="mt-5 max-h-56 overflow-auto rounded-md border-2 border-white bg-zinc-950 p-4 text-xs font-semibold text-white">
              {JSON.stringify(engineResult.data, null, 2)}
            </pre>
          )}
        </section>
      </main>
    </div>
  );
}
