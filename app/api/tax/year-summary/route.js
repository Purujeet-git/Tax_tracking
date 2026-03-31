import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Trade from "@/models/Trade";
import { matchDisposals } from "@/lib/taxEngine/disposals/matchDisposals";
import { summarizeDisposals } from "@/lib/taxEngine/disposals/summarizeDisposals";
import { getLossHarvsetingOpportunities } from "@/lib/taxEngine/intelligence/lossHarvesting";

export async function GET() {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // ✅ Always sort by date
        const trades = await Trade.find({ userId }).sort({
            date: 1,
        });

        const strategies = ["FIFO", "LIFO", "HIFO"];

        const comparisons = strategies.map((strategy) => {
            const disposals = matchDisposals(
                trades,
                strategy
            );

            const summary = summarizeDisposals(disposals);

            return {
                strategy,
                totalGain: summary.totalGain,
                disposalCount: summary.disposalCount,
            };
        });

        const sorted = [...comparisons].sort(
            (a, b) => a.totalGain - b.totalGain
        );

        // ✅ Safe fallback
        const best = sorted[0] || {
            strategy: "FIFO",
            totalGain: 0,
            disposalCount: 0,
        };

        // ✅ Prevent negative tax
        const estimatedTax =
            Math.max(best.totalGain, 0) * 0.3;

        const harvest =
            await getLossHarvsetingOpportunities(userId);

        const potentialSaving = harvest.reduce(
            (sum, h) => sum + h.estimatedTaxSaving,
            0
        );
        console.log("This is potential",potentialSaving);

        return NextResponse.json({
            success: true,
            taxYear: "FY 2025-26",
            realizedGain: best.totalGain,
            estimatedTax,
            disposalCount: best.disposalCount,
            bestStrategy: best.strategy,
            potentialHarvestSaving: potentialSaving,
        });
    } catch (error) {
        console.error("YEAR SUMMARY ERROR:", error);

        return NextResponse.json(
            { error: "Failed to generate year summary" },
            { status: 500 }
        );
    }
}   