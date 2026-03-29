"use client";

import { useState } from "react";

export default function SyncSection() {
  const [loading, setLoading] = useState(false);

  const syncBinance = async () => {
    setLoading(true);

    try {
      await fetch("/api/binance/trades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiKey: "YOUR_API_KEY",
          secret: "YOUR_SECRET_KEY"
        })
      });

      alert("✅ Sync Completed");
    } catch (err) {
      console.log(err);
      alert("❌ Sync failed");
    }

    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <h2>🔄 Exchange Sync</h2>

      <button
        onClick={syncBinance}
        style={{
          padding: "10px 20px",
          cursor: "pointer"
        }}
      >
        {loading ? "Syncing..." : "Sync Binance"}
      </button>
    </div>
  );
}