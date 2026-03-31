"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function TopRecommendationCard({ plan }) {
  if (!plan || !plan.actions || plan.actions.length === 0) {
    return null;
  }

  // 🧠 Find best action
  const bestAction = [...plan.actions].sort(
    (a, b) => b.taxSaved - a.taxSaved
  )[0];

  const formatCurrency = (num) =>
    `₹${(num || 0).toLocaleString("en-IN")}`;

  return (
    <Card className="bg-green-900/20 text-white border border-green-700">
      <CardContent className="p-4 space-y-3">

        {/* TITLE */}
        <p className="text-green-400 font-semibold">
          💡 Best Recommendation
        </p>

        {/* ACTION */}
        <div className="text-lg font-semibold">
          Sell {bestAction.quantity} {bestAction.asset}
        </div>

        {/* SAVING */}
        <p className="text-green-300">
          Save {formatCurrency(bestAction.taxSaved)}
        </p>

        {/* OPTIONAL REASON */}
        <p className="text-sm text-zinc-400">
          {bestAction.reason}
        </p>

      </CardContent>
    </Card>
  );
}   