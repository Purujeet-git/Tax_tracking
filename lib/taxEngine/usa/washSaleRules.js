import Decimal from "decimal.js";

/**
 * IRS Section 1019 - Wash Sale Rule:
 * If a 'substantially identical' security is purchased 30 days BEFORE or AFTER a sale at a loss.
 * The loss is disallowed and added to the cost basis of the new asset.
 */
export function identifyWashSales(disposals = [], allTransactions = []) {
    const washSales = [];
    const windowDays = 30;
    const windowMs = windowDays * 24 * 60 * 60 * 1000;

    // Filter potential replacement purchases (BUY trades)
    const allBuys = allTransactions.filter(tx => tx.side === "BUY");

    for (const d of disposals) {
        // Rule only applies to losses
        if (d.gainLoss >= 0) continue;

        const asset = d.asset;
        const sellDate = new Date(d.disposedAt);

        // Window: [sellDate - 30 days, sellDate + 30 days]
        const windowStart = new Date(sellDate.getTime() - windowMs);
        const windowEnd = new Date(sellDate.getTime() + windowMs);

        // Find any BUY of the same asset in this window (excluding the one that created this disposal lot if possible)
        const replacements = allBuys.filter(buy => 
            buy.baseAsset === asset &&
            new Date(buy.timestamp) >= windowStart &&
            new Date(buy.timestamp) <= windowEnd &&
            String(buy._id) !== String(d.lotId) // Don't count the original buy that created the lot
        );

        if (replacements.length > 0) {
            // Found Wash Sale trigger
            const firstReplacement = replacements.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0];
            
            washSales.push({
                disposalId: d._id,
                disallowedLoss: Math.abs(d.gainLoss),
                replacementTransactionId: firstReplacement._id,
                message: `Wash Sale Triggered: Bought back ${asset} within 30 days of loss sale.`
            });
        }
    }

    return washSales;
}

/**
 * Adjusts cost basis of future lots based on wash sale disallowed losses.
 */
export function applyWashSaleAdjustments(lots = [], washSales = []) {
    for (const ws of washSales) {
        const replacementLot = lots.find(l => String(l.sourceTransactionId) === String(ws.replacementTransactionId));
        if (replacementLot) {
            // Add disallowed loss to cost basis
            const extraCost = new Decimal(ws.disallowedLoss);
            const currentTotalCost = new Decimal(replacementLot.totalCost);
            const newTotalCost = currentTotalCost.plus(extraCost);
            
            replacementLot.totalCost = Number(newTotalCost.toFixed(8));
            replacementLot.costPerUnit = Number(newTotalCost.div(replacementLot.totalQuantity).toFixed(8));
            
            replacementLot.isWashSaleAdjustment = true;
            replacementLot.disallowedLossApplied = ws.disallowedLoss;
        }
    }
    return lots;
}
