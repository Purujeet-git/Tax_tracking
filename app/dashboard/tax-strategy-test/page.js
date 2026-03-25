"use client";

import { useState } from "react";

export default function TaxStrategyTestPage() {
  const [strategy, setStrategy] = useState("FIFO");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);

  const runRecompute = async () => {
  setLoading(true);
  setResult(null);
  setSummary(null);

  try {
    const res = await fetch("/api/tax/recompute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ strategy })
    });

    const data = await res.json();
    setResult(data);

    // ⭐ AUTO FETCH SUMMARY AFTER RECOMPUTE
    const sumRes = await fetch("/api/tax/realized-summary");
    const sumData = await sumRes.json();
    setSummary(sumData.summary);

  } catch (err) {
    console.log(err);
    setResult({ error: "Failed to recompute" });
  }

  setLoading(false);
};

  const fetchSummary = async () => {
  const res = await fetch("/api/tax/realized-summary");
  const data = await res.json();
  setSummary(data.summary);
  console.log(data.summary);
};

  return (
    <div className="flex flex-col items-center justify-center gap-20" style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>🧪 Tax Strategy Engine Test</h1>

      <div style={{ marginTop: 20 }}>
        <label>Select Strategy:</label>

        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          style={{ marginLeft: 10, padding: 6 }}
        >
          <option value="FIFO">FIFO</option>
          <option value="HIFO">HIFO</option>
          <option value="LIFO">LIFO</option>
          <option value="SPECIFIC_ID">SPECIFIC_ID</option>
          <option value="ACB">ACB</option>
          <option value="UK">UK</option>
        </select>
      </div>

      <button
        onClick={runRecompute}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: "white",
          color: "black",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        {loading ? "Running..." : "Run Recompute"}
      </button>


      {result && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 8
          }}
        >
          <h3>Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <button onClick={fetchSummary} style={{ marginLeft: 20 }}>
  Fetch Realized Summary
</button>

{summary && (
  <div style={{ marginTop: 20 }}>
    <h3>Realized Gain Summary</h3>
    <pre>{JSON.stringify(summary, null, 2)}</pre>
  </div>
)}
    </div>
  );
}   