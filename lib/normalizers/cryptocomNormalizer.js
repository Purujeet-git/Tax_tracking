/**
 * Normalizes Crypto.com trade data into the internal Transaction model.
 */
export function normalizeTrades(rawTrades = []) {
    return rawTrades.map((t) => {
        const symbol = t.instrument_name || "";
        const [baseAsset, quoteAsset] = symbol.split("_");
        const side = t.side?.toUpperCase() || "BUY";
        
        const quantity = parseFloat(t.quantity || 0);
        const price = parseFloat(t.price || 0);
        const feeAmount = parseFloat(t.fee || 0);

        return {
            exchange: "CRYPTOCOM",
            assetClass: "CRYPTO",
            symbol,
            baseAsset,
            quoteAsset: quoteAsset || "USDT",
            side,
            quantity,
            price,
            
            feeAmount,
            feeAsset: t.fee_currency || quoteAsset || "USDT",

            unitFiatPrice: price,
            fiatValue: quantity * price,
            fiatCurrency: "USD",

            timestamp: new Date(t.create_time || Date.now()),
            tradeId: t.trade_id || `${symbol}-${Date.now()}`,
            type: "TRADE",
            raw: t
        };
    });
}
