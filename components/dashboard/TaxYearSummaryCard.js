"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "../ui/card";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

const COUNTRY_CURRENCY = {
    INDIA: "₹",
    USA: "$",
    CANADA: "C$",
    UK: "£",
    AUSTRALIA: "A$",
};

export default function TaxYearSummaryCard() {
    const [country, setCountry] = useState("INDIA");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/dashboard/tax-year?country=${country}&year=${year}`);
                const data = await res.json();

                if (data.success) {
                    setSummary(data.summary);
                }
            } catch (error) {
                console.error("Failed to fetch tax summary", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [country, year]);

    const currency = COUNTRY_CURRENCY[country] || "₹";
    const formatMoney = (num) => `${currency}${Number(num || 0).toFixed(2)}`;

    if (loading || !summary) {
        return (
            <Card className="flex h-full min-h-[300px] items-center justify-center rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
                <CardContent className="p-6 font-black">Loading tax summary...</CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full rounded-lg border-2 border-black bg-white py-0 text-black shadow-[6px_6px_0_#111]">
            <CardContent className="flex h-full flex-col p-5">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-black uppercase text-zinc-500">Tax year</p>
                        <h2 className="mt-1 text-2xl font-black tracking-tighter">Summary</h2>
                    </div>

                    <div className="flex gap-2">
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="w-32 border-2 border-black bg-[#f4f4f0] font-black">
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
                            <SelectTrigger className="w-24 border-2 border-black bg-[#f4f4f0] font-black">
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

                <div className="mb-4 flex justify-between rounded-md border-2 border-black bg-[#f4f4f0] p-3 text-sm font-black">
                    <span>{summary.taxYear}</span>
                    <span>{summary.strategy}</span>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-3">
                    <MetricCard label="Realized Gain" value={formatMoney(summary.realizedGain)} />
                    <MetricCard label="Estimated Tax" value={formatMoney(summary.estimatedTax)} valueClass="text-[#dc2626]" />
                    <MetricCard label="Short Term" value={formatMoney(summary.shortTermGain)} />
                    <MetricCard label="Long Term" value={formatMoney(summary.longTermGain)} />
                    {country === "INDIA" && summary.taxableIncomeVDA !== null && (
                        <MetricCard label="Taxable VDA Income" value={formatMoney(summary.taxableIncomeVDA)} valueClass="text-black" tone="yellow" />
                    )}
                </div>

                <div className="mt-4 flex justify-between border-t-2 border-black pt-4 text-sm font-black text-zinc-600">
                    <span>{summary.disposalCount} disposals</span>
                    <span>Special: {formatMoney(summary.specialGain)}</span>
                </div>

                <Link
                    href={`/dashboard/tax-summary?country=${country}&year=${year}`}
                    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-full bg-black px-5 text-sm font-black uppercase text-white transition hover:bg-zinc-800"
                >
                    View full breakdown
                </Link>
            </CardContent>
        </Card>
    );
}

function MetricCard({ label, value, valueClass = "text-black", tone = "paper" }) {
    const toneClass = tone === "yellow" ? "bg-[#ffdf5d]" : "bg-[#f4f4f0]";

    return (
        <div className={`${toneClass} rounded-md border-2 border-black p-3`}>
            <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
            <p className={`mt-2 font-black ${valueClass}`}>{value}</p>
        </div>
    );
}
