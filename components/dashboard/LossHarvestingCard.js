"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LossHarvestingCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(null);
  const [simulation, setSimulation] = useState(null);

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

  // 🧠 Simulate specific lot
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
          🔥 Loss Harvesting
        </h2>

        {/* FETCH BUTTON */}
        <Button onClick={fetchLoss}>
          {loading ? "Scanning..." : "Find Opportunities"}
        </Button>

        {/* RESULTS */}
        {data && (
          <div className="space-y-3">

            {data.map((lot) => (
              <div
                key={lot.lotId}
                className="bg-zinc-800 p-3 rounded space-y-2"
              >
                {/* ASSET */}
                <p className="font-semibold text-lg">{lot.asset}</p>

                {/* LOSS */}
                <p className="text-red-400">
                  📉 Loss: ₹{lot.totalLoss}
                </p>

                {/* TAX SAVING */}
                <p className="text-green-400">
                  💰 Tax Saving: ₹{lot.estimatedTaxSaving}
                </p>

                {/* PRICE INFO */}
                <p className="text-sm text-zinc-400">
                  Buy: ₹{lot.costPerUnit} → Now: ₹{lot.currentPrice}
                </p>

                {/* SIMULATE BUTTON */}
                <Button
                  onClick={() => simulateLot(lot)}
                  size="sm"
                  variant="secondary"
                >
                  {simLoading === lot.lotId
                    ? "Simulating..."
                    : "Simulate"}
                </Button>

                {/* SIMULATION RESULT */}
                {simulation?.lotId === lot.lotId && (
                  <div className="bg-black p-2 rounded text-sm space-y-1">
                    <p>📊 Total Gain: ₹{simulation.data.totalGain}</p>
                    <p>Short Term: ₹{simulation.data.shortTermGain}</p>
                    <p>Long Term: ₹{simulation.data.longTermGain}</p>
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