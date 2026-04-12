export function normalizeTrades(rawTrades, symbolMap) {
    if (!Array.isArray(rawTrades)) return [];

    return rawTrades.map(trade => {
        const symbol = trade.symbol;

        const meta = symbolMap[symbol] || {};
        
        // WazirX symbols are usually lowercase like "btcinr"
        let baseAsset = meta.baseAsset;
        let quoteAsset = meta.quoteAsset;

        if (!baseAsset) {
            // Fallback parsing for common ones if map fails
            if (symbol.endsWith("inr")) {
                quoteAsset = "INR";
                baseAsset = symbol.replace("inr", "").toUpperCase();
            } else if (symbol.endsWith("usdt")) {
                quoteAsset = "USDT";
                baseAsset = symbol.replace("usdt", "").toUpperCase();
            }
        } else {
            baseAsset = baseAsset.toUpperCase();
            quoteAsset = quoteAsset.toUpperCase();
        }

        // isBuyer flag
        const side = trade.isBuyer ? "BUY" : "SELL";

        return {
            exchange: "WAZIRX",
            
            symbol,
            baseAsset,
            quoteAsset,
            side,

            quantity: Number(trade.qty),
            price: Number(trade.price),
            
            feeAmount: Number(trade.commission || 0),
            feeAsset: (trade.commissionAsset || quoteAsset).toUpperCase(),

            // Standardize tradeId strictly to string
            tradeId: String(trade.id),
            orderId: String(trade.orderId || trade.id),

            timestamp: new Date(trade.time || trade.timestamp),

            raw: trade
        };
    }).filter(t => t.side && t.quantity > 0);
}
