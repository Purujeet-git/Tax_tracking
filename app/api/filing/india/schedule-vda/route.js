import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import { generateScheduleVDA } from "@/lib/filingEngine/india/generateScheduleVDA";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";

export async function GET(req) {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session) {
        return new Response("Unauthorized", {
            status: 401
        });
    }

    const { searchParams } = new URL(req.url);

    const year =
        Number(searchParams.get("year")) || 2024;
    try {
        await requirePaidExportAccess({ userId: session.user.id, region: "INDIA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }

    const { start, end, label } =
        getTaxYearRange({
            country: "INDIA",
            year
        });

    const csv = await generateScheduleVDA({
        userId: session.user.id,
        financialYearStart: start,
        financialYearEnd: end
    });

    return new Response(csv, {
        status: 200,
        headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="india_schedule_vda_${label}.csv"`
        }
    });
}