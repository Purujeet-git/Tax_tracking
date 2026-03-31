"use client";

import { useState,useEffect } from "react";

import SyncSection from "@/components/dashboard/SyncSection";
import SimulationCard from "@/components/dashboard/SimulationCard";
import CompareCard from "@/components/dashboard/CompareCard";
import LossHarvestingCard from "@/components/dashboard/LossHarvestingCard";
import HarvestPlanCard from "@/components/dashboard/HarvestPlanCard";
import TopRecommendationCard from "@/components/dashboard/TopRecommendationCard";
import CSVUploadPreviewCard from "@/components/dashboard/CSVUploadPreviewCard";
import CompareStrategiesCard from "@/components/dashboard/CompareStrategiesCard";
import TaxYearSummaryCard from "@/components/dashboard/TaxYearSummaryCard";

export default function Dashboard() {
  const [asset, setAsset] = useState("BTC");
  const [quantity, setQuantity] = useState("");
const [plan, setPlan] = useState(null);

useEffect(() => {
  const fetchPlan = async () => {
    const res = await fetch("/api/lots/harvest-plan");
    const json = await res.json();
    if (json.success) setPlan(json.plan);
  };

  fetchPlan();
}, []);
  return (
    <div className="min-h-screen bg-black gap-10 text-white p-6">
      
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">
        🚀 Trader OS Dashboard
      </h1>

      {/* Sync */}
      <SyncSection />

      {/* Grid Layout */}
      <div className="grid text-white grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <TopRecommendationCard plan={plan} />
        <TaxYearSummaryCard/>

        <SimulationCard
          asset={asset}
          setAsset={setAsset}
          quantity={quantity}
          setQuantity={setQuantity}
        />

        <CompareCard
          asset={asset}
          quantity={quantity}
        />

        <LossHarvestingCard />

        <HarvestPlanCard />

      </div>
      <CSVUploadPreviewCard/>

      <CompareStrategiesCard/>
    </div>
  );
}