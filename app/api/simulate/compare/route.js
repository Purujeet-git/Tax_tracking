import { NextResponse } from "next/server";
import { compareStrategies } from "@/lib/taxEngine/simulator/compareStrategies";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";

export async function POST(req){
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json(
            {error:"Unauthorized"},
            {status:401}
        );
    }

    const {asset,quantity} = await req.json();

    const results = await compareStrategies({
        userId:session.user.id,
        asset,
        quantity,
    });

    return NextResponse.json({
        success:true,
        bestStrategy:results.bestStrategy,
        maxSavings:results.maxSavings,
        results:results.results,

    });
}