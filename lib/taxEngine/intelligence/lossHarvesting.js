import AssetLot from "@/models/AssetLot";
import Decimal from "decimal.js";
import { getLivePrice } from "@/lib/valuation/getLivePrice";

export async function getLossHarvsetingOpportunities(userId) {
    console.log("Scanning loss harvesting opportunities...");

    const lots = await AssetLot.find({
        userId,
        remainingQuantity: { $gt: 0}
    });

    if(!lots.length){
        return [];
    }

    const opportunities = [];

    const assets = [...new Set(lots.map(l => l.asset))];

    const priceMap = {};

    for(const asset of assets){
        const price = await getLivePrice(asset);
        if ( price ){
            priceMap[asset] = price;
        }
    }

    for (const lot of lots){
        const currentPrice = priceMap[lot.asset];

        if(!currentPrice) continue;

        const cost = new Decimal(lot.costPerUnit);
        const price = new Decimal(currentPrice);

        if(price.gte(cost)) continue;

        const qty = new Decimal(lot.remainingQuantity);

        const lossPerUnit = cost.minus(price);
        const totalLoss = lossPerUnit.mul(qty);

        const estimatedTaxSaving = totalLoss.mul(0.3);

        opportunities.push({
            asset:lot.asset,
            lotId:lot._id,

            quantity:Number(qty),
            costPerUnit:Number(cost.toFixed(8)),
            currentPrice:Number(price.toFixed(8)),

            totalLoss: Number(totalLoss.toFixed(8)),
            estimatedTaxSaving: Number(estimatedTaxSaving.toFixed(8))
        });
    }

    opportunities.sort(
        (a,b) => b.estimatedTaxSaving - a.estimatedTaxSaving
    );
    console.log("Opportunities are:",opportunities);
    return opportunities;
}