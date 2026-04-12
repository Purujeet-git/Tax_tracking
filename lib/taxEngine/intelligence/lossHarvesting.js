import Decimal from "decimal.js";
import AssetLot from "@/models/AssetLot";
import { getLivePrice } from "@/lib/valuation/getLivePrice";

/**
 * Scans the portfolio for unrealized losses and potential tax savings.
 * For India (Section 115BBH): VDA losses cannot be offset against VDA gains.
 * We must correctly identify this and provide the right advice.
 */
export async function getLossHarvsetingOpportunities(userId, country = "INDIA") {
    console.log(`Scanning loss harvesting opportunities for user: ${userId} (Region: ${country})...`);

    // Only scan lots that still have balance
    const activeLots = await AssetLot.find({ 
        userId, 
        remainingQuantity: { $gt: 0 } 
    }).sort({ acquiredAt: 1 });

    if (!activeLots.length) return [];

    const priceMap = {};
    const opportunities = [];

    // Aggregating prices by asset to minimize API calls
    for (const lot of activeLots) {
        const key = `${lot.asset}-${lot.exchange}`;
        if (priceMap[key]) continue;

        const livePrice = await getLivePrice(lot.asset, lot.exchange);
        if (livePrice !== null && livePrice !== undefined) {
            priceMap[key] = new Decimal(livePrice);
        }
    }

    for (const lot of activeLots) {
        const key = `${lot.asset}-${lot.exchange}`;
        const currentPrice = priceMap[key];

        if (!currentPrice) continue;

        const cost = new Decimal(lot.costPerUnit);
        if (currentPrice.gte(cost)) continue;

        const qty = new Decimal(lot.remainingQuantity);
        const totalLoss = cost.minus(currentPrice).mul(qty);

        // Indian Tax Code (Section 115BBH) Compliance:
        // Loss from one VDA cannot be offset against gain from another VDA.
        // Therefore, "Harvesting" for tax saving is functionally impossible for VDAs in India.
        const estimatedTaxSaving = country === "INDIA" ? new Decimal(0) : totalLoss.mul(0.3);

        opportunities.push({
            asset: lot.asset,
            lotId: lot._id,
            quantity: Number(qty.toFixed(8)),
            costPerUnit: Number(cost.toFixed(8)),
            currentPrice: Number(currentPrice.toFixed(8)),
            totalLoss: Number(totalLoss.toFixed(8)),
            estimatedTaxSaving: Number(estimatedTaxSaving.toFixed(8)),
            exchange: lot.exchange,
            acquiredAt: lot.acquiredAt,
            warning: country === "INDIA" ? "Section 115BBH: VDA losses cannot offset gains in India." : null
        });
    }

    // Sort by most significant loss
    opportunities.sort((a, b) => b.totalLoss - a.totalLoss);

    return opportunities;
}