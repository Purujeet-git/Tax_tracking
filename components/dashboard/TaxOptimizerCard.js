"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TaxOptimizerCard() {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [simLoading, setSimLoading] = useState(null);
    const [simulation, setSimulation] = useState(null);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                setLoading(true);
                const res = await fetch("/api/lots/harvest-plan");
                const json = await res.json();

                if (json.success && json.plan) {
                    setPlan(json.plan);
                }
            } catch (err) {
                console.error("Failed to load AI tax plan", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, []);

    const simulateLot = async (action) => {
        setSimLoading(action.asset);
        setSimulation(null);

        try {
            const res = await fetch("/api/simulate/sell", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    asset: action.asset,
                    quantity: action.quantity,
                    strategy: "FIFO",
                }),
            });

            const result = await res.json();

            if (result.simulation?.error) {
                alert(`Simulation unavailable: ${result.simulation.error}`);
                setSimLoading(null);
                return;
            }

            setSimulation({ asset: action.asset, data: result.simulation });
        } catch (err) {
            console.error(err);
            alert("Simulation failed on the server.");
        }

        setSimLoading(null);
    };

    const formatCurrency = (num) => `₹${Number(num || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <Card className="flex h-48 items-center justify-center rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
                <p className="font-black">Scanning portfolio for savings...</p>
            </Card>
        );
    }

    if (!plan || !plan.actions || plan.actions.length === 0) {
        return (
            <Card className="rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
                <CardContent className="p-8 text-center">
                    <p className="text-xs font-black uppercase text-zinc-500">Tax optimizer</p>
                    <h3 className="mt-2 text-3xl font-black tracking-tighter">No harvest move right now.</h3>
                    <p className="mx-auto mt-3 max-w-xl font-semibold text-zinc-600">
                        We scanned your holdings and did not find underwater assets that need loss harvesting.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const bestAction = [...plan.actions].sort((a, b) => b.taxSaved - a.taxSaved)[0];

    return (
        <Card className="max-h-[720px] rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
            <CardContent className="flex max-h-[720px] flex-col p-0">
                <div className="border-b-2 border-black bg-[#9dff7a] p-6">
                    <p className="text-xs font-black uppercase text-black/60">Number 1 recommended move</p>
                    <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-4xl font-black tracking-tighter">
                                Sell {bestAction.quantity} {bestAction.asset}
                            </p>
                            {bestAction.warning ? (
                                <p className="mt-2 font-black text-black">{bestAction.warning}</p>
                            ) : (
                                <p className="mt-2 font-semibold text-black/70">
                                    Harvest an unrealized loss and potentially avoid {formatCurrency(bestAction.taxSaved)} in upcoming taxes.
                                </p>
                            )}
                        </div>
                        <Button
                            onClick={() => simulateLot(bestAction)}
                            className="h-11 shrink-0 rounded-full bg-black px-6 font-black uppercase text-white hover:bg-zinc-800"
                        >
                            {simLoading === bestAction.asset ? "Running..." : "Verify"}
                        </Button>
                    </div>

                    {simulation?.asset === bestAction.asset && (
                        <div className="mt-4 grid gap-3 rounded-md border-2 border-black bg-white p-4 text-sm sm:grid-cols-3">
                            <Result label="Triggered gain/loss" value={formatCurrency(simulation.data.totalGain)} negative={simulation.data.totalGain > 0} />
                            <Result label="Short term" value={formatCurrency(simulation.data.shortTermGain)} />
                            <Result label="Long term" value={formatCurrency(simulation.data.longTermGain)} />
                        </div>
                    )}
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-6">
                    <p className="mb-4 text-xs font-black uppercase text-zinc-500">All harvestable opportunities</p>
                    <div className="space-y-3">
                        {plan.actions.map((action, idx) => (
                            <div key={idx} className="rounded-md border-2 border-black bg-[#f4f4f0] p-4">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-black bg-white font-black">
                                            {action.asset.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-xl font-black leading-tight">{action.asset}</p>
                                            <p className="text-xs font-semibold text-zinc-600">Qty: {action.quantity}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <Result label="Estimated loss" value={formatCurrency(action.loss)} negative />
                                        <Result label="Tax avoided" value={`+${formatCurrency(action.taxSaved)}`} positive />
                                        {action.asset !== bestAction.asset && (
                                            <Button
                                                size="sm"
                                                onClick={() => simulateLot(action)}
                                                className="rounded-full border-2 border-black bg-white font-black text-black hover:bg-[#ffdf5d]"
                                            >
                                                {simLoading === action.asset ? "Checking..." : "Simulate"}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {simulation?.asset === action.asset && action.asset !== bestAction.asset && (
                                    <div className="mt-4 rounded-md border-2 border-black bg-white p-3 text-sm font-black">
                                        Total taxable impact:{" "}
                                        <span className={simulation.data.totalGain > 0 ? "text-[#dc2626]" : "text-[#15803d]"}>
                                            {formatCurrency(simulation.data.totalGain)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function Result({ label, value, positive = false, negative = false }) {
    const color = positive ? "text-[#15803d]" : negative ? "text-[#dc2626]" : "text-black";

    return (
        <div>
            <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
            <p className={`font-black ${color}`}>{value}</p>
        </div>
    );
}
