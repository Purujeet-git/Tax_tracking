"use client";

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function CompareStrategiesCard() {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCompare = async () => {
        try {
            setLoading(true);

            // console.log("Fetching compare strategies...");

            const res = await fetch("/api/tax/compare-strategies");
            const data = await res.json();

            // console.log("COMPARE API:", data);

            if (data.success) {
                setStrategies(data.strategies);
            }
        } catch (error) {
            console.error("COMPARE ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    const sorted = [...strategies].sort(
        (a, b) => a.totalGain - b.totalGain
    );

    const best = sorted[0];

    const estimatedSaved =
        strategies.length > 1
            ? sorted[sorted.length - 1].totalGain - best?.totalGain
            : 0;

    const formatMoney = (num) =>
        `₹${Number(num || 0).toFixed(2)}`;

    return (
        <Card className="bg-zinc-900 m-10 border-zinc-800 text-white">
            <CardContent className="p-4 space-y-4">
                <h2 className="text-xl font-semibold">
                    ⚖️ Compare Tax Strategies
                </h2>

                <Button onClick={fetchCompare}>
                    {loading ? "Comparing..." : "Compare Strategies"}
                </Button>

                {best && (
                    <div className="bg-black rounded p-3 space-y-1">
                        <p className="text-green-400 font-semibold">
                            🏆 Best Strategy: {best.strategy}
                        </p>
                        <p>
                            💰 Estimated Tax Saved:{" "}
                            {formatMoney(estimatedSaved)}
                        </p>
                        <p className="text-sm text-zinc-400">
                            Lowest realized gain among available methods
                        </p>
                    </div>
                )}

                {strategies.length > 0 && (
                    <div className="space-y-3">
                        {sorted.map((s) => (
                            <div
                                key={s.strategy}
                                className={`p-3 rounded border ${best?.strategy === s.strategy
                                        ? "border-green-500 bg-zinc-800"
                                        : "border-zinc-700 bg-zinc-900"
                                    }`}
                            >
                                <div className="flex justify-between">
                                    <p className="font-semibold">{s.strategy}</p>

                                    {best?.strategy === s.strategy && (
                                        <span className="text-green-400 text-sm">
                                            Recommended
                                        </span>
                                    )}
                                </div>

                                <p>📈 Total Gain: {formatMoney(s.totalGain)}</p>
                                <p className="text-sm text-zinc-400">
                                    Matched lots: {s.disposalCount}
                                </p>

                                {/* 🔍 NEW LOT BREAKDOWN */}
                                {s.matchedLots?.length > 0 && (
                                    <div className="mt-3 bg-black rounded p-3 space-y-2">
                                        <p className="font-medium text-sm">
                                            🔍 Matched BUY Lots
                                        </p>

                                        {s.matchedLots.map((lot, idx) => (
                                            <div
                                                key={idx}
                                                className="border-t border-zinc-700 pt-2 text-sm"
                                            >
                                                <p>
                                                    • {lot.quantity} {lot.asset}
                                                </p>
                                                <p>
                                                    Buy: {new Date(lot.buyDate).toLocaleDateString()}
                                                </p>
                                                <p>
                                                    Cost Basis: {formatMoney(lot.costBasis)}
                                                </p>
                                                <p>
                                                    Gain: {formatMoney(lot.gain)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {strategies.length > 0 && (
                    <div className="bg-black p-3 rounded">
                        <p className="mb-2 font-semibold">📊 Strategy Comparison</p>

                        <div className="w-full h-64">
                            <ResponsiveContainer>
                                <BarChart data={sorted}>
                                    <XAxis dataKey="strategy" />
                                    <YAxis />
                                    <Tooltip />

                                    <Bar
                                        dataKey="totalGain"
                                        shape={(props) => {
                                            const { x, y, width, height, payload } = props;
                                            const isBest = payload.strategy === best?.strategy;

                                            return (
                                                <rect
                                                    x={x}
                                                    y={y}
                                                    width={width}
                                                    height={height}
                                                    fill={isBest ? "#22c55e" : "#8884d8"}
                                                />
                                            );
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