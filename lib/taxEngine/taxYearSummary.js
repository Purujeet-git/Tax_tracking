import Disposal from "@/models/Disposal";
import mongoose from "mongoose";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";

export async function getTaxYearSummary(
    userId,
    {
        country = "INDIA",
        year = new Date().getFullYear()
    } = {}
) {
    const { label, start, end } =
        getTaxYearRange({
            country,
            year
        });

    const result = await Disposal.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                disposedAt: {
                    $gte: start,
                    $lte: end
                }
            }
        },
        {
            $group: {
                _id: "$taxCategory",
                totalGain: { $sum: "$gainLoss" },
                taxableGainVDA: { $sum: { $cond: [{ $gt: ["$gainLoss", 0] }, "$gainLoss", 0] } },
                totalProceeds: { $sum: "$proceeds" },
                totalCost: { $sum: "$totalCost" },
                trades: { $sum: 1 }
            }
        }
    ]);

    let shortTermGain = 0;
    let longTermGain = 0;
    let specialGain = 0;
    let taxableGainVDA = 0;
    let totalTrades = 0;
    let totalProceeds = 0;
    let totalCost = 0;

    for (const row of result) {
        totalTrades += row.trades;
        totalProceeds += (row.totalProceeds || 0);
        totalCost += (row.totalCost || 0);

        if (country === "INDIA") {
            taxableGainVDA += (row.taxableGainVDA || 0);
        }

        if (row._id === "SHORT_TERM") {
            shortTermGain = row.totalGain;
        } else if (row._id === "LONG_TERM") {
            longTermGain = row.totalGain;
        } else {
            specialGain += row.totalGain;
        }
    }

    const netGainLoss = shortTermGain + longTermGain + specialGain;

    return {
        taxYear: label,
        totalProceeds: Number(totalProceeds.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        netGainLoss: Number(netGainLoss.toFixed(8)),
        taxableIncomeVDA: country === "INDIA" ? Number(taxableGainVDA.toFixed(8)) : null,
        shortTermGain: Number(shortTermGain.toFixed(8)),
        longTermGain: Number(longTermGain.toFixed(8)),
        specialGain: Number(specialGain.toFixed(8)),
        totalGain: Number(netGainLoss.toFixed(8)), // Legacy support
        disposalCount: totalTrades
    };
}