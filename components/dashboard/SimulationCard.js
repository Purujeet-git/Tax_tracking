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

export default function SimulationCard() {
  const [asset, setAsset] = useState("BTC");
  const [quantity, setQuantity] = useState("");
  const [strategy, setStrategy] = useState("FIFO");
  const [result, setResult] = useState(null);

  const simulateSell = async () => {
    const res = await fetch("/api/simulate/sell", {
      method: "POST",
      body: JSON.stringify({
        asset,
        quantity: Number(quantity),
        strategy
      }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    setResult(data.simulation);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-4 space-y-4">

        <h2 className="text-xl font-semibold">Sell Simulation</h2>

        <Select onValueChange={setAsset} defaultValue="BTC">
          <SelectTrigger>
            <SelectValue placeholder="Select Asset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BTC">BTC</SelectItem>
            <SelectItem value="ETH">ETH</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Enter Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />

        <Select onValueChange={setStrategy} defaultValue="FIFO">
          <SelectTrigger>
            <SelectValue placeholder="Strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIFO">FIFO</SelectItem>
            <SelectItem value="HIFO">HIFO</SelectItem>
            <SelectItem value="LIFO">LIFO</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={simulateSell}>
          Simulate Sell
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