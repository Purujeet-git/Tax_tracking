import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { generateAusCgtReport } from "@/lib/filingEngine/australia/generateAusCgtReport";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    const { start, end, label } = getTaxYearRange({ country: "AUSTRALIA", year });

    try {
        const data = await generateAusCgtReport({
            userId: session.user.id,
            financialYearStart: start,
            financialYearEnd: end,
            entityType: "INDIVIDUAL",
            outputFormat: "json",
        });
        return NextResponse.json({ success: true, label, summary: data.summary });
    } catch (e) {
        console.error("Australia pdf-data error:", e);
        return NextResponse.json({ error: "Failed to fetch Australia summary" }, { status: 500 });
    }
}
