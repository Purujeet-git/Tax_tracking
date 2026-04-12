import Disposal from "@/models/Disposal";
import { calculateUnrealizedPnL } from "./unrealizedPnL";
import Decimal from "decimal.js";

export async function  getDashboardSummary(
    userId,
    country = "INDIA"
) {
    console.log("Building dashboard summary...");

    const disposals = await Disposal.find({userId});

    let totalGain = new Decimal(0);
    let shortTermGain = new Decimal(0);
    let longTermGain = new Decimal(0);
    let specialGain = new Decimal(0);

    for(const d of disposals){
        const gain = new Decimal(d.gainLoss || 0);

        totalGain = totalGain.plus(gain);

        if(d.taxCategory === "SHORT_TERM"){
            shortTermGain = shortTermGain.plus(gain);
        }else if(d.taxCategory === "LONG_TERM"){
            longTermGain = longTermGain.plus(gain);
        }else{
            specialGain = specialGain.plus(gain);
        }
    }

    const realized = {
        totalGain:Number(totalGain.toFixed(8)),
        shortTermGain:Number(shortTermGain.toFixed(8)),
        longTermGain:Number(longTermGain.toFixed(8)),
        specialGain:Number(specialGain.toFixed(8)),
        totalDisposals:disposals.length ,
    };

    const unrealizedData = await calculateUnrealizedPnL(userId);

    const unrealized = {
        portfolioValue: unrealizedData.totalPortfolioValue,
        costBasis: unrealizedData.totalCostBasis,
        unrealizedGain:unrealizedData.totalUnrealizedPnL,
        assets:unrealizedData.assets,
    };

    const overall = {
        netPnL:Number(
            totalGain
                .plus(unrealized.unrealizedGain || 0)
                .toFixed(8)
        ),                                                                  
    };

    return {
        country,
        realized,
        unrealized,
        overall,
    };
}