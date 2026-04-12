import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateForm8949 } from "@/lib/filingEngine/usa/generateForm8949";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";

function escapeCSV(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    try {
        await requirePaidExportAccess({ userId: session.user.id, region: "USA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    
    const start = new Date(`${year}-01-01T00:00:00Z`);
    const end = new Date(`${year}-12-31T23:59:59Z`);

    const data = await generateForm8949({
        userId: session.user.id,
        financialYearStart: start,
        financialYearEnd: end
    });

    const csvRows = [];
    csvRows.push([ ...data.header, "Term" ].map(escapeCSV).join(","));

    for (const row of data.shortTerm) {
        csvRows.push([ ...row, "Short-Term" ].map(escapeCSV).join(","));
    }

    for (const row of data.longTerm) {
        csvRows.push([ ...row, "Long-Term" ].map(escapeCSV).join(","));
    }

    return new Response(csvRows.join("\n"), {
        status: 200,
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="USA_Form8949_${year}.csv"`
        }
    });
}
