"use client";

import { useMemo, useRef, useState } from "react";
import { parse } from "csv-parse/browser/esm/sync";
import { AlertCircle, CheckCircle2, ChevronRight, FileSpreadsheet, ListRestart, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const COLUMN_OPTIONS = [
    { label: "Date", value: "timestamp" },
    { label: "Base Asset", value: "baseAsset" },
    { label: "Quote Asset", value: "quoteAsset" },
    { label: "Side", value: "side" },
    { label: "Quantity", value: "quantity" },
    { label: "Price", value: "price" },
    { label: "Fee Amount", value: "feeAmount" },
    { label: "Fee Asset", value: "feeAsset" },
    { label: "Ignore", value: "ignore" },
];

export default function UniversalCsvMapper() {
    const [rawRows, setRawRows] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [mappings, setMappings] = useState({});
    const [previewData, setPreviewData] = useState([]);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const requiredMapped = useMemo(() => {
        const values = Object.values(mappings);
        return ["timestamp", "baseAsset", "quantity", "price", "side"].filter((key) => values.includes(key)).length;
    }, [mappings]);

    const handleFileUpload = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                setError(null);
                const records = parse(e.target.result, { columns: true, skip_empty_lines: true });
                if (records.length === 0) throw new Error("CSV is empty.");

                const detectedHeaders = Object.keys(records[0]);
                const initialMappings = {};

                detectedHeaders.forEach((header) => {
                    const lower = header.toLowerCase();
                    if (lower.includes("date") || lower.includes("time")) initialMappings[header] = "timestamp";
                    else if (lower.includes("asset") || lower.includes("symbol") || lower.includes("coin")) initialMappings[header] = "baseAsset";
                    else if (lower.includes("quantity") || lower.includes("qty") || lower.includes("amount")) initialMappings[header] = "quantity";
                    else if (lower.includes("price") || lower.includes("rate")) initialMappings[header] = "price";
                    else if (lower.includes("side") || lower.includes("type") || lower.includes("transaction")) initialMappings[header] = "side";
                    else initialMappings[header] = "ignore";
                });

                setRawRows(records);
                setHeaders(detectedHeaders);
                setMappings(initialMappings);
                setPreviewData([]);
                setStep(2);
            } catch (err) {
                setError(err.message);
            }
        };
        reader.readAsText(selectedFile);
    };

    const handleMappingChange = (header, value) => {
        setMappings((prev) => ({ ...prev, [header]: value }));
    };

    const generatePreview = () => {
        const preview = rawRows.slice(0, 100).map((row) => {
            const normalized = {};
            Object.entries(mappings).forEach(([header, target]) => {
                if (target !== "ignore") normalized[target] = row[header];
            });
            return normalized;
        });

        setPreviewData(preview);
        setStep(3);
    };

    const saveToDatabase = async () => {
        setLoading(true);
        setError(null);
        try {
            const allTransactions = rawRows.map((row) => {
                const nx = { exchange: "CUSTOM_CSV", type: "TRADE" };
                Object.entries(mappings).forEach(([header, target]) => {
                    if (target !== "ignore") nx[target] = row[header];
                });

                if (nx.timestamp) nx.timestamp = new Date(nx.timestamp);
                if (nx.quantity) nx.quantity = parseFloat(nx.quantity);
                if (nx.price) nx.price = parseFloat(nx.price);
                if (nx.feeAmount) nx.feeAmount = parseFloat(nx.feeAmount);
                if (nx.side) nx.side = nx.side.toUpperCase().includes("BUY") ? "BUY" : "SELL";

                return nx;
            });

            const res = await fetch("/api/upload/csv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactions: allTransactions }),
            });

            if (!res.ok) throw new Error("Failed to save data. Check column formats.");

            alert(`Successfully imported ${allTransactions.length} trades.`);
            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="rounded-lg border-2 border-black bg-white p-0 text-black shadow-[8px_8px_0_#111]">
            <div className="border-b-2 border-black p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-black bg-[#74e0ff]">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase text-zinc-500">Universal CSV Mapper</p>
                            <h2 className="text-3xl font-black tracking-tighter">Import transactions</h2>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {[1, 2, 3].map((item) => (
                            <span
                                key={item}
                                className={`h-3 w-14 rounded-full border-2 border-black ${
                                    step >= item ? "bg-black" : "bg-[#f4f4f0]"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-5">
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {step === 1 && (
                    <div
                        className="cursor-pointer rounded-lg border-2 border-dashed border-black bg-[#f4f4f0] p-12 text-center transition hover:bg-[#ffdf5d]"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".csv"
                        />
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md border-2 border-black bg-white">
                            <FileSpreadsheet size={32} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tighter">Upload an exchange CSV</h3>
                        <p className="mt-2 font-semibold text-zinc-600">Custom exports are okay. You will map columns before saving.</p>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <div className="rounded-md border-2 border-black bg-[#f4f4f0] p-4">
                            <p className="text-sm font-black">
                                {rawRows.length} rows detected. {requiredMapped}/5 required fields mapped.
                            </p>
                        </div>
                        <div className="grid max-h-[560px] gap-4 overflow-auto pr-1 md:grid-cols-2">
                            {headers.map((header) => (
                                <div key={header} className="flex items-center justify-between gap-3 rounded-md border-2 border-black bg-white p-4">
                                    <span className="max-w-[220px] truncate text-sm font-black" title={header}>
                                        {header}
                                    </span>
                                    <Select value={mappings[header]} onValueChange={(val) => handleMappingChange(header, val)}>
                                        <SelectTrigger className="w-[180px] border-2 border-black bg-[#f4f4f0] font-black">
                                            <SelectValue placeholder="Map to..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COLUMN_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-wrap justify-end gap-3">
                            <Button variant="outline" className="rounded-full border-2 border-black bg-white font-black text-black" onClick={() => setStep(1)}>
                                <ListRestart size={18} className="mr-2" /> Start over
                            </Button>
                            <Button className="rounded-full bg-black px-8 font-black uppercase text-white" onClick={generatePreview}>
                                Preview rows <ChevronRight size={18} className="ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 rounded-md border-2 border-black bg-[#9dff7a] p-4 text-sm font-black">
                            <CheckCircle2 size={20} />
                            We&apos;ve mapped your columns. Review the first 100 entries below.
                        </div>

                        <div className="overflow-hidden rounded-md border-2 border-black bg-white">
                            <div className="max-h-[520px] overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 border-b-2 border-black bg-black text-white">
                                        <TableRow className="border-none">
                                            {COLUMN_OPTIONS.filter((o) => o.value !== "ignore").map((opt) => (
                                                <TableHead key={opt.value} className="px-5 py-4 whitespace-nowrap">
                                                    {opt.label}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((row, index) => (
                                            <TableRow key={index} className="border-b-2 border-black">
                                                {COLUMN_OPTIONS.filter((o) => o.value !== "ignore").map((opt) => (
                                                    <TableCell key={opt.value} className="px-5 py-4 font-mono text-xs">
                                                        {row[opt.value] || "-"}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <p className="text-sm font-semibold text-zinc-600">
                                Total entries: <span className="font-black text-black">{rawRows.length}</span> trades detected.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="outline" className="rounded-full border-2 border-black bg-white font-black text-black" onClick={() => setStep(2)}>
                                    <ListRestart size={18} className="mr-2" /> Modify mapping
                                </Button>
                                <Button className="rounded-full bg-black px-8 font-black uppercase text-white" onClick={saveToDatabase} disabled={loading}>
                                    {loading ? "Importing..." : <><Save size={18} className="mr-2" /> Save to portfolio</>}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
