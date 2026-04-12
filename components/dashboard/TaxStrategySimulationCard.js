"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

export default function TaxStrategySimulationCard() {
    const [asset, setAsset] = useState("BTC");
    const [quantity, setQuantity] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const simulateCompare = async () => {
        if (!quantity || Number(quantity) <= 0) return alert("Enter a valid quantity");

        setLoading(true);
        setError(null);
        setResults(null);

        const strategies = ["FIFO", "LIFO", "HIFO"];
        const simResults = [];

        try {
            for (const strat of strategies) {
                const res = await fetch("/api/simulate/sell", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ asset, quantity: Number(quantity), strategy: strat }),
                });
                const data = await res.json();

                if (!data.success && data.error) throw new Error(data.error);
                if (data.simulation?.error) throw new Error(data.simulation.error);

                simResults.push({
                    strategy: strat,
                    totalGain: data.simulation.totalGain,
                    shortTermGain: data.simulation.shortTermGain,
                    longTermGain: data.simulation.longTermGain,
                });
            }

            try {
                const res = await fetch("/api/simulate/sell", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ asset, quantity: Number(quantity), strategy: "ACB" }),
                });
                const data = await res.json();
                if (data.success && !data.simulation?.error) {
                    simResults.push({
                        strategy: "ACB",
                        totalGain: data.simulation.totalGain,
                        shortTermGain: data.simulation.shortTermGain,
                        longTermGain: data.simulation.longTermGain,
                    });
                }
            } catch {
                // ACB can be unavailable for some datasets.
            }

            const sorted = [...simResults].sort((a, b) => a.totalGain - b.totalGain);
            setResults({
                data: sorted,
                best: sorted[0],
                estimatedSaved: sorted.length > 1 ? sorted[sorted.length - 1].totalGain - sorted[0].totalGain : 0,
            });
        } catch (err) {
            console.error(err);
            setError(err.message || "Simulation failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (num) => `₹${Number(num || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

    return (
        <Card className="h-full rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
            <CardContent className="p-5">
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                    <div>
                        <p className="text-xs font-black uppercase text-zinc-500">Strategy simulator</p>
                        <h2 className="mt-1 text-3xl font-black tracking-tighter">Compare before selling</h2>
                    </div>
                    <p className="max-w-xl text-sm font-semibold text-zinc-600">
                        Estimate taxable impact across FIFO, LIFO, HIFO, and ACB where available.
                    </p>
                </div>

                <div className="grid gap-4 rounded-md border-2 border-black bg-[#f4f4f0] p-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-zinc-500">Asset to sell</label>
                        <Select value={asset} onValueChange={setAsset}>
                            <SelectTrigger className="border-2 border-black bg-white font-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BTC">BTC</SelectItem>
                                <SelectItem value="ETH">ETH</SelectItem>
                                <SelectItem value="SOL">SOL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-zinc-500">Quantity</label>
                        <Input
                            placeholder="e.g. 1.5"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="border-2 border-black bg-white font-mono"
                        />
                    </div>

                    <div className="flex items-end">
                        <Button
                            onClick={simulateCompare}
                            disabled={loading || !quantity}
                            className="h-11 w-full rounded-full bg-black font-black uppercase text-white hover:bg-zinc-800"
                        >
                            {loading ? "Running..." : "Compare"}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="mt-4 rounded-md border-2 border-black bg-[#ff5c5c] p-3 font-black text-black">
                        Cannot simulate: {error}
                    </div>
                )}

                {results && !error && (
                    <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                        <div className="space-y-3">
                            <div className="rounded-md border-2 border-black bg-[#9dff7a] p-4">
                                <p className="text-xs font-black uppercase text-black/60">Best strategy</p>
                                <p className="mt-1 text-2xl font-black">{results.best.strategy}</p>
                                <p className="mt-2 font-semibold">
                                    Lowest gain: {formatMoney(results.best.totalGain)}
                                </p>
                            </div>

                            <div className="max-h-64 space-y-2 overflow-auto pr-1">
                                {results.data.map((s) => (
                                    <div key={s.strategy} className="flex items-center justify-between rounded-md border-2 border-black bg-[#f4f4f0] p-3">
                                        <div>
                                            <p className="font-black">{s.strategy}</p>
                                            <p className="text-xs font-semibold text-zinc-600">
                                                ST: {formatMoney(s.shortTermGain)} | LT: {formatMoney(s.longTermGain)}
                                            </p>
                                        </div>
                                        <p className={s.totalGain > 0 ? "font-black text-[#dc2626]" : "font-black text-[#15803d]"}>
                                            {formatMoney(s.totalGain)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="min-h-[280px] rounded-md border-2 border-black bg-white p-4">
                            <p className="mb-4 text-xs font-black uppercase text-zinc-500">Taxable gain impact</p>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={results.data} margin={{ left: -20, right: 0 }}>
                                    <XAxis dataKey="strategy" stroke="#111" tick={{ fill: "#111", fontWeight: 800 }} />
                                    <YAxis stroke="#111" tick={{ fill: "#111" }} tickFormatter={(value) => `₹${value / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: "#f4f4f0" }}
                                        contentStyle={{ backgroundColor: "#fff", border: "2px solid #111", color: "#111" }}
                                        formatter={(value) => formatMoney(value)}
                                    />
                                    <Bar
                                        dataKey="totalGain"
                                        shape={(props) => {
                                            const { x, y, width, height, payload } = props;
                                            const isBest = payload.strategy === results.best.strategy;
                                            return <rect x={x} y={y} width={width} height={height} fill={isBest ? "#9dff7a" : "#111111"} rx={4} />;
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
