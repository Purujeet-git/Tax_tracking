export function normalizeTrades(rawTrades, symbolMap) {
    if (!Array.isArray(rawTrades)) return [];

    return rawTrades.map(trade => {
        // CoinDCX symbol e.g., "B-BTC_INR"
        const symbol = String(trade.market || trade.symbol || "");
        if (!symbol) return null;

        const meta = symbolMap[symbol] || {};

        const baseAsset = meta.baseAsset || symbol.split('_')[0].replace('B-', '');
        const quoteAsset = meta.quoteAsset || symbol.split('_')[1];

        // CoinDCX trade sides: "buy" or "sell"
        const side = String(trade.side).toUpperCase();

        return {
            exchange: "COINDCX",
            
            symbol,
            baseAsset,
            quoteAsset,
            side,

            // Convert string strings to precision numbers
            quantity: Number(trade.total_quantity),
            price: Number(trade.price_per_unit || trade.avg_price),
            
            // CoinDCX returns fee dynamically
            feeAmount: Number(trade.fee_amount || 0),
            feeAsset: quoteAsset, // Usually deducted in quote currency for INR pairs

            tradeId: trade.id,
            orderId: trade.id,

            timestamp: new Date(trade.updated_at || trade.created_at),

            raw: trade
        };
    }).filter(t => t && (t.side === "BUY" || t.side === "SELL") && t.quantity > 0);
}
