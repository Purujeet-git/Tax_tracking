import Transaction from "@/models/Transaction";
import AssetLot from "@/models/AssetLot";
import Disposal from "@/models/Disposal";
import SellLotSelection from "@/models/SellLotSelection";
import Decimal from "decimal.js";

export async function runSpecificIdStrategy(userId,specificSellId = null) {
    console.log("Starting Specific ID matching...");

    const sellQuery = {
        userId,
        side:"SELL"
    };

    if(specificSellId){
        sellQuery._id = specificSellId;
    }

    const sells = await Transaction.find(sellQuery).sort({timestamp:1});

    let disposalCount = 0;

    for(const sell of sells){
        if(!sells.unitFiatPrice){
            console.log("Skipping SELL without fiat valuation:",sell.symbol);
            continue;
        }

        const selections = await SellLotSelection.find({
            userId,
            sellTransactionId:sell._id,
        });

        if(!selections.length){
            console.log("No lot selections found for SELL:",sell._id);
            continue;
        }

        for(const sel of selections){
            const lot = await AssetLot.findById(sel.lotId);

            if(!lot || lot.remainingQuantity <= 0){
                console.log("Invalid or exhausted lot:",sel.lotId);
                continue;
            }

            const qtyFromLot = Math.min(sel.quantity, lot.remainingQuantity);

            const qty = new Decimal(qtyFromLot);

            const proceeds = qty.mul(sell.unitFiatPrice);
            const totalCost = qty.mul(lot.costPerUnit);
            const gainCost = proceeds.minus(totalCost);

            const holdingDays = (sell.timestamp - lot.acquiredAt)/(1000 * 60 * 60 * 24);

            const taxCategory = holdingDays >= 365 ? "LONG_TERM": "SHORT_TERM";

            try{
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
                    strategyUsed: "SPECIFIC_ID"
                });

                disposalCount++;
            }
            catch(err){
                if(err.code === 11000){
                    console.log("Lot already matched before");
                }else{
                    console.log("Disposal Error:",err.message);
                }
            }

            lot.remainingQuantity -= qtyFromLot;
            await lot.save();
        }
    }

    console.log("Specific ID matching finished:",disposalCount);
    return disposalCount;
}