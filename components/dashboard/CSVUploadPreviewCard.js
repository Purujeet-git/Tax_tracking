"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CSVUploadPreviewCard() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState([]);
    const [exchange, setExchange] = useState("");
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(false);

    const handlePreview = async () => {
        if (!file) return alert("Please choose CSV");

        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/csv/preview", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        setPreview(data.preview || []);
        setExchange(data.exchange);
        setTotalRows(data.totalRows || 0);

        setLoading(false);
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/csv", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        alert(`Saved ${data.count} trades successfully`);
    };

    return (
        <Card className="bg-zinc-900 m-10 text-white border-zinc-800">
            <CardContent className="p-4 space-y-4">
                <h2 className="text-xl font-semibold">
                    📂 CSV Upload Preview
                </h2>

                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                />

                <div className="flex gap-2">
                    <Button onClick={handlePreview}>
                        {loading ? "Parsing..." : "Preview CSV"}
                    </Button>

                    {preview.length > 0 && (
                        <Button onClick={handleSave}>
                            Confirm & Save
                        </Button>
                    )}
                </div>

                {preview.length > 0 && (
                    <div className="space-y-2">
                        <p>Exchange: {exchange}</p>
                        <p>Total Rows: {totalRows}</p>

                        <div className="overflow-auto max-h-80 border border-zinc-700 rounded">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-800">
                                    <tr>
                                        <th className="p-2">Asset</th>
                                        <th className="p-2">Qty</th>
                                        <th className="p-2">Price</th>
                                        <th className="p-2">Type</th>
                                        <th className="p-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            className="border-t border-zinc-700"
                                        >
                                            <td className="p-2">{row.asset}</td>
                                            <td className="p-2">{row.quantity}</td>
                                            <td className="p-2">{row.price}</td>
                                            <td className="p-2">{row.type}</td>
                                            <td className="p-2">
                                                {new Date(row.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}