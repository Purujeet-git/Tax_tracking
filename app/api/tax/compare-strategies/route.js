import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Transaction from "@/models/Transaction";
import { compareStrategies } from "@/lib/taxEngine/simulator/compareStrategies";

export async function GET(req) {
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

        const latestTrade = await Transaction.find({
            userId,
            type:"TRADE"
        }).sort({timestamp:-1});

        if(!latestTrade){
            return NextResponse.json({
                success:true,
                strategies:[]
            });
        }

        const asset = latestTrade.baseAsset;

        const totalAvailableQty = await Transaction.aggregate([
            {
                $match:{
                    userId: latestTrade.userId,
                    baseAsset: asset,
                    type:"TRADE"
                }
            },
            {
                $group:{
                    _id:null,
                    qty:{
                        $sum:{
                            $cond: [
                                { $eq: ["$side","BUY"]},
                                "$quantity",
                                {$multiply: ["$quantity",-1]}
                            ]
                        }
                    }
                }
            }
        ]);

        const quantity = totalAvailableQty?.[0]?.qty || 0;

        if(quantity <= 0){
            return NextResponse.json({
                success:true,
                strategies:[]
            });
        }

        const comparision = await compareStrategies({
            userId,
            asset,
            quantity
        });

        const strategies = comparision.results.map((r) => ({
            strategy: r.strategy,
            totalGain: r.totalGain,
            disposalCount: r.totalDisposals || 0,
            matchedLots: r.matchedLots || []
        }));

        return NextResponse.json({
            success:true,
            strategies,
        });
    }catch(error){
        console.error("COMPARE STRATEGIES ERROR:",error);

        return NextResponse.json(
            {error:"Failed to compare strategies"},
            {status:500}
        );
    }
}