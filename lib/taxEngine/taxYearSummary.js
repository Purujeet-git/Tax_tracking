import Disposal from "@/models/Disposal";
import mongoose from "mongoose";

function getIndiaTaxYearRange(date = new Date()){
    const year = date.getMonth() >= 3
        ? date.getFullYear()
        : date.getFullYear() - 1;

    const start = new Date(year,3,1);
    const end = new Date(year + 1, 2 , 31,23,59,59);

    return {
        label: `FY${year} - ${(year + 1).toString().slice(2)}`,
        start,
        end,
    };
}

export async function getIndiaTaxYearSummary(userId) {
    const {label,start,end} = getIndiaTaxYearRange();

    const result = await Disposal.aggregate([
        {
            $match:{
                userId:new mongoose.Types.ObjectId(userId),
                disposedAt:{$gte:start,$lte:end},
            },
        },
        {
            $group:{
                _id:"$taxCategory",
                totalGain: { $sum: "$gainLoss"},
                trades: {$sum:1},
            },
        },
    ]);

    let shortTermGain = 0;
    let longTermGain = 0;
    let totalTrades = 0;

    for(const row of result) {
        totalTrades += row.trades;

        if(row._id === "SHORT_TERM"){
            shortTermGain = row.totalGain;
        }

        if(row._id === "LONG_TERM"){
            longTermGain = row.totalGain;
        }
    }

    return {
        taxYear: label,
        shortTermGain: Number(shortTermGain.toFixed(8)),
        longTermGain:Number(longTermGain.toFixed(8)),
        totalGain:Number((shortTermGain + longTermGain).toFixed(8)),
        disposalCount:totalTrades,
    };
}