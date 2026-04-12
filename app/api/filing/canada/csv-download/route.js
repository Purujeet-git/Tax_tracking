import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import { generateCanadaT5008Report } from "@/lib/filingEngine/canada/generateCanadaT5008Report";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";
import { NextResponse } from "next/server";

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    try {
        await requirePaidExportAccess({ userId: session.user.id, region: "CANADA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const { start, end } = getTaxYearRange({ country: "CANADA", year });

    try {
        const data = await generateCanadaT5008Report({
            userId: session.user.id,
            financialYearStart: start,
            financialYearEnd: end,
            outputFormat: "csv",
        });

        return new Response(data, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="Canada_CGT_T5008_${year}.csv"`,
            },
        });
    } catch (e) {
        console.error("Canada CSV error:", e);
        return NextResponse.json({ error: "Failed to generate CSV" }, { status: 500 });
    }
}
