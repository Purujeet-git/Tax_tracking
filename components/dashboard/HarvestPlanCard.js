"use client";
import { useState } from "react";

export default function HarvestPlanCard() {
  const [data, setData] = useState(null);

  const fetchPlan = async () => {
    const res = await fetch("/api/lots/harvest-plan");
    const json = await res.json();
    setData(json);
  };

  return (
    <div>
      <button onClick={fetchPlan}>Harvest All</button>

      {data && (
        <div>
          <h3>Recommended: {data.recommendedStrategy}</h3>
        </div>
      )}
    </div>
  );
}