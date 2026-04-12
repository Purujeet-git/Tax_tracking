import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";

export async function GET(){
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

        const trades = await Transaction.find({userId,type:"TRADE"})
            .sort({timestamp:-1})
            .limit(50)
            .select({
                baseAsset:1,
                symbol:1,
                side:1,
                quantity:1,
                price:1,
                exchange:1,
                timestamp:1,
                assetClass:1
            });

        return NextResponse.json({
            success:true,
            trades,
        });
    }catch(err){
        console.error("TRADE HISTORY ERROR:",err);
        return NextResponse.json(
            {error:"Failed to fetch trades"},
            {status:500}
        );
    }
}