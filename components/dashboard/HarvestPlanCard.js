"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatHarvestPlan } from "@/lib/taxEngine/intelligence/formatHarvestPlan";


export default function LossHarvestingCard() {
    const [data, setData] = useState(null);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [planLoading, setPlanLoading] = useState(false);
    const [simLoading, setSimLoading] = useState(null);
    const [simulation, setSimulation] = useState(null);
    const [useMock, setUseMock] = useState(true);
    const [mode, setMode] = useState("simple");

    // 🔍 Fetch opportunities
    const fetchLoss = async () => {
        setLoading(true);
        setData(null);

        try {
            const res = await fetch("/api/lots/loss-harvesting");
            const json = await res.json();

            setData(json.opportunities);
        } catch (err) {
            console.log(err);
            alert("Failed to fetch losses");
        }

        setLoading(false);
    };

    const fetchMockPlan = async () => {
        const res = await fetch("/mock/harvestPlan.json");
        return await res.json();
    };

    // 🧠 Generate full harvest plan
    const fetchPlan = async () => {
        setPlanLoading(true);
        setPlan(null);

        try {
            if (useMock) {
                // ✅ USE MOCK DATA
                console.log("Using MOCK data");
                const fetchMockPlan = async () => {
                    const res = await fetch("/mock/harvestPlan.json");
                    const data = await res.json();
                    return data;
                }
                const json = fetchMockPlan.json();
                setPlan(json);
            } else {
                // ✅ USE REAL API
                const res = await fetch("/api/lots/harvest-plan");
                const json = await res.json();

                if (json.success) {
                    setPlan(json.plan);
                }
            }
        } catch (err) {
            console.log(err);
            alert("Failed to generate plan");
        }

        setPlanLoading(false);
    };

    // 🧪 Simulate specific lot
    const simulateLot = async (lot) => {
        setSimLoading(lot.lotId);
        setSimulation(null);

        try {
            const res = await fetch("/api/simulate/sell", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    asset: lot.asset,
                    quantity: lot.quantity,
                    strategy: "FIFO"
                })
            });

            const result = await res.json();

            setSimulation({
                lotId: lot.lotId,
                data: result.simulation
            });
        } catch (err) {
            console.log(err);
            alert("Simulation failed");
        }

        setSimLoading(null);
    };

    return (
        <Card className="bg-zinc-900 text-white border-zinc-800">
            <CardContent className="p-4 space-y-4">

                {/* TITLE */}
                <h2 className="text-xl font-semibold">
                    Harvest Plan
                </h2>

                {/* ACTION BUTTONS */}
                <div className="flex gap-2 flex-wrap">
                    <Button onClick={fetchLoss}>
                        {loading ? "Scanning..." : "Find Opportunities"}
                    </Button>

                    <Button
                        variant="outline"
                        className="text-black"
                        onClick={() => setUseMock(!useMock)}
                    >
                        {useMock ? "Using Mock Data" : "Using Real Data"}
                    </Button>

                    <Button onClick={fetchPlan} variant="secondary">
                        {planLoading ? "Building Plan..." : "Generate Plan"}
                    </Button>

                    {/* TOGGLE */}
                    {plan && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                setMode(mode === "simple" ? "detailed" : "simple")
                            }
                        >
                            {mode === "simple" ? "Detailed View" : "Simple View"}
                        </Button>
                    )}
                </div>

                {/* 🧠 HARVEST PLAN OUTPUT */}
                {plan && (
                    <div className="bg-black p-3 rounded text-sm whitespace-pre-wrap">
                        {formatHarvestPlan(plan, mode)}
                    </div>
                )}

                {/* 🔍 OPPORTUNITIES LIST */}
                {data && (
                    <div className="space-y-3">

                        {data.map((lot) => (
                            <div
                                key={lot.lotId}
                                className="bg-zinc-800 p-3 rounded space-y-2"
                            >
                                <p className="font-semibold">{lot.asset}</p>

                                <p className="text-red-400">
                                    Loss: {lot.totalLoss}
                                </p>

                                <p className="text-green-400">
                                    Tax Saving: {lot.estimatedTaxSaving}
                                </p>

                                <p className="text-sm text-zinc-400">
                                    Buy: {lot.costPerUnit} → Now: {lot.currentPrice}
                                </p>

                                {/* 🔥 Simulate Button */}
                                <Button
                                    onClick={() => simulateLot(lot)}
                                    size="sm"
                                >
                                    {simLoading === lot.lotId
                                        ? "Simulating..."
                                        : "Simulate"}
                                </Button>

                                {/* 📊 Simulation Result */}
                                {simulation?.lotId === lot.lotId && (
                                    <div className="bg-black p-2 rounded text-sm">
                                        <p>Total Gain: {simulation.data.totalGain}</p>
                                        <p>Short: {simulation.data.shortTermGain}</p>
                                        <p>Long: {simulation.data.longTermGain}</p>
                                    </div>
                                )}

                            </div>
                        ))}

                    </div>
                )}

            </CardContent>
        </Card>
    );
}