/**
 * Normalizes Gemini trade data into the internal Transaction model.
 */
export function normalizeTrades(rawTrades = []) {
    return rawTrades.map((t) => {
        const symbol = t.symbol || "";
        // Gemini symbols are like 'btcusd'
        const baseAsset = symbol.substring(0, 3).toUpperCase();
        const quoteAsset = symbol.substring(3).toUpperCase();
        
        const side = t.type?.toUpperCase() || "BUY";
        
        const quantity = parseFloat(t.amount || 0);
        const price = parseFloat(t.price || 0);
        const feeAmount = parseFloat(t.fee_amount || 0);

        return {
            exchange: "GEMINI",
            assetClass: "CRYPTO",
            symbol,
            baseAsset,
            quoteAsset: quoteAsset || "USD",
            side,
            quantity,
            price,
            
            feeAmount,
            feeAsset: t.fee_currency || quoteAsset || "USD",

            unitFiatPrice: price,
            fiatValue: quantity * price,
            fiatCurrency: "USD",

            timestamp: new Date(t.timestampms || t.timestamp || Date.now()),
            tradeId: t.trade_id || t.tid || `${symbol}-${Date.now()}`,
            type: "TRADE",
            raw: t
        };
    });
}
