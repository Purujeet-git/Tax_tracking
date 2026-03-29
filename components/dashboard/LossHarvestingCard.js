"use client";
import { useState } from "react";

export default function LossHarvestingCard() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const res = await fetch("/api/lots/loss-harvesting");
    const json = await res.json();
    setData(json.opportunities);
  };

  return (
    <div>
      <button onClick={fetchData}>Find Tax Savings</button>

      {data?.map((lot) => (
        <div key={lot.lotId}>
          <p>{lot.asset}</p>
          <p>Loss: {lot.totalLoss}</p>
        </div>
      ))}
    </div>
  );
}