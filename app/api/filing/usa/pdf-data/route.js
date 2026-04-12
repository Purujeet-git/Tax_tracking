import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateForm8949 } from "@/lib/filingEngine/usa/generateForm8949";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const year = Number(searchParams.get("year")) || 2024;
        
        // USA tax system strictly follows the calendar year (Jan 1 to Dec 31)
        const start = new Date(`${year}-01-01T00:00:00Z`);
        const end = new Date(`${year}-12-31T23:59:59Z`);

        const data = await generateForm8949({
            userId: session.user.id,
            financialYearStart: start,
            financialYearEnd: end
        });

        // Map it to standard summary UI schema
        const summary = {
            totalConsideration: data.summary.totalProceeds.toFixed(2),
            totalCost: data.summary.totalCost.toFixed(2),
            totalIncome: data.summary.totalGain.toFixed(2),
            totalTds: (0).toFixed(2), // No TDS in USA
            totalStcg: data.summary.totalStcg.toFixed(2),
            totalLtcg: data.summary.totalLtcg.toFixed(2)
        };

        return NextResponse.json({ summary });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
    }
}
