"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Card, CardContent } from "../ui/card";

export default function FilingExportsCard() {
    return (
        <Card className="h-full rounded-lg border-2 border-black bg-black py-0 text-white shadow-[6px_6px_0_#111]">
            <CardContent className="flex h-full min-h-[280px] flex-col justify-between p-6">
                <div>
                    <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-md border-2 border-white bg-[#74e0ff] text-black">
                        <FileText className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black uppercase text-white/50">Filing center</p>
                    <h2 className="mt-3 text-4xl font-black leading-none tracking-tighter">
                        Export reports that make tax review faster.
                    </h2>
                    <p className="mt-4 max-w-xl font-semibold leading-relaxed text-white/70">
                        Generate PDF summaries and CSV disposal data for your country-specific filing workflow.
                    </p>
                </div>

                <Link
                    href="/dashboard/filing-center"
                    className="mt-8 inline-flex h-13 items-center justify-center rounded-full bg-white px-6 text-sm font-black uppercase text-black transition hover:bg-[#ffdf5d]"
                >
                    Enter filing center
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </CardContent>
        </Card>
    );
}
