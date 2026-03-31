"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function SyncSection() {
  const [loading, setLoading] = useState(false);

  const sync = async () => {
    setLoading(true);

    await fetch("/api/binance/trades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apiKey: "qlM5QRf7UwgSntqJvc4YiK6us6waYJ3pIfygz5TQjNuYgdyt7WhpjGysWLtqJoxC",
        secret: "PXTm09KlyRYC63iMToLhbdaOh7PTo8vZ8DbraSJ1LzGee7q7hEKhgpDMDggvtT03"
      })
    });

    setLoading(false);
    alert("Sync Complete");
  };

  return (
    <Card className="bg-zinc-900 text-white border-zinc-800">
      <CardContent className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">🔄 Exchange Sync</h2>
        {/* <Button variant="ghost">Secondary</Button> */}

        <Button variant="secondary" onClick={sync}>
          {loading ? "Syncing..." : "Sync Binance"}
        </Button>
      </CardContent>
    </Card>
  );
}