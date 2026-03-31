import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Trade from "@/models/Trade";
import { connectDB } from "@/lib/db";
import { matchDisposals } from "@/lib/taxEngine/disposals/matchDisposals";
import { summarizeDisposals } from "@/lib/taxEngine/disposals/summarizeDisposals";

export async function GET(req) {
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

    const disposals = matchDisposals(trades, "FIFO");

    const summary = summarizeDisposals(disposals);

    return NextResponse.json({
        success: true,
        summary,
        disposals,
    });
}