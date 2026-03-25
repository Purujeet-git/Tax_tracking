import Transaction from "@/models/Transaction";
import AssetLot from "@/models/AssetLot";
import Disposal from "@/models/Disposal";
import Decimal from "decimal.js";

export async function runFifoMatching(userId, specificSellId = null) {
    console.log("Starting FIFO matching...");

    const sellQuery = {
        userId,
        side: "SELL",
    };

    // ⭐ if specific sell provided → isolate matching
    if (specificSellId) {
        sellQuery._id = specificSellId;
    }

    const sells = await Transaction.find(sellQuery)
        .sort({ timestamp: 1 });

    let disposalCount = 0;

    for (const sell of sells) {

        if (!sell.unitFiatPrice) {
            console.log("⚠️ Skipping SELL without fiat valuation:", sell.symbol);
            continue;
        }

        let remainingToSell = sell.quantity;

        const lots = await AssetLot.find({
            userId,
            asset: sell.baseAsset,
            remainingQuantity: { $gt: 0 },
        }).sort({ acquiredAt: 1 });

        if (!lots.length) {
            console.log("⚠️ No lots available for", sell.baseAsset);
            continue;
        }

        for (const lot of lots) {
            if (remainingToSell <= 0) break;

            const qtyFromLot = Math.min(
                remainingToSell,
                lot.remainingQuantity
            );

            const qty = new Decimal(qtyFromLot);

            const proceeds = qty.mul(sell.unitFiatPrice);
            const totalCost = qty.mul(lot.costPerUnit);
            const gainLoss = proceeds.minus(totalCost);

            const holdingDays =
                (sell.timestamp - lot.acquiredAt) /
                (1000 * 60 * 60 * 24);

            const taxCategory =
                holdingDays >= 365 ? "LONG_TERM" : "SHORT_TERM";

            try {
                await Disposal.create({
                    userId,
                    asset: sell.baseAsset,

                    sellTransactionId: sell._id,
                    lotId: lot._id,

                    quantitySold: qtyFromLot,

                    salePrice: sell.price,
                    proceeds: Number(proceeds.toFixed(12)),

                    costPerUnit: lot.costPerUnit,
                    totalCost: Number(totalCost.toFixed(12)),

                    gainLoss: Number(gainLoss.toFixed(12)),

                    acquiredAt: lot.acquiredAt,
                    disposedAt: sell.timestamp,

                    holdingDays,
                    taxCategory,
                    strategyUsed: "FIFO"
                });

                disposalCount++;

            } catch (err) {
                if (err.code === 11000) {
                    console.log("Lot already matched before");
                } else {
                    console.log("Disposal Error:", err.message);
                }
            }

            lot.remainingQuantity -= qtyFromLot;
            await lot.save();

            remainingToSell -= qtyFromLot;
        }

        if (remainingToSell > 0) {
            console.log("⚠️ Negative inventory detected for", sell.baseAsset);
        }
    }

    console.log("FIFO matching finished. Disposals:", disposalCount);

    return disposalCount;
}