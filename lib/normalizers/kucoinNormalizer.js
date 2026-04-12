export function normalizeTrades(rawTrades) {
    if (!Array.isArray(rawTrades)) return [];

    return rawTrades.map(trade => {
        // KuCoin symbol format: "BTC-USDT"
        const symbol = String(trade.symbol || "");
        const parts = symbol.split("-");
        const baseAsset = parts[0] || "UNKNOWN";
        const quoteAsset = parts[1] || "UNKNOWN";

        // KuCoin side: "buy" or "sell"
        const side = String(trade.side || "").toUpperCase();

        const quantity = Number(trade.size);
        const price = Number(trade.price);
        const feeAmount = Number(trade.fee || 0);
        const feeAsset = trade.feeCurrency || quoteAsset;

        return {
            exchange: "KUCOIN",
            symbol: symbol.replace("-", ""),   // Unified: BTCUSDT
            baseAsset,
            quoteAsset,
            side,
            quantity,
            price,
            feeAmount,
            feeAsset,
            tradeId: String(trade.tradeId),
            orderId: String(trade.orderId),
            timestamp: new Date(Number(trade.createdAt)),
            raw: trade
        };
    }).filter(t => t.side && t.quantity > 0);
}
