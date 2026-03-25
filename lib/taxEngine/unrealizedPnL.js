import AssetLot from "@/models/AssetLot";
import axios from "axios";

async function getBinancePrice(symbol){
    try{
        const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
        return Number(res.data.price);
    }catch(err){
        console.log("Price fetch failed for:",symbol);
        return null;
    }
}


export async function calculateUnrealizedPnL(userId) {
    console.log("Calculating unrealized PnL....");

    const openLots = await AssetLot.find({
        userId,
        remainingQuantity:{$gt:0},
    });

    if(!openLots.length){
        return {
            totalPortfolioValue:0,
            totalCostBasis:0,
            totalUnrealizedPnL:0,
            assets:[],
        };
    }

    const assetMap = {};

    for(const lot of openLots){
        if(!assetMap[lot.asset]){
            assetMap[lot.asset] = {
                quantity:0,
                cost:0,
            };
        }

        assetMap[lot.asset].quantity += lot.remainingQuantity;
        assetMap[lot.asset].cost += lot.remainingQuantity * lot.costPerUnit;
    }

    let totalPortfolioValue = 0;
    let totalCostBasis = 0;

    const assets = [];

    for(const asset of Object.keys(assetMap)){
        const qty = assetMap[asset].quantity;
        const cost = assetMap[asset].cost;

        const price = await getBinancePrice(asset);

        if(!price){
            continue;
        }
        const qtyD = new Decimal(qty);

        const marketValue = qtyD.mul(price);
        const costD = new Decimal(cost);

        const unrealized = marketValue.minus(costD);

        totalPortfolioValue += marketValue;
        totalCostBasis += cost;

        assets.push({
            asset,
            quantity:qty,
            avgCost:cost/qty,
            marketPrice:price,
            marketValue:Number(marketValue.toFixed(12)),
            unrealizedPnL:Number(unrealized.toFixed(12)),
        });
    }


    return{
        totalPortfolioValue,
        totalCostBasis,
        totalUnrealizedPnL:totalPortfolioValue - totalCostBasis,
        assets,
    };
}