import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import { runFifoMatching } from "@/lib/taxEngine/fifoMatcher";
import { runMatchingEngine } from "@/lib/taxEngine/matchingEngine";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getHistoricalUsdPrice } from "@/lib/valuation/oracle/cryptoPriceOracle";

export async function GET(){
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json({error:"Unauthorized"},{status:401});
    }

    const userId = session.user.id;

    const ethbtcSellPrice = 0.031;

    const btcUsd = await getHistoricalUsdPrice(
        "BTC",
        new Date()
    );

    const unitFiatPrice = ethbtcSellPrice * btcUsd;

    const quantity = 0.01;

    const sellTx = await Transaction.create({
        userId,
        exchange:"SIMULATOR",
        symbol:"ETHBTC",
        baseAsset:"ETH",
        quoteAsset:"BTC",
        side:"SELL",

        quantity,
        price:ethbtcSellPrice,

        unitFiatPrice,
        fiatValue:quantity * unitFiatPrice,
        fiatCurrency:"USD",
        fxRateUsed:btcUsd,
        valuationSource:"SIMULATED_CROSS",

        tradeId:"SIM-" + Date.now(),
        timestamp: new Date(),
    });

    const disposalsCreated = await runMatchingEngine({userId,strategy:"FIFO",sellId:sellTx._id});

    return NextResponse.json({
        success:true,
        simulatedSell: sellTx._id,
        disposalsCreated
    });
}