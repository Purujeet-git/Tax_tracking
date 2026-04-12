import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Disposal from "@/models/Disposal";
import { getLossHarvsetingOpportunities } from "@/lib/taxEngine/intelligence/lossHarvesting";

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

        const disposals = await Disposal.find({userId});

        const strategyTotals = {};
        let realizedGain = 0;
        let disposalCount = disposals.length;

        for(const d of disposals){
            realizedGain += d.gainLoss || 0;

            const strategy = d.strategyUsed || "FIFO";

            if(!strategyTotals[strategy]){
                strategyTotals[strategy] = 0;
            }
            strategyTotals[strategy] += d.gainLoss || 0;
        }

        const sortedStrategies = Object.entries(strategyTotals).sort(
            (a,b) => a[1] - b[1]
        );

        const bestStrategy =
            sortedStrategies.length > 0
                ? sortedStrategies[0][0]
                : "FIFO";

        const estimatedTax = Math.max(realizedGain,0)*0.3;

        const harvest = await getLossHarvsetingOpportunities(userId);

        const potentialHarvestSaving = harvest.reduce(
            (sum,h) => sum + (h.estimatedTaxSaving || 0),
            0
        );

        return NextResponse.json({
            success:true,
            taxYear:"FY 2025-26",
            realizedGain:Number(realizedGain.toFixed(2)),
            estimatedTax:Number(estimatedTax.toFixed(2)),
            disposalCount,
            bestStrategy,
            potentialHarvestSaving:Number(
                potentialHarvestSaving.toFixed(2)
            )
        });
    }catch(error){
        console.error("YEAR SUMMARY ERROR:",error);

        return NextResponse.json(
            {error:"Failed to generate year summary"},
            {status:500}
        );
    }
}