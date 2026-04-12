import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { recomputeLedger } from "@/lib/taxEngine/recomputeLedger";

const COUNTRY_STRATEGY_MAP = {
    INDIA:"FIFO",
    USA:"HIFO",
    CANADA:"ACB",
    UK:"UK",
    AUSTRALIA:"FIFO",
}

export async function POST(req) {
    try{
        await connectDB();

        const session = await getServerSession(authOptions);

        if(!session){
            return NextResponse.json(
                {error:"Unauthorized"},
                {status:401}
            );
        }
        const body = await req.json();

        const country = body?.country || "INDIA";
        const strategyOverride = body?.strategyOverride;

        const defaultStrategy = COUNTRY_STRATEGY_MAP[country] || "FIFO";

        const strategy = strategyOverride || defaultStrategy;

        const result = await recomputeLedger({
            userId:session.user.id,
            strategy
        });

        return NextResponse.json({
            success:true,
            country,
            strategy,
            lotsCreated:result.lotsCreated,
            disposalsCreated:result.disposalsCreated,
            filingReady:true
        });
    }catch(error){
        console.error("RECOMPUTE ERROR:",error);

        return NextResponse.json(
            {error:"Failed to recompute ledger"},
            {status:500}
        );
    }
}