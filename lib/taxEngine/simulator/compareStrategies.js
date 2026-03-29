import { simulateSell } from "./simulateSell";
import { getLivePrice } from "@/lib/valuation/getLivePrice";

export async function compareStrategies({
  userId,
  asset,
  quantity
}) {
  const strategies = ["FIFO", "HIFO", "LIFO"];

  const results = [];

  // ✅ Fetch price ONCE
  const livePrice = await getLivePrice(asset);

  if (!livePrice) {
    return {
      error: "Price unavailable"
    };
  }

  for (const strategy of strategies) {
    const simulation = await simulateSell({
      userId,
      asset,
      quantity,
      strategy,
      price: livePrice // ✅ same price for all
    });

    results.push({
      strategy,
      totalGain: simulation.totalGain,
      shortTermGain: simulation.shortTermGain,
      longTermGain: simulation.longTermGain
    });
  }

  // 🔥 Sort best → worst
  results.sort((a, b) => b.totalGain - a.totalGain);

  const best = results[0];
  const worst = results[results.length - 1];

  const maxSavings = best.totalGain - worst.totalGain;

  return {
    bestStrategy: best.strategy,
    priceUsed: livePrice, // ✅ useful for UI
    maxSavings: Number(maxSavings.toFixed(8)),
    results
  };
}