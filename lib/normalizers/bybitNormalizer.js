/**
 * Normalizes Bybit trade data into the internal Transaction model.
 */
export function normalizeTrades(rawTrades = []) {
    return rawTrades.map((t) => {
        const symbol = t.symbol || "";
        const side = t.side?.toUpperCase() || "BUY";
        
        // Symbol parsing logic (assuming USDT quote mostly)
        const quoteAsset = "USDT";
        const baseAsset = symbol.replace(quoteAsset, "");

        const quantity = parseFloat(t.execQty || t.orderQty || 0);
        const price = parseFloat(t.execPrice || t.price || 0);
        const feeAmount = parseFloat(t.execFee || t.fee || 0);

        return {
            exchange: "BYBIT",
            assetClass: "CRYPTO",
            symbol,
            baseAsset,
            quoteAsset,
            side,
            quantity,
            price,
            
            feeAmount,
            feeAsset: t.feeAsset || "USDT",

            unitFiatPrice: price,
            fiatValue: quantity * price,
            fiatCurrency: "USD",

            timestamp: new Date(t.execTime || t.time || Date.now()),
            tradeId: t.execId || t.orderId || `${symbol}-${Date.now()}`,
            type: "TRADE",
            raw: t
        };
    });
}
