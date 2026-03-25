import Disposal from "@/models/Disposal";
import mongoose from "mongoose";

export async function  getRealizedSummary(userId) {
    const result = await Disposal.aggregate([
        {
            $match:{
                userId:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:"$taxCategory",
                totalGain: {$sum:"$gainLoss"},
                trades: { $sum : 1 }
            }
        }
    ]);

    let shortTermGain = 0;
    let longTermGain = 0;
    let totalTrades = 0;

    for(const row of result){
        totalTrades += row.trades;

        if(row._id === "SHORT_TERM"){
            shortTermGain = row.totalGain;
        }

        if(row._id === "LONG_TERM"){
            longTermGain = row.totalGain;
        }
    }

    return{
        shortTermGain: Number(shortTermGain.toFixed(8)),
        longTermGain:Number(longTermGain.toFixed(8)),
        totalGain:Number((shortTermGain + longTermGain).toFixed(8)),
        disposalCount:totalTrades
    };
}