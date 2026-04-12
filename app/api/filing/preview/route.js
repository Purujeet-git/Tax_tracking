import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { buildFilingPreview, normalizeExportRegion } from "@/lib/filingEngine/exportPreview";
import { hasPaidExportAccess } from "@/lib/payments/exportAccess";

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const region = normalizeExportRegion(searchParams.get("region"));
        const year = Number(searchParams.get("year"));

        const preview = await buildFilingPreview({ userId: session.user.id, region, year });
        const paid = await hasPaidExportAccess({ userId: session.user.id, region, year });

        return NextResponse.json({
            success: true,
            paid,
            ...preview,
        });
    } catch (e) {
        console.error("Filing preview error:", e);
        return NextResponse.json({ error: e.message || "Failed to build filing preview" }, { status: 500 });
    }
}
