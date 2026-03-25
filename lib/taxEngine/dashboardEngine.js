import Disposal from "@/models/Disposal";
import { calculateUnrealizedPnL } from "./unrealizedPnL";

export async function  getDashboardSummary(userId) {
    console.log("Building dashboard summary...");

    const disposals = await Disposal.find({userId});

    let totalGain = 0;
    let shortTermGain = 0;
    let longTermGain = 0;

    for(const d of disposals){
        totalGain += d.gainLoss;

        if(d.taxCategory === "SHORT_TERM"){
            shortTermGain += d.gainLoss;
        }

        if(d.taxCategory === "LONG_TERM"){
            longTermGain += d.gainLoss;
        }
    }

    const realized = {
        totalGain,
        shortTermGain,
        longTermGain,
        totalDisposals:disposals.length,
    };

    const unrealizedData = await calculateUnrealizedPnL(userId);

    const unrealized = {
        portfolioValue: unrealizedData.totalPortfolioValue,
        costBasis: unrealizedData.totalCostBasis,
        unrealizedGain:unrealizedData.totalUnrealizedPnL,
        assets:unrealizedData.assets,
    };

    const overall = {
        netPnL:totalGain + unrealized.unrealizedGain,
    };

    return {
        realized,
        unrealized,
        overall,
    };
}