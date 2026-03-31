import Transaction from "@/models/Transaction";
import Disposal from "@/models/Disposal";
import Decimal from "decimal.js";

export async function runAcbStrategy(userId){
    console.log("Starting ACB Pool matching...");

    const trades = await Transaction.find({
        userId,
        type:"TRADE",
    }).sort({timestamp:1});

    let disposalCount = 0;

    const pool = {};

    for (const tx of trades){
        if(!tx.unitFiatPrice){
            // console.log("Skipping trade without fiat valuation:",tx.symbol);
            continue;
        }

        const asset = tx.baseAsset;

        if(!pool[asset]){
            pool[asset] = {
                qty: new Decimal(0),
                cost: new Decimal(0)
            };
        }

        const state = pool[asset];

        const qty = new Decimal(tx.quantity);
        const price = new Decimal(tx.unitFiatPrice);

        if(tx.side === "BUY"){

            const tradeCost = qty.mul(price);

            state.qty = state.qty.plus(qty);
            state.cost = state.cost.plus(tradeCost);

            continue;
        }

        if(tx.side === "SELL"){
            if(state.qty.lte(0)){
                // console.log("Pool empty for SELL:",asset);
                continue;
            }

            const avgCost = state.cost.div(state.qty);

            const costBasis = avgCost.mul(qty);
            const proceeds = price.mul(qty);
            const gainLoss = proceeds.minus(costBasis);

            const holdingDays = (tx.timestamp - tx.timestamp) / (1000 * 60 * 60 * 24);

            try{
                await Disposal.create({
                    userId,
                    asset,
                    sellTransactionId:tx._id,
                    lotId:null,

                    quantitySold:Number(qty),

                    salePrice:tx.price,
                    proceeds:Number(proceeds.toFixed(12)),

                    costPerUnit:Number(avgCost.toFixed(12)),
                    totalCost:Number(costBasis.toFixed(12)),

                    gainLoss:Number(gainLoss.toFixed(12)),

                    acquiredAt:tx.timestamp,
                    disposedAt:tx.timestamp,

                    holdingDays,
                    taxCategory:"POOL",

                    strategyUsed: "ACB"
                });

                disposalCount++;
            }catch(err){
                if(err.code !== 11000){
                    console.log("ACB Disposal error:",err.message);
                }
            }

            state.qty = state.qty.minus(qty);
            state.cost = state.cost.minus(costBasis);
        }
    }

    // console.log("ACB matching finished:",disposalCount);
    return disposalCount;
}