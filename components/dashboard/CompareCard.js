"use client";
import { useState } from "react";

export default function CompareCard({ asset, quantity }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async () => {
    setLoading(true);

    const res = await fetch("/api/simulate/compare", {
      method: "POST",
      body: JSON.stringify({
        asset,
        quantity: Number(quantity)
      }),
      headers: { "Content-Type": "application/json" }
    });

    const result = await res.json();
    setData(result);

    setLoading(false);
  };

  return (
    <div>
      <button onClick={compare}>
        {loading ? "Comparing..." : "Compare Strategies"}
      </button>

      {data && (
        <div>
          <h3>🔥 Best: {data.bestStrategy}</h3>
          <p>Saved: {data.maxSavings}</p>
        </div>
      )}
    </div>
  );
}