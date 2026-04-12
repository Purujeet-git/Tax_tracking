import Disposal from "@/models/Disposal";
import mongoose from "mongoose";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";

export async function getRealizedMonthly(
    userId,
    {
        country = "INDIA",
        year = new Date().getFullYear()
    } = {}
) {
    console.log(
        "Calculating monthly realized gains..."
    );

    const { start, end } = getTaxYearRange({
        country,
        year
    });

    const result = await Disposal.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(
                    userId
                ),
                disposedAt: {
                    $gte: start,
                    $lte: end
                }
            }
        },
        {
            $group: {
                _id: {
                    month: {
                        $month: "$disposedAt"
                    }
                },
                realizedGain: {
                    $sum: "$gainLoss"
                },
                disposals: {
                    $sum: 1
                }
            }
        },
        {
            $sort: {
                "_id.month": 1
            }
        }
    ]);

    return result.map((row) => ({
        month: row._id.month,
        realizedGain: Number(
            (row.realizedGain || 0).toFixed(8)
        ),
        disposals: row.disposals
    }));
}