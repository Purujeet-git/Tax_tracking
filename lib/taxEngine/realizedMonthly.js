import Disposal from "@/models/Disposal";
import mongoose from "mongoose";
export async function getRealizedMonthly(userId) {
    console.log("Calculating monthly realized gains...");

    const result = await Disposal.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$disposedAt" },
                    month: { $month: "$disposedAt" },
                },
                totalGain: { $sum: "$gainLoss" },
                trades: { $sum: 1 },
            },
        },
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1,
            },
        },
    ]);

    return result.map((row) => ({
        year: row._id.year,
        month: row._id.month,
        gain: Number(row.totalGain.toFixed(8)),
        trades: row.trades,
    }));
}