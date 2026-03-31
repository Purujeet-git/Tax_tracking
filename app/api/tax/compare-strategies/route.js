import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Trade from "@/models/Trade";
import { matchDisposals } from "@/lib/taxEngine/disposals/matchDisposals";
import { summarizeDisposals } from "@/lib/taxEngine/disposals/summarizeDisposals";

export async function GET() {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const userId = session.user.id;

    const trades = await Trade.find({ userId });

    const strategies = ["FIFO", "LIFO", "HIFO"];

    const results = strategies.map((strategy) => {
        const disposals = matchDisposals(trades, strategy);
        const summary = summarizeDisposals(disposals);

        return {
            strategy,
            totalGain: summary.totalGain,
            disposalCount: summary.disposalCount,

            matchedLots: disposals.map((d) => ({
                asset:d.asset,
                quantity:d.quantity,
                buyDate:d.buyDate,
                sellDate:d.sellDate,
                costBasis:d.costBasis,
                proceeds:d.proceeds,
                gain:d.gain,
            })),
        };;
    });

    return NextResponse.json({
        success: true,
        strategies: results,
    });
}