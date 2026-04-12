import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import { generateAusCgtReport } from "@/lib/filingEngine/australia/generateAusCgtReport";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    try {
        await requirePaidExportAccess({ userId: session.user.id, region: "AUSTRALIA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const { start, end } = getTaxYearRange({ country: "AUSTRALIA", year });

    try {
        const data = await generateAusCgtReport({
            userId: session.user.id,
            financialYearStart: start,
            financialYearEnd: end,
            entityType: "INDIVIDUAL",
            outputFormat: "csv",
        });

        return new Response(data, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="AUS_CGT_Report_FY${year}-${year + 1}.csv"`,
            },
        });
    } catch (e) {
        console.error("Australia CSV error:", e);
        return NextResponse.json({ error: "Failed to generate CSV" }, { status: 500 });
    }
}
