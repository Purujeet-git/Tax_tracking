"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowDownRight, ArrowLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const COUNTRY_CURRENCY = {
    INDIA: "₹",
    USA: "$",
    CANADA: "C$",
    UK: "£",
    AUSTRALIA: "A$",
};

function MetricCard({ label, value, tone = "paper" }) {
    const toneClass = {
        paper: "bg-[#f4f4f0] text-black",
        green: "bg-[#9dff7a] text-black",
        red: "bg-[#ff5c5c] text-black",
        yellow: "bg-[#ffdf5d] text-black",
    }[tone];

    return (
        <Card className={`${toneClass} rounded-lg border-2 border-black py-0 shadow-[5px_5px_0_#111]`}>
            <CardContent className="p-4">
                <p className="text-xs font-black uppercase text-black/60">{label}</p>
                <p className="mt-2 text-2xl font-black tracking-tighter">{value}</p>
            </CardContent>
        </Card>
    );
}

function TaxSummaryContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlCountry = searchParams.get("country") || "INDIA";
    const urlYear = searchParams.get("year") || new Date().getFullYear().toString();

    const [country, setCountry] = useState(urlCountry);
    const [year, setYear] = useState(urlYear);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [disposals, setDisposals] = useState([]);
    const [filterAsset, setFilterAsset] = useState("ALL");
    const [filterExchange, setFilterExchange] = useState("ALL");
    const [filterProfitability, setFilterProfitability] = useState("ALL");

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/tax/disposals?country=${country}&year=${year}`);
                const data = await res.json();

                if (data.success) {
                    setSummary(data.summary);
                    setDisposals(data.disposals || []);
                }
            } catch (err) {
                console.error("Failed to load tax details", err);
            } finally {
                setLoading(false);
            }
        };

        if (country !== urlCountry || year !== urlYear) {
            router.push(`/dashboard/tax-summary?country=${country}&year=${year}`);
        }

        fetchDetails();
    }, [country, year, router, urlCountry, urlYear]);

    const currency = COUNTRY_CURRENCY[country] || "₹";
    const formatMoney = (num) =>
        `${currency}${Number(num || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const uniqueAssets = ["ALL", ...new Set(disposals.map((d) => d.asset))].filter(Boolean);
    const uniqueExchanges = ["ALL", ...new Set(disposals.map((d) => d.exchange))].filter(Boolean);

    const filteredDisposals = disposals.filter((d) => {
        if (filterAsset !== "ALL" && d.asset !== filterAsset) return false;
        if (filterExchange !== "ALL" && d.exchange !== filterExchange) return false;
        if (filterProfitability === "PROFIT" && (d.gainLoss || 0) <= 0) return false;
        if (filterProfitability === "LOSS" && (d.gainLoss || 0) > 0) return false;
        return true;
    });

    if (loading && !summary) {
        return (
            <div className="rounded-lg border-2 border-black bg-white p-10 text-center font-black shadow-[8px_8px_0_#111]">
                Loading detailed tax report...
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <section className="rounded-lg border-2 border-black bg-[#f4f4f0] p-6 shadow-[10px_10px_0_#111]">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                    <div>
                        <p className="inline-flex rounded-full border-2 border-black bg-[#ffdf5d] px-4 py-2 text-xs font-black uppercase">
                            Disposal audit
                        </p>
                        <h1 className="mt-5 max-w-4xl text-6xl font-black leading-[0.86] tracking-tighter md:text-7xl">
                            Full tax breakdown.
                        </h1>
                        <p className="mt-5 max-w-2xl text-xl font-bold leading-tight text-zinc-700">
                            Review gains, losses, cost basis, proceeds, and disposal records before filing.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="w-36 border-2 border-black bg-white font-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="INDIA">India</SelectItem>
                                <SelectItem value="USA">USA</SelectItem>
                                <SelectItem value="CANADA">Canada</SelectItem>
                                <SelectItem value="UK">UK</SelectItem>
                                <SelectItem value="AUSTRALIA">Australia</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="w-28 border-2 border-black bg-white font-black">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                                <SelectItem value="2022">2022</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {summary && (
                <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                    <MetricCard label="Realized Gain/Loss" value={formatMoney(summary.totalGain)} tone={summary.totalGain >= 0 ? "green" : "red"} />
                    <MetricCard label="Short Term" value={formatMoney(summary.shortTermGain)} />
                    <MetricCard label="Long Term" value={formatMoney(summary.longTermGain)} />
                    <MetricCard label="Estimated Tax" value={formatMoney(Math.max(summary.totalGain || 0, 0) * 0.3)} tone="yellow" />
                    <MetricCard label="Disposals" value={summary.disposalCount} />
                </section>
            )}

            <Card className="rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
                <CardContent className="p-5">
                    <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                        <div>
                            <p className="text-xs font-black uppercase text-zinc-500">Filters</p>
                            <h2 className="text-2xl font-black tracking-tighter">Find the disposals that matter</h2>
                        </div>
                        {filteredDisposals.length < disposals.length && (
                            <p className="text-sm font-black text-zinc-600">
                                Showing {filteredDisposals.length} of {disposals.length}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <FilterSelect label="Asset" value={filterAsset} onValueChange={setFilterAsset} items={uniqueAssets} allLabel="All Assets" />
                        <FilterSelect label="Exchange" value={filterExchange} onValueChange={setFilterExchange} items={uniqueExchanges} allLabel="All Platforms" width="w-44" />
                        <div className="space-y-1">
                            <label className="text-xs font-black uppercase text-zinc-500">Profitability</label>
                            <Select value={filterProfitability} onValueChange={setFilterProfitability}>
                                <SelectTrigger className="w-44 border-2 border-black bg-[#f4f4f0] font-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Disposals</SelectItem>
                                    <SelectItem value="PROFIT">Profits Only</SelectItem>
                                    <SelectItem value="LOSS">Losses Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-1 items-end justify-end">
                            {(filterAsset !== "ALL" || filterExchange !== "ALL" || filterProfitability !== "ALL") && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFilterAsset("ALL");
                                        setFilterExchange("ALL");
                                        setFilterProfitability("ALL");
                                    }}
                                    className="rounded-full border-2 border-black bg-white font-black text-black hover:bg-[#ff5c5c]"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-lg border-2 border-black bg-white py-0 shadow-[6px_6px_0_#111]">
                <div className="max-h-[680px] overflow-auto">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="sticky top-0 z-10 border-b-2 border-black bg-black text-xs font-black uppercase tracking-wide text-white">
                            <tr>
                                <th className="px-5 py-4">Asset</th>
                                <th className="px-5 py-4">Sell Date</th>
                                <th className="px-5 py-4 text-right">Quantity Sold</th>
                                <th className="px-5 py-4 text-right">Cost Basis</th>
                                <th className="px-5 py-4 text-right">Proceeds</th>
                                <th className="px-5 py-4 text-right">Gain/Loss</th>
                                <th className="px-5 py-4">Exchange</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDisposals.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center font-semibold text-zinc-500">
                                        No sales or disposals match the current filters for {year}.
                                    </td>
                                </tr>
                            ) : (
                                filteredDisposals.map((d) => {
                                    const gain = Number(d.gainLoss || 0);
                                    const isProfit = gain >= 0;
                                    return (
                                        <tr key={d._id} className="border-b-2 border-black">
                                            <td className="px-5 py-4 font-black">
                                                {d.asset}
                                                <span className="ml-2 rounded-full border border-black bg-[#f4f4f0] px-2 py-0.5 text-[10px] font-black">
                                                    {d.taxCategory?.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">{new Date(d.disposedAt).toLocaleDateString()}</td>
                                            <td className="px-5 py-4 text-right font-mono">{d.quantity}</td>
                                            <td className="px-5 py-4 text-right font-mono text-zinc-600">{formatMoney(d.costBasis)}</td>
                                            <td className="px-5 py-4 text-right font-mono text-zinc-600">{formatMoney(d.proceeds)}</td>
                                            <td className={`px-5 py-4 text-right font-mono font-black ${isProfit ? "text-[#15803d]" : "text-[#dc2626]"}`}>
                                                <span className="inline-flex items-center justify-end gap-1">
                                                    {isProfit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {formatMoney(gain)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-mono text-xs text-zinc-500">{d.exchange || "N/A"}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function FilterSelect({ label, value, onValueChange, items, allLabel, width = "w-36" }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-black uppercase text-zinc-500">{label}</label>
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className={`${width} border-2 border-black bg-[#f4f4f0] font-black`}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {items.map((item) => (
                        <SelectItem key={item} value={item}>
                            {item === "ALL" ? allLabel : item}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

export default function TaxSummaryPage() {
    return (
        <div className="min-h-screen bg-white px-4 py-6 text-black sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase transition hover:bg-[#ffdf5d]"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                </Link>

                <Suspense fallback={<div className="rounded-lg border-2 border-black bg-white p-10 text-center font-black">Initializing summary...</div>}>
                    <TaxSummaryContent />
                </Suspense>
            </div>
        </div>
    );
}
