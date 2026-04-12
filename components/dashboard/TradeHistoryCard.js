"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "../ui/card";

export default function TradeHistoryCard() {
    const [trades, setTrades] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchTrades = async () => {
            const res = await fetch("/api/trades/history");
            const data = await res.json();

            if (data.success) {
                setTrades(data.trades);
            }
        };

        fetchTrades();
    }, []);

    const filteredTrades = trades.filter((trade) => {
        const query = search.toLowerCase();

        return (
            (trade.baseAsset || trade.symbol)?.toLowerCase().includes(query) ||
            trade.side?.toLowerCase().includes(query) ||
            trade.exchange?.toLowerCase().includes(query)
        );
    });

    const formatMoney = (num) => `₹${Number(num || 0).toFixed(2)}`;

    return (
        <Card className="h-full max-h-[640px] rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
            <CardContent className="flex h-full min-h-0 flex-col p-5">
                <div className="mb-4">
                    <p className="text-xs font-black uppercase text-zinc-500">Ledger</p>
                    <h2 className="mt-1 text-2xl font-black tracking-tighter">
                        Trade history
                    </h2>
                </div>

                <input
                    type="text"
                    placeholder="Search asset, type, exchange..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mb-4 w-full rounded-md border-2 border-black bg-[#f4f4f0] p-3 text-sm font-semibold outline-none focus:bg-white"
                />

                <div className="min-h-0 flex-1 overflow-auto rounded-md border-2 border-black">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 border-b-2 border-black bg-black text-white">
                            <tr>
                                <th className="p-2 text-left">Date</th>
                                <th className="p-2 text-left">Asset</th>
                                <th className="p-2 text-left">Type</th>
                                <th className="p-2 text-right">Qty</th>
                                <th className="p-2 text-right">Price</th>
                                <th className="p-2 text-left">Exchange</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTrades.map((trade) => (
                                <tr key={trade._id} className="border-b-2 border-black">
                                    <td className="p-2">
                                        {new Date(trade.timestamp).toLocaleDateString()}
                                    </td>
                                    <td className="p-2 font-semibold">
                                        {trade.baseAsset || trade.symbol}
                                    </td>
                                    <td
                                        className={`p-2 font-black ${
                                            trade.side === "BUY" ? "text-[#15803d]" : "text-[#dc2626]"
                                        }`}
                                    >
                                        {trade.side}
                                    </td>
                                    <td className="p-2 text-right">{trade.quantity}</td>
                                    <td className="p-2 text-right">{formatMoney(trade.price)}</td>
                                    <td className="p-2 text-zinc-500">{trade.exchange}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
