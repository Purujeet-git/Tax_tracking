import Transaction from "@/models/Transaction";
import AssetLot from "@/models/AssetLot";
import Decimal from "decimal.js";

export async function generateLotsForUser(userId) {
    console.log("Starting lot generation...");

    const buyTrades = await Transaction.find({
        userId,
        side: "BUY",
    }).sort({ timestamp: 1 });


    let createdLots = 0;

    for (const trade of buyTrades) {
        try {
            if (!trade.fiatValue) {
                console.log("⚠️ Skipping unvalued trade:", trade.symbol);
                continue;
            }
            const totalCost = new Decimal(trade.fiatValue || 0);

            const costPerUnit = totalCost.div(trade.quantity);

            await AssetLot.create({
                userId,
                asset: trade.baseAsset,
                exchange: trade.exchange,
                sourceTransactionId: trade._id,
                acquiredAt: trade.timestamp,

                totalQuantity: trade.quantity,
                remainingQuantity: trade.quantity,
                costPerUnit: Number(costPerUnit.toFixed(12)),
                totalCost: Number(totalCost.toFixed(12)),
            });

            createdLots++;
        } catch (err) {
            if (err.code === 11000) {
                continue;
            } else {
                console.log("Lot creation error:", err.message);
            }
        }
    }

    console.log("Lots created:", createdLots);

    return createdLots;
}