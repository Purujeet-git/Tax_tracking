import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { generateScheduleVDA } from "@/lib/filingEngine/india/generateScheduleVDA";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    const { start, end, label } = getTaxYearRange({ country: "INDIA", year });

    try {
        const data = await generateScheduleVDA({
            userId: session.user.id,
            financialYearStart: start,
            financialYearEnd: end,
            outputFormat: "json",
        });

        // summary now uses stable named keys — read directly
        return NextResponse.json({
            success: true,
            label,
            financialYearStr: `${year}-${year + 1}`,
            summary: {
                totalCost: data.summary.totalCost,
                totalConsideration: data.summary.totalConsideration,
                totalIncome: data.summary.totalIncome,
                totalTaxableGain: data.summary.totalTaxableGain,
                totalTds: data.summary.totalTDS,
                estimatedTaxOwed: data.summary.estimatedTaxOwed,
            },
        });
    } catch (e) {
        console.error("India pdf-data error:", e);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}
