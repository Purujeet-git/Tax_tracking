import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { parse } from "csv-parse/sync";
import Trade from "@/models/Trade";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";


function detectFormat(headers){
    if(headers.includes("symbol") && headers.includes("side")){
        return "binance";
    }

    if(headers.includes("tradingsymbol")) {
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
        fee: Number(r.fee || 0),
        feeAsset: r.feeAsset || "USDT",
        source: "csv_upload",
        exchange: "binance",
        raw: r,
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
        fee: Number(r.charges || 0),
        feeAsset: "INR",
        source: "csv_upload",
        exchange: "zerodha",
        raw: r,
    }));
}

function generateTradeKey(trade) {
    return `${trade.asset}-${trade.date.toISOString()}-${trade.quantity}-${trade.price}-${trade.type}`;
}

export async function POST(req){
    try{
        await connectDB();

        const session = await getServerSession(authOptions);

        if(!session){
            return NextResponse.json(
                {error:"Unauthorized"},
                {status:401}
            );
        }

        const userId = session.user.id;
        const formData = await req.formData();
        const file = formData.get("file");

        if(!file){
            return NextResponse.json(
                {error:"No file uploaded"},
                {status:400}
            );
        }

        const text = await file.text();

        const records = parse(text, {
            columns:true,
            skip_empty_lines:true,
        });
        
        if(!records.length){
            return NextResponse.json(
                {error:"CSV is empty"},
                {status:400}
            );
        }

        const headers = Object.keys(records[0]);
        const format = detectFormat(headers);

        let normalizedTrades = [];

        if(format === "binance"){
            normalizedTrades = parseBinance(records);
        }else if(format === "zerodha"){
            normalizedTrades = parseZerodha(records);
        }else{
            return NextResponse.json(
                {error:"Unsupported CSV format"},
                {status:400}
            );
        }

        const existingTrades = await Trade.find({
            userId,
            date:{
                $in: normalizedTrades.map((t) => t.date),
            },
        });

        const existingKeys = new Set(
            existingTrades.map((t) => generateTradeKey(t))
        );

        const newTrades = normalizedTrades
            .filter((t) => !existingKeys.has(generateTradeKey(t)))
            .map((t) => ({
                ...t,
                userId,
            }));

        if(newTrades.length){
            await Trade.insertMany(newTrades, { ordered:false});
        }

        return NextResponse.json({
            success:true,
            count:newTrades.length,
            skipped:normalizedTrades.length - newTrades.length,
            exchange:format,
        });
    }catch(err){
        console.error("CSV Upload Error:",err);

        return NextResponse.json(
            {error:"Failed to process CSV"},
            {status:500}
        );
    }
}