import Decimal from "decimal.js";
import Trade from "@/models/Trade";
import { getLivePrice } from "@/lib/valuation/getLivePrice";

function buildLotsFromTrades(trades = []) {
    return trades
        .filter((trade) => trade.type === "BUY")
        .map((trade) => ({
            asset: trade.asset,
            quantity: trade.quantity,
            costPerUnit: trade.price,
            buyDate: trade.date,
            exchange: trade.exchange,
            sourceTradeId: trade._id,
        }));
}

export async function getLossHarvsetingOpportunities(userId) {
    console.log("Scanning loss harvesting opportunities...");

    const trades = await Trade.find({ userId }).sort({
        date: 1,
    });

    if (!trades.length) return [];

    const lots = buildLotsFromTrades(trades);

    if (!lots.length) return [];

    const priceMap = {};
    const opportunities = [];

    // ✅ fetch once per asset-exchange pair
    for (const lot of lots) {
        const key = `${lot.asset}-${lot.exchange}`;

        if (priceMap[key]) continue;

        const livePrice = await getLivePrice(
            lot.asset,
            lot.exchange
        );

        if (
            livePrice !== null &&
            livePrice !== undefined
        ) {
            priceMap[key] = new Decimal(livePrice);
        }
    }

    for (const lot of lots) {
        const key = `${lot.asset}-${lot.exchange}`;

        const currentPrice = priceMap[key];

        if (!currentPrice) continue;

        const cost = new Decimal(lot.costPerUnit);

        if (currentPrice.gte(cost)) continue;

        const qty = new Decimal(lot.quantity);

        const totalLoss = cost
            .minus(currentPrice)
            .mul(qty);

        const estimatedTaxSaving =
            totalLoss.mul(0.3);

        opportunities.push({
            asset: lot.asset,
            lotId: lot.sourceTradeId,
            quantity: Number(qty.toFixed(8)),
            costPerUnit: Number(cost.toFixed(8)),
            currentPrice: Number(
                currentPrice.toFixed(8)
            ),
            totalLoss: Number(totalLoss.toFixed(8)),
            estimatedTaxSaving: Number(
                estimatedTaxSaving.toFixed(8)
            ),
            exchange: lot.exchange,
            buyDate: lot.buyDate,
        });
    }

    opportunities.sort(
        (a, b) => b.estimatedTaxSaving - a.estimatedTaxSaving
    );

    return opportunities;
}