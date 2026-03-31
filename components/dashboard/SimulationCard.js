"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";

export default function SimulationCard({
  asset,
  setAsset,
  quantity,
  setQuantity
}) {
  const [strategy, setStrategy] = useState("FIFO");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    if (!quantity) return alert("Enter quantity");

    setLoading(true);

    const res = await fetch("/api/simulate/sell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        asset,
        quantity: Number(quantity),
        strategy
      })
    });

    const data = await res.json();
    setResult(data.simulation);

    setLoading(false);
  };

  return (
    <Card className="bg-zinc-900 text-white border-zinc-800">
      <CardContent className="p-4 space-y-4">

        <h2 className="text-xl font-semibold">Sell Simulation</h2>

        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BTC">BTC</SelectItem>
            <SelectItem value="ETH">ETH</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Enter Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <Select value={strategy} onValueChange={setStrategy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIFO">FIFO</SelectItem>
            <SelectItem value="HIFO">HIFO</SelectItem>
            <SelectItem value="LIFO">LIFO</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={simulate}>
          {loading ? "Simulating..." : "Simulate Sell"}
        </Button>

        {result && (
          <div className="bg-black p-3 rounded">
            <p>Total Gain: {result.totalGain}</p>
            <p>Short Term: {result.shortTermGain}</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}