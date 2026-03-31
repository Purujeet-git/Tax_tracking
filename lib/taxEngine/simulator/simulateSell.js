import AssetLot from "@/models/AssetLot";
import Decimal from "decimal.js";
import { getLivePrice } from "@/lib/valuation/getLivePrice";

function sortLots(strategy, lots) {
    switch (strategy) {
        case "FIFO":
            return lots.sort((a, b) => a.acquiredAt - b.acquiredAt);

        case "LIFO":
            return lots.sort((a, b) => b.acquiredAt - a.acquiredAt);

        case "HIFO":
            return lots.sort((a, b) => b.costPerUnit - a.costPerUnit);

        default:
            return lots;
    }
}


export async function simulateSell({
    userId,
    asset,
    quantity,
    strategy = "FIFO",
    price
}) {
    // console.log("Simulating sell...", asset, quantity);
    let sellPrice = price;

    if (!sellPrice) {
        sellPrice = await getLivePrice(asset);

        if (!sellPrice) {
            return { error: "Price Unavailable!" };
        }
    }


    const lots = await AssetLot.find({
        userId,
        asset,
        remainingQuantity: { $gt: 0 }
    });

    if (!lots.length) {
        return { error: "No inventory available" };
    }

    let virtualLots = lots.map(lot => ({
        lotId: lot._id,
        acquiredAt: lot.acquiredAt,
        remainingQuantity: lot.remainingQuantity,
        costPerUnit: lot.costPerUnit
    }));

    virtualLots = sortLots(strategy, virtualLots);

    let remainingToSell = new Decimal(quantity);

    let totalGain = new Decimal(0);
    let shortTermGain = new Decimal(0);
    let longTermGain = new Decimal(0);

    const matchedLots = [];

    for (const lot of virtualLots) {
        if (remainingToSell.lte(0)) break;

        if (lot.remainingQuantity <= 0) continue;

        const qtyFromLot = Decimal.min(
            remainingToSell,
            new Decimal(lot.remainingQuantity)
        );

        const proceeds = qtyFromLot.mul(sellPrice);
        const cost = qtyFromLot.mul(lot.costPerUnit);
        const gainLoss = proceeds.minus(cost);

        const holdingDays = (new Date() - new Date(lot.acquiredAt)) / (1000 * 60 * 60 * 24);

        const taxCategory = holdingDays >= 365 ? "LONG_TERM" : "SHORT_TERM";

        if (taxCategory === "LONG_TERM") {
            longTermGain = longTermGain.plus(gainLoss);
        } else {
            shortTermGain = shortTermGain.plus(gainLoss);
        }

        totalGain = totalGain.plus(gainLoss);

        matchedLots.push({
            lotId: lot.lotId,
            quantity: Number(qtyFromLot),
            costPerUnit: lot.costPerUnit,
            gainLoss: Number(gainLoss.toFixed(8)),
            holdingDays,
            taxCategory
        });

        lot.remainingQuantity -= Number(qtyFromLot);
        remainingToSell = remainingToSell.minus(qtyFromLot);
    }

    return {
        totalGain: Number(totalGain.toFixed(8)),
        shortTermGain: Number(shortTermGain.toFixed(8)),
        longTermGain: Number(longTermGain.toFixed(8)),
        matchedLots,
        remainingUnsold: Number(remainingToSell.toFixed(8))
    };
}