"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
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
        <Card className="h-full max-h-[560px] rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
            <CardContent className="flex h-full flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-black uppercase text-zinc-500">CSV import</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tighter">
                            Preview before save
                        </h2>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-black bg-[#9dff7a]">
                        <Upload className="h-5 w-5" />
                    </div>
                </div>

                <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="w-full rounded-md border-2 border-black bg-[#f4f4f0] p-3 text-sm font-semibold file:mr-3 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
                />

                <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                        onClick={handlePreview}
                        className="h-11 rounded-full bg-black px-5 font-black uppercase text-white hover:bg-zinc-800"
                    >
                        {loading ? "Parsing..." : "Preview CSV"}
                    </Button>

                    {preview.length > 0 && (
                        <Button
                            onClick={handleSave}
                            className="h-11 rounded-full border-2 border-black bg-[#ffdf5d] px-5 font-black uppercase text-black hover:bg-[#ffe878]"
                        >
                            Confirm & Save
                        </Button>
                    )}
                </div>

                {preview.length > 0 ? (
                    <div className="mt-5 flex min-h-0 flex-1 flex-col space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-md border-2 border-black bg-[#f4f4f0] p-3">
                                <p className="text-xs font-black uppercase text-zinc-500">Exchange</p>
                                <p className="font-black">{exchange || "Detected"}</p>
                            </div>
                            <div className="rounded-md border-2 border-black bg-[#f4f4f0] p-3">
                                <p className="text-xs font-black uppercase text-zinc-500">Rows</p>
                                <p className="font-black">{totalRows}</p>
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto rounded-md border-2 border-black">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-black text-white">
                                    <tr>
                                        <th className="p-2 text-left">Asset</th>
                                        <th className="p-2 text-right">Qty</th>
                                        <th className="p-2 text-right">Price</th>
                                        <th className="p-2 text-left">Type</th>
                                        <th className="p-2 text-left">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.map((row, idx) => (
                                        <tr key={idx} className="border-t-2 border-black">
                                            <td className="p-2 font-semibold">{row.baseAsset}</td>
                                            <td className="p-2 text-right">{row.quantity}</td>
                                            <td className="p-2 text-right">{row.price}</td>
                                            <td
                                                className={`p-2 font-black ${
                                                    row.side === "BUY" ? "text-[#15803d]" : "text-[#dc2626]"
                                                }`}
                                            >
                                                {row.side}
                                            </td>
                                            <td className="p-2">
                                                {new Date(row.timestamp).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 flex min-h-44 flex-1 items-center justify-center rounded-md border-2 border-dashed border-black bg-[#f4f4f0] p-6 text-center">
                        <p className="max-w-sm text-sm font-semibold text-zinc-600">
                            Upload an exchange CSV to detect the source, inspect normalized rows, and save only after the preview looks right.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
