"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import UniversalCsvMapper from "@/components/dashboard/UniversalCsvMapper";

export default function CsvMapperPage() {
    return (
        <div className="min-h-screen bg-white px-4 py-6 text-black sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-full border-2 border-black bg-white px-4 py-2 text-sm font-black uppercase transition hover:bg-[#ffdf5d]"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Dashboard
                </Link>

                <section className="grid gap-6 rounded-lg border-2 border-black bg-[#f4f4f0] p-6 shadow-[10px_10px_0_#111] lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
                    <div>
                        <p className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-[#9dff7a] px-4 py-2 text-xs font-black uppercase">
                            <ShieldCheck className="h-4 w-4" />
                            Import control
                        </p>
                        <h1 className="mt-6 max-w-3xl text-6xl font-black leading-[0.86] tracking-tighter md:text-7xl">
                            Map messy CSVs into a clean tax ledger.
                        </h1>
                    </div>
                    <div className="flex items-end">
                        <p className="max-w-2xl text-xl font-bold leading-tight text-zinc-700">
                            Upload an exchange export, map the columns, preview normalized trades, and save only when the rows look right.
                        </p>
                    </div>
                </section>

                <UniversalCsvMapper />

                <footer className="border-t-2 border-black py-6 text-center text-sm font-semibold text-zinc-500">
                    Trader OS processes exchange imports into normalized transaction records for tax calculations.
                </footer>
            </div>
        </div>
    );
}
