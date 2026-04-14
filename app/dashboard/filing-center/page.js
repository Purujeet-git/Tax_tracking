"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Download, FileText, Globe, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
const IS_LAUNCH_FREE = true; // Launch offer: PDF/CSV downloads are free

const REGIONS = [
    {
        id: "INDIA",
        label: "India",
        subtitle: "Schedule VDA / ITR",
        currency: "₹",
        taxRule: "30% flat rate + 4% cess under Sec 115BBH",
        yearLabel: (y) => `FY ${y}-${y + 1}`,
        pdfUrl: (y) => `/api/filing/india/pdf-download?year=${y}`,
        csvUrl: (y) => `/api/filing/india/schedule-vda?year=${y}`,
        dataUrl: (y) => `/api/filing/preview?region=INDIA&year=${y}`,
        pdfFilename: (y) => `India_Schedule_VDA_FY${y}.pdf`,
        csvFilename: (y) => `India_Schedule_VDA_FY${y}.csv`,
    },
    {
        id: "USA",
        label: "USA",
        subtitle: "Form 8949 / Schedule D",
        currency: "$",
        taxRule: "Short-term ordinary income and long-term capital gains buckets",
        yearLabel: (y) => `Tax Year ${y}`,
        pdfUrl: (y) => `/api/filing/usa/pdf-download?year=${y}`,
        csvUrl: (y) => `/api/filing/usa/csv-download?year=${y}`,
        dataUrl: (y) => `/api/filing/preview?region=USA&year=${y}`,
        pdfFilename: (y) => `USA_Form8949_${y}.pdf`,
        csvFilename: (y) => `USA_Form8949_${y}.csv`,
    },
    {
        id: "UK",
        label: "UK",
        subtitle: "CGT / SA108 / HMRC",
        currency: "£",
        taxRule: "Capital gains report with annual exempt amount handling",
        yearLabel: (y) => `UK Tax Year ${y}-${y + 1}`,
        pdfUrl: (y) => `/api/filing/uk/pdf-download?year=${y}`,
        csvUrl: (y) => `/api/filing/uk/csv-download?year=${y}`,
        dataUrl: (y) => `/api/filing/preview?region=UK&year=${y}`,
        pdfFilename: (y) => `UK_CGT_Report_${y}-${y + 1}.pdf`,
        csvFilename: (y) => `UK_CGT_Report_${y}-${y + 1}.csv`,
    },
    {
        id: "CANADA",
        label: "Canada",
        subtitle: "T5008 / Schedule 3 / CRA",
        currency: "C$",
        taxRule: "Capital gains report with Canadian inclusion-rate handling",
        yearLabel: (y) => `Tax Year ${y}`,
        pdfUrl: (y) => `/api/filing/canada/pdf-download?year=${y}`,
        csvUrl: (y) => `/api/filing/canada/csv-download?year=${y}`,
        dataUrl: (y) => `/api/filing/preview?region=CANADA&year=${y}`,
        pdfFilename: (y) => `Canada_T5008_${y}.pdf`,
        csvFilename: (y) => `Canada_T5008_${y}.csv`,
    },
    {
        id: "AUSTRALIA",
        label: "Australia",
        subtitle: "CGT Event A1 / ATO",
        currency: "A$",
        taxRule: "CGT report with discount handling for eligible long-held assets",
        yearLabel: (y) => `FY ${y}-${y + 1}`,
        pdfUrl: (y) => `/api/filing/australia/pdf-download?year=${y}`,
        csvUrl: (y) => `/api/filing/australia/csv-download?year=${y}`,
        dataUrl: (y) => `/api/filing/preview?region=AUSTRALIA&year=${y}`,
        pdfFilename: (y) => `AUS_CGT_FY${y}-${y + 1}.pdf`,
        csvFilename: (y) => `AUS_CGT_FY${y}-${y + 1}.csv`,
    },
];

function getLatestCompletedYear(regionId) {
    const now = new Date();
    const cy = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    switch (regionId) {
        case "INDIA":
            return month >= 4 ? cy - 1 : cy - 2;
        case "UK":
            return month > 4 || (month === 4 && day >= 6) ? cy - 1 : cy - 2;
        case "AUSTRALIA":
            return month >= 7 ? cy - 1 : cy - 2;
        case "USA":
        case "CANADA":
        default:
            return cy - 1;
    }
}

function getFilingYears(regionId) {
    const latest = getLatestCompletedYear(regionId);
    return [latest, latest - 1, latest - 2, latest - 3];
}

function getTaxPeriodLabel(regionId, y) {
    switch (regionId) {
        case "INDIA":
            return `1 Apr ${y} - 31 Mar ${y + 1}`;
        case "UK":
            return `6 Apr ${y} - 5 Apr ${y + 1}`;
        case "AUSTRALIA":
            return `1 Jul ${y} - 30 Jun ${y + 1}`;
        case "USA":
        case "CANADA":
        default:
            return `1 Jan ${y} - 31 Dec ${y}`;
    }
}

function renderSummaryTiles(region, summary) {
    if (!summary) return null;

    const currency = region.currency;
    const tiles = {
        INDIA: [
            ["Total Consideration", `${currency}${summary.totalConsideration ?? 0}`],
            ["Cost of Acquisition", `${currency}${summary.totalCost ?? 0}`],
            ["Net VDA Income", `${currency}${summary.totalIncome ?? 0}`],
            ["Est. Tax", `${currency}${summary.estimatedTaxOwed ?? "-"}`],
        ],
        USA: [
            ["Total Proceeds", `${currency}${summary.totalConsideration ?? 0}`],
            ["Total Cost Basis", `${currency}${summary.totalCost ?? 0}`],
            ["Short-Term Gain", `${currency}${summary.totalStcg ?? 0}`],
            ["Long-Term Gain", `${currency}${summary.totalLtcg ?? 0}`],
        ],
        UK: [
            ["Total Proceeds", `${currency}${summary.totalProceeds ?? 0}`],
            ["Allowable Cost", `${currency}${summary.totalAllowableCost ?? 0}`],
            ["Net Gain/Loss", `${currency}${summary.netGain ?? 0}`],
            ["Gain After Exempt", `${currency}${summary.gainAfterExemption ?? 0}`],
        ],
        CANADA: [
            ["Total Proceeds", `${currency}${summary.totalProceeds ?? 0}`],
            ["Total ACB", `${currency}${summary.totalAcb ?? 0}`],
            ["Capital Gain/Loss", `${currency}${summary.totalGainLoss ?? 0}`],
            ["Taxable Capital Gain", `${currency}${summary.totalTaxableGain ?? 0}`],
        ],
        AUSTRALIA: [
            ["Total Proceeds", `${currency}${summary.totalProceeds ?? 0}`],
            ["Total Cost Base", `${currency}${summary.totalCostBase ?? 0}`],
            ["Net Capital Gain", `${currency}${summary.netCapitalGain ?? 0}`],
            ["Net Taxable Gain", `${currency}${summary.netTaxableGain ?? 0}`],
        ],
    };

    return (tiles[region.id] ?? []).map(([label, value]) => (
        <div key={label} className="rounded-lg border-2 border-black bg-white p-4 shadow-[5px_5px_0_#111]">
            <p className="text-xs font-black uppercase text-zinc-500">{label}</p>
            <p className="mt-2 text-xl font-black tracking-tighter">{value}</p>
        </div>
    ));
}

export default function FilingCenterPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [regionId, setRegionId] = useState("INDIA");
    const [year, setYear] = useState(() => getLatestCompletedYear("INDIA"));
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(null);
    const [summary, setSummary] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [paid, setPaid] = useState(IS_LAUNCH_FREE);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const region = REGIONS.find((r) => r.id === regionId);

    const isAuthenticated = status === "authenticated";

    const handleRegionChange = (newRegionId) => {
        setRegionId(newRegionId);
        setYear(getLatestCompletedYear(newRegionId));
    };

    const fetchSummary = useCallback(async () => {
        if (!isAuthenticated) return;
        setSummaryLoading(true);
        setSummary(null);
        setPreviewRows([]);
        setPaid(false);
        try {
            const res = await fetch(region.dataUrl(year));
            if (res.ok) {
                const json = await res.json();
                setSummary(json.summary);
                setPreviewRows(json.rows || []);
                setPaid(IS_LAUNCH_FREE ? true : Boolean(json.paid));
            }
        } catch (e) {
            console.error("Summary fetch failed:", e);
        } finally {
            setSummaryLoading(false);
        }
    }, [region, year]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const downloadFile = async (urlFn, filenameFn) => {
        const res = await fetch(urlFn(year));
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filenameFn(year);
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    const downloadPackage = async () => {
        try {
            setDownloadLoading(true);
            await Promise.all([
                downloadFile(region.pdfUrl, region.pdfFilename),
                downloadFile(region.csvUrl, region.csvFilename),
            ]);
        } catch (err) {
            console.error(err);
            alert("Failed to download the filing package. Confirm payment and try again.");
        } finally {
            setDownloadLoading(false);
        }
    };

    const startStripeCheckout = async () => {
        setPaymentLoading("stripe");
        try {
            const res = await fetch("/api/payments/export/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ region: regionId, year }),
            });
            const json = await res.json();
            if (json.paid) {
                setPaid(true);
                return;
            }
            if (!res.ok) throw new Error(json.error || "Stripe checkout failed");
            window.location.href = json.url;
        } catch (e) {
            alert(e.message);
        } finally {
            setPaymentLoading(null);
        }
    };

    const startRazorpayCheckout = async () => {
        setPaymentLoading("razorpay");
        try {
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            const res = await fetch("/api/payments/export/razorpay/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ region: regionId, year }),
            });
            const order = await res.json();
            if (order.paid) {
                setPaid(true);
                return;
            }
            if (!res.ok) throw new Error(order.error || "Razorpay order failed");

            const checkout = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: "Trader OS",
                description: order.name,
                order_id: order.orderId,
                handler: async (response) => {
                    const verifyRes = await fetch("/api/payments/export/razorpay/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(response),
                    });
                    const verified = await verifyRes.json();
                    if (!verifyRes.ok) throw new Error(verified.error || "Razorpay verification failed");
                    setPaid(true);
                },
            });
            checkout.open();
        } catch (e) {
            alert(e.message);
        } finally {
            setPaymentLoading(null);
        }
    };

    const previewColumns = previewRows.length ? Object.keys(previewRows[0]).slice(0, 8) : [];

    return (
        <div className="min-h-screen bg-white px-4 py-6 text-black sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <Link href="/dashboard" className="inline-flex items-center rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase transition hover:bg-[#ffdf5d]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                </Link>

                {IS_LAUNCH_FREE && (
                    <section className="animate-in fade-in slide-in-from-top-4 duration-700 rounded-lg border-2 border-black bg-[#9dff7a] p-4 text-center shadow-[6px_6px_0_#111]">
                        <p className="flex items-center justify-center gap-2 text-sm font-black uppercase">
                            <Sparkles className="h-4 w-4" />
                            Launch Offer: All reports are free for a limited time. Use our service to see the accuracy for yourself and build your trust in Trader OS.
                        </p>
                    </section>
                )}

                <section className="grid gap-6 rounded-lg border-2 border-black bg-[#f4f4f0] p-6 shadow-[10px_10px_0_#111] lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#74e0ff] px-4 py-2 text-xs font-black uppercase">
                            <Globe className="h-4 w-4" />
                            Global filing center
                        </p>
                        <h1 className="mt-6 max-w-4xl text-6xl font-black leading-[0.86] tracking-tighter md:text-7xl">
                            Export tax reports with confidence.
                        </h1>
                    </div>
                    <div className="flex items-end">
                        <p className="max-w-2xl text-xl font-bold leading-tight text-zinc-700">
                            Choose your region, select a completed tax year, review the summary, then download PDF and CSV reports for accountant review.
                        </p>
                    </div>
                </section>

                <section className="rounded-lg border-2 border-black bg-white p-5 shadow-[6px_6px_0_#111]">
                    <p className="mb-3 text-xs font-black uppercase text-zinc-500">Region</p>
                    <div className="flex flex-wrap gap-2">
                        {REGIONS.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => handleRegionChange(r.id)}
                                className={cn(
                                    "rounded-full border-2 border-black px-5 py-3 text-sm font-black uppercase transition",
                                    regionId === r.id ? "bg-black text-white" : "bg-[#f4f4f0] text-black hover:bg-[#ffdf5d]"
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span className="text-xs font-black uppercase text-zinc-500">Tax year</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {getFilingYears(regionId).map((y, idx) => (
                            <button
                                key={y}
                                onClick={() => setYear(y)}
                                className={cn(
                                    "rounded-lg border-2 border-black px-5 py-3 text-left transition",
                                    year === y ? "bg-[#9dff7a]" : "bg-[#f4f4f0] hover:bg-[#ffdf5d]"
                                )}
                            >
                                <span className="block text-base font-black">{region.yearLabel(y)}</span>
                                <span className="block text-xs font-semibold text-zinc-600">
                                    {idx === 0 ? "Latest complete / " : ""}
                                    {getTaxPeriodLabel(regionId, y)}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border-2 border-black bg-black p-6 text-white shadow-[6px_6px_0_#111]">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <p className="text-xs font-black uppercase text-white/50">{region.subtitle}</p>
                            <h2 className="mt-2 text-4xl font-black tracking-tighter">{region.label} filing package</h2>
                            <p className="mt-2 font-semibold text-white/70">{region.taxRule}</p>
                        </div>
                        <div className="rounded-full border-2 border-white px-5 py-2 text-sm font-black">
                            {region.yearLabel(year)}
                        </div>
                    </div>
                </section>

                {status === "unauthenticated" ? (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex h-24 items-center justify-center rounded-lg border-2 border-black bg-[#f4f4f0] p-4 shadow-[5px_5px_0_#111]">
                                <Lock className="h-5 w-5 text-black/20" />
                            </div>
                        ))}
                    </div>
                ) : (summaryLoading || status === "loading") ? (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 animate-pulse rounded-lg border-2 border-black bg-[#f4f4f0]" />
                        ))}
                    </div>
                ) : summary ? (
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {renderSummaryTiles(region, summary)}
                    </div>
                ) : null}

                <section
                    className="relative overflow-hidden rounded-lg border-2 border-black bg-white p-5 shadow-[6px_6px_0_#111]"
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && ["a", "c", "x", "s", "p"].includes(e.key.toLowerCase())) e.preventDefault();
                    }}
                    tabIndex={0}
                >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#9dff7a] px-3 py-1 text-xs font-black uppercase">
                                <ShieldCheck className="h-4 w-4" />
                                Verify before download
                            </p>
                            <h2 className="mt-3 text-3xl font-black tracking-tighter">Review generated filing rows</h2>
                            <p className="mt-2 max-w-3xl font-semibold text-zinc-600">
                                This preview is generated from the same normalized ledger used for the PDF and CSV package.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg border-2 border-black bg-[#f4f4f0] px-4 py-3 text-sm font-black uppercase">
                            <Lock className="h-4 w-4" />
                            Copy disabled
                        </div>
                    </div>

                    <div className="mt-5 max-h-[430px] overflow-auto rounded-lg border-2 border-black select-none">
                        {status === "unauthenticated" ? (
                            <div className="flex h-[300px] flex-col items-center justify-center space-y-4 bg-[#f4f4f0] p-8 text-center">
                                <Lock className="h-12 w-12 text-black" />
                                <div className="max-w-md">
                                    <p className="text-2xl font-black uppercase tracking-tighter">Preview Locked</p>
                                    <p className="mt-2 font-bold text-zinc-600">Login to preview your filing rows and unlock the export package.</p>
                                    <Button 
                                        onClick={() => router.push("/login")}
                                        className="mt-4 h-11 rounded-full bg-black px-6 text-xs font-black uppercase text-white hover:bg-zinc-800"
                                    >
                                        Sign In to View
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (summaryLoading || status === "loading") ? (
                            <div className="flex h-[300px] flex-col items-center justify-center space-y-4 bg-[#f4f4f0] p-8">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-black border-t-transparent" />
                                <p className="font-black uppercase tracking-tighter">Loading secure preview...</p>
                            </div>
                        ) : previewColumns.length ? (
                            <table className="w-full min-w-[900px] border-collapse text-sm">
                                <thead className="sticky top-0 bg-black text-white">
                                    <tr>
                                        {previewColumns.map((column) => (
                                            <th key={column} className="border-r border-white/20 px-3 py-3 text-left text-xs font-black uppercase">
                                                {column}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.slice(0, 100).map((row, rowIndex) => (
                                        <tr key={rowIndex} className={rowIndex % 2 ? "bg-[#f4f4f0]" : "bg-white"}>
                                            {previewColumns.map((column) => (
                                                <td key={column} className="border-t border-black/10 px-3 py-3 font-mono text-xs">
                                                    {String(row[column] ?? "")}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center font-bold text-zinc-600">
                                No disposal rows were generated for this period.
                            </div>
                        )}
                    </div>
                </section>

                <section className="grid gap-5 md:grid-cols-2">
                    <ExportCard
                        title="Launch period access"
                        text={IS_LAUNCH_FREE ? "Generation is currently free for all regions during our launch period." : "Pay once for this region and tax year, then download the PDF and CSV together."}
                        tags={IS_LAUNCH_FREE ? ["Free Access", "Limited Time", "No Payment Required"] : ["Stripe", "Razorpay", "PDF + CSV", region.subtitle]}
                        icon={BadgeCheck}
                        buttonText={paid ? "Feature unlocked" : status === "loading" ? "Verifying..." : "Sign in to unlock"}
                        disabled={paid}
                        primary
                    />
                    <ExportCard
                        title="Download both files"
                        text="The PDF report and raw CSV are generated from the verified preview data."
                        tags={["Simultaneous", "Free Launch Access", "Review Ready", "Accountant Export"]}
                        icon={Download}
                        buttonText={downloadLoading ? "Preparing files..." : "Download PDF and CSV"}
                        onClick={downloadPackage}
                        disabled={!paid || downloadLoading}
                    />
                </section>

                <section className="rounded-lg border-2 border-black bg-[#f4f4f0] p-5 text-center">
                    <p className="mx-auto max-w-3xl text-xs font-semibold leading-relaxed text-zinc-600">
                        Legal notice: Reports are generated algorithmically from your transaction data and do not constitute legal or tax advice. Verify outputs with a qualified tax professional before filing.
                    </p>
                </section>
            </div>
        </div>
    );
}

function ExportCard({ title, text, tags, icon: Icon, buttonText, onClick, onStripe, onRazorpay, disabled, primary = false }) {
    return (
        <Card className={`${primary ? "bg-black text-white" : "bg-white text-black"} rounded-lg border-2 border-black py-0 shadow-[6px_6px_0_#111]`}>
            <CardContent className="flex h-full min-h-[330px] flex-col justify-between p-6">
                <div>
                    <div className={`${primary ? "border-white bg-[#74e0ff] text-black" : "border-black bg-[#ffdf5d]"} mb-6 flex h-12 w-12 items-center justify-center rounded-md border-2`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                        {primary && <BadgeCheck className="h-4 w-4" />}
                        <h2 className="text-3xl font-black tracking-tighter">{title}</h2>
                    </div>
                    <p className={`${primary ? "text-white/70" : "text-zinc-600"} font-semibold leading-relaxed`}>{text}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <span key={tag} className={`${primary ? "border-white text-white" : "border-black text-black"} rounded-full border-2 px-3 py-1 text-xs font-black uppercase`}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                {!IS_LAUNCH_FREE && (onStripe || onRazorpay) ? (
                    <div className="mt-8 grid gap-2 sm:grid-cols-2">
                        <Button
                            onClick={onStripe}
                            disabled={disabled}
                            className="h-12 rounded-full bg-white font-black uppercase text-black hover:bg-[#ffdf5d]"
                        >
                            Stripe
                        </Button>
                        <Button
                            onClick={onRazorpay}
                            disabled={disabled}
                            className="h-12 rounded-full bg-[#74e0ff] font-black uppercase text-black hover:bg-[#ffdf5d]"
                        >
                            Razorpay
                        </Button>
                        <p className="sm:col-span-2 text-xs font-bold uppercase text-white/60">{buttonText}</p>
                    </div>
                ) : (
                    <Button
                        onClick={onClick}
                        disabled={disabled}
                        className={`${primary ? "bg-white text-black hover:bg-[#ffdf5d]" : "bg-black text-white hover:bg-zinc-800"} mt-8 h-12 rounded-full font-black uppercase`}
                    >
                        {buttonText}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
