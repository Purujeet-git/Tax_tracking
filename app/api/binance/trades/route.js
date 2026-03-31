import { NextResponse } from "next/server";
import {  fetchExchangeSymbolMap } from "@/lib/exchanges/binance";
import { discoverUserBinanceTrades } from "@/lib/exchanges/binance";
import { normalizeTrades } from "@/lib/normalizers/binanceNormalizer";
import { insertTransactions } from "@/lib/services/transactionService";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";


export async function POST(req) {
    try {
        await connectDB();

        const session = await getServerSession(authOptions)

        if(!session){
            return NextResponse.json(
                {error:"Unauthorized"},
                {status:401}
            )
        }


        const body = await req.json()
        
        

        const result = await discoverUserBinanceTrades({
            apiKey:body.apiKey,
            secret:body.secret
        })

const rawTrades = result.trades;

        const symbolMap = await fetchExchangeSymbolMap();
        const normalized = normalizeTrades(rawTrades,symbolMap);

        // console.log("Sample normalized trades:",normalized[0]);

        const ethbtcTrade = normalized.find(t => t.symbol === "ETHBTC");
        // console.log("ETHBTC normalized:",ethbtcTrade)
        const inserted = await insertTransactions({
            userId:session.user.id,
            trades:normalized
        })
        return NextResponse.json({
            success: true,
            inserted
        })
    } catch (err) {
        console.log("BINANCE REAL ERROR →", err?.response?.data || err.message)

        return NextResponse.json(
            {
                success: false,
                error: err?.response?.data || err.message,
            },
            { status: 500 }
        )
    }
}

export async function GET() {
    const symbolMap = await fetchExchangeSymbolMap();

    return NextResponse.json({
        totalSymbols: Object.keys(symbolMap).length,
        sample: symbolMap["ETHBTC"]
    });
}