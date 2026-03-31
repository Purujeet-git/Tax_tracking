"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CompareCard({ asset, quantity }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    if (!quantity) return alert("Enter quantity first");

    setLoading(true);
    setData(null);

    try {
      const res = await fetch("/api/simulate/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          asset,
          quantity: Number(quantity)
        })
      });

      const result = await res.json();

      console.log("COMPARE RESULT:", result); // 🧪 DEBUG

      setData(result);
    } catch (err) {
      console.log(err);
      alert("Compare failed");
    }

    setLoading(false);
  };

  return (
    <Card className="bg-zinc-900 text-white border-zinc-800">
      <CardContent className="p-4 space-y-4">

        <h2 className="text-xl font-semibold">Compare Strategies</h2>

        <Button onClick={compare}>
          {loading ? "Comparing..." : "Compare"}
        </Button>

        {/* RESULT */}
        {data && (
          <div className="space-y-3">

            <div className="bg-black p-3 rounded">
              <p className="text-green-400 font-semibold">
                🔥 Best: {data.bestStrategy}
              </p>
              <p>💰 Saved: {data.maxSavings}</p>
            </div>

            {/* ALL STRATEGIES */}
            <div className="space-y-2">
              {data.results?.map((r) => (
                <div
                  key={r.strategy}
                  className="bg-zinc-800 p-2 rounded"
                >
                  <p className="font-medium">{r.strategy}</p>
                  <p>Gain: {r.totalGain}</p>
                  <p>Short: {r.shortTermGain}</p>
                  <p>Long: {r.longTermGain}</p>
                </div>
              ))}
            </div>

          </div>
        )}

      </CardContent>
    </Card>
  );
}