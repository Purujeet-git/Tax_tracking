"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";

export default function TaxYearSummaryCard() {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const res = await fetch("/api/tax/year-summary");
                const data = await res.json();

                console.log("This is summary", data);

                // ✅ FIXED
                if (data.success) {
                    setSummary(data);
                }
            } catch (error) {
                console.error(
                    "Failed to fetch tax summary",
                    error
                );
            }
        };

        fetchSummary();
    }, []);

    const formatMoney = (num) =>
        `₹${Number(num || 0).toFixed(2)}`;

    if (!summary) {
        return (
            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-4">
                    Loading tax Summary...
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardContent className="p-4 space-y-3">
                <h2 className="text-xl font-semibold">
                    📄 Tax Year Summary
                </h2>

                <p className="text-zinc-400">
                    {summary.taxYear}
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black p-3 rounded">
                        <p className="text-sm text-zinc-400">
                            Realized Gain
                        </p>
                        <p className="font-semibold">
                            {formatMoney(
                                summary.realizedGain
                            )}
                        </p>
                    </div>

                    <div className="bg-black p-3 rounded">
                        <p className="text-sm text-zinc-400">
                            Estimated Tax
                        </p>
                        <p className="font-semibold text-red-400">
                            {formatMoney(
                                summary.estimatedTax
                            )}
                        </p>
                    </div>

                    <div className="bg-black p-3 rounded">
                        <p className="text-sm text-zinc-400">
                            Best Strategy
                        </p>
                        <p className="font-semibold text-green-400">
                            {summary.bestStrategy}
                        </p>
                    </div>

                    <div className="bg-black p-3 rounded">
                        <p className="text-sm text-zinc-400">
                            Harvest Saving
                        </p>
                        <p className="font-semibold text-green-400">
                            {formatMoney(
                                summary.potentialHarvestSaving
                            )}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-zinc-500">
                    Based on {summary.disposalCount} matched disposals
                </p>
            </CardContent>
        </Card>
    );
}