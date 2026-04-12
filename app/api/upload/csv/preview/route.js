import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

// reuse same helpers later from shared file
function detectFormat(headers) {
    if (headers.includes("symbol") && headers.includes("side")) {
        return "BINANCE";
    }

    if (headers.includes("tradingsymbol")) {
        return "ZERODHA";
    }

    return "UNKNOWN";
}

function parseBinance(records) {
    return records.map((r) => {
        const symbol = r.symbol;
        const baseAsset = symbol.replace("USDT","");
        const quoteAsset = symbol.endsWith("USDT")
            ?"USDT"
            :null;
        
        return {
            exchange:"BINANCE",
            symbol,
            baseAsset,
            quoteAsset,
            side:r.side?.toUpperCase(),
            quantity:Number(r.quantity),
            price:Number(r.price),
            timestamp:new Date(r.date),
            type:"TRADE",
        };
    });
}

function parseZerodha(records) {
    return records.map((r) => ({
        exchange:"ZERODHA",
        symbol: r.tradingsymbol,
        baseAsset:r.tradingsymbol,
        quoteAsset:"INR",
        side:r.transaction_type?.toUpperCase(),
        quantity: Number(r.quantity),
        price: Number(r.price),
        timestamp:new Date(r.order_timestamp),
        type:"TRADE",
    }));
}

export async function POST(req) {
    try{
        const session = await getServerSession(authOptions);

        if(!session){
            return NextResponse.json(
                {error:"Unauthorized"},
                {status:401}
            );
        }
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

        let preview = [];

        if(format === "BINANCE"){
            preview = parseBinance(records);
        }else if(format === "ZERODHA"){
            preview = parseZerodha(records);
        }else{
            return NextResponse.json(
                {error:"Unsupported CSV format"},
                {status:400}
            );
        }

        return NextResponse.json({
            success:true,
            exchange:format,
            preview:preview.slice(0,20),
            totalRows:preview.length,
            schema:"TRANSACTION",
        });
    }catch(error){
        console.error("CSV PREVIEW ERROR:",error);

        return NextResponse.json(
            {error:"Failed to preview CSV"},
            {status:500}
        );
    }
}