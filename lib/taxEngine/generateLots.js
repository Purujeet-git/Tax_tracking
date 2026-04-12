import Transaction from "@/models/Transaction";
import AssetLot from "@/models/AssetLot";
import Decimal from "decimal.js";

export async function generateLotsForUser(userId) {
    console.log("Starting lot generation...");

    const buyTrades = await Transaction.find({
        userId,
        type: "TRADE",
        side: "BUY",
    }).sort({ timestamp: 1 });

    let createdLots = 0;

    for (const trade of buyTrades) {
        try {
            const quantity = new Decimal(trade.quantity || 0);

            if (quantity.lte(0)) {
                console.log("⚠️ Skipping invalid quantity:", trade.symbol);
                continue;
            }

            let totalCost;

            if (trade.fiatValue) {
                totalCost = new Decimal(trade.fiatValue);
            } else if (trade.unitFiatPrice) {
                totalCost = quantity.mul(
                    new Decimal(trade.unitFiatPrice)
                );
            } else {
                console.log(
                    "⚠️ Skipping unvalued trade:",
                    trade.symbol
                );
                continue;
            }

            const costPerUnit = totalCost.div(quantity);

            await AssetLot.create({
                userId,
                asset: trade.baseAsset,
                exchange: trade.exchange,
                sourceTransactionId: trade._id,
                acquiredAt: trade.timestamp,

                totalQuantity: Number(quantity.toFixed(12)),
                remainingQuantity: Number(quantity.toFixed(12)),

                costPerUnit: Number(
                    costPerUnit.toFixed(12)
                ),
                totalCost: Number(totalCost.toFixed(12)),
            });

            createdLots++;
        } catch (err) {
            if (err.code === 11000) {
                continue;
            } else {
                console.log(
                    "Lot creation error:",
                    err.message
                );
            }
        }
    }

    console.log("Lots created:", createdLots);

    return createdLots;
}