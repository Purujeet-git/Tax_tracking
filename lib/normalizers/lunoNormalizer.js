// Luno uses XBT for Bitcoin (same convention as Kraken)
function normalizeLunoAsset(asset) {
    if (!asset) return "UNKNOWN";
    if (asset === "XBT") return "BTC";
    return asset.toUpperCase();
}

// Luno pairs are concatenated: "XBTGBP" = XBT (BTC) + GBP
// Base currencies are always 3 chars, quote currencies are also 3 chars
function parseLunoPair(pair) {
    if (!pair || pair.length < 6) return { baseAsset: "UNKNOWN", quoteAsset: "UNKNOWN" };
    const rawBase = pair.slice(0, 3);
    const rawQuote = pair.slice(3);
    return {
        baseAsset: normalizeLunoAsset(rawBase),
        quoteAsset: normalizeLunoAsset(rawQuote)
    };
}

export function normalizeTrades(rawOrders) {
    if (!Array.isArray(rawOrders)) return [];

    return rawOrders
        .filter(order => order.state === "COMPLETE" && order.type)
        .map(order => {
            const { baseAsset, quoteAsset } = parseLunoPair(order.pair);

            // Luno order types: "BID" = buy, "ASK" = sell
            const side = order.type === "BID" ? "BUY" : "SELL";

            // Luno volumes are plain decimal strings in the API
            const quantity = Number(order.limit_volume || order.base || 0);
            const price = Number(order.limit_price || 0);

            // Fees are in the base currency for bids, counter currency for asks
            const feeBase = Number(order.fee_base || 0);
            const feeCounter = Number(order.fee_counter || 0);
            const feeAmount = side === "BUY" ? feeBase : feeCounter;
            const feeAsset = side === "BUY" ? baseAsset : quoteAsset;

            return {
                exchange: "LUNO",
                symbol: `${baseAsset}${quoteAsset}`,
                baseAsset,
                quoteAsset,
                side,
                quantity,
                price,
                feeAmount,
                feeAsset,
                tradeId: String(order.order_id),
                orderId: String(order.order_id),
                // Luno timestamps are Unix milliseconds
                timestamp: new Date(Number(order.completed_timestamp || order.creation_timestamp)),
                raw: order
            };
        })
        .filter(t => t.side && t.quantity > 0);
}
