"use client";

import SimulationCard from "@/components/dashboard/SimulationCard";
import CompareCard from "@/components/dashboard/CompareCard";
import LossHarvestingCard from "@/components/dashboard/LossHarvestingCard";
import HarvestPlanCard from "@/components/dashboard/HarvestPlanCard";
import SyncSection from "@/components/dashboard/SyncSection";

export default function Dashboard() {
  return (
    <div className="p-6 bg-black min-h-screen text-white">

      <h1 className="text-3xl font-bold mb-6">
        🚀 Trader OS Dashboard
      </h1>

      <SyncSection />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <SimulationCard />
        <CompareCard />
        <LossHarvestingCard />
        <HarvestPlanCard />
      </div>

    </div>
  );
}