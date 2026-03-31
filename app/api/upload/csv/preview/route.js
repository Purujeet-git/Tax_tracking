import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// reuse same helpers later from shared file
function detectFormat(headers) {
    if (headers.includes("symbol") && headers.includes("side")) {
        return "binance";
    }

    if (headers.includes("tradingsymbol")) {
        return "zerodha";
    }

    return "unknown";
}

function parseBinance(records) {
    return records.map((r) => ({
        asset: r.symbol.replace("USDT", ""),
        symbol: r.symbol,
        quantity: Number(r.quantity),
        price: Number(r.price),
        type: r.side?.toUpperCase(),
        date: new Date(r.date),
    }));
}

function parseZerodha(records) {
    return records.map((r) => ({
        asset: r.tradingsymbol,
        symbol: r.tradingsymbol,
        quantity: Number(r.quantity),
        price: Number(r.price),
        type: r.transaction_type?.toUpperCase(),
        date: new Date(r.order_timestamp),
    }));
}

export async function POST(req) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
        return NextResponse.json(
            { error: "No file uploaded" },
            { status: 400 }
        );
    }

    const text = await file.text();

    const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
    });

    const headers = Object.keys(records[0]);
    const format = detectFormat(headers);

    let preview = [];

    if (format === "binance") {
        preview = parseBinance(records);
    } else if (format === "zerodha") {
        preview = parseZerodha(records);
    }

    return NextResponse.json({
        success: true,
        exchange: format,
        preview: preview.slice(0, 20), // show only first 20
        totalRows: preview.length,
    });
}