import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { recomputeLedger } from "@/lib/taxEngine/recomputeLedger";

export async function POST(req) {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const body = await req.json();
    const strategy = body?.strategy || "FIFO";

    const result = await recomputeLedger({
        userId: session.user.id,
        strategy
    });

    return NextResponse.json({
        success: true,
        strategy,
        lotsCreated: result.lotsCreated,
        disposalsCreated: result.disposalsCreated
    });
}