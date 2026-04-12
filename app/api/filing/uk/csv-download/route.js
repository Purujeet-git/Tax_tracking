import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import { generateUkCgtReport } from "@/lib/filingEngine/uk/generateUkCgtReport";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    try {
        await requirePaidExportAccess({ userId: session.user.id, region: "UK", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const { start, end } = getTaxYearRange({ country: "UK", year });

    try {
        const data = await generateUkCgtReport({
            userId: session.user.id,
            financialYearStart: start,
            financialYearEnd: end,
            outputFormat: "csv",
        });

        return new Response(data, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="UK_CGT_Report_${year}-${year + 1}.csv"`,
            },
        });
    } catch (e) {
        console.error("UK CSV error:", e);
        return NextResponse.json({ error: "Failed to generate CSV" }, { status: 500 });
    }
}
