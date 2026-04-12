export function normalizeTrades(rawOrders) {
    if (!Array.isArray(rawOrders)) return [];

    return rawOrders
        .map(order => {
            // CoinSpot confirmed response fields (from API docs):
            // { amount, rate, total, coin, solddate, market }
            // coin = "BTC", market = "BTC/AUD"
            // coin is already clean — no need to strip /AUD from it
            const baseAsset = String(order.coin || "UNKNOWN").toUpperCase().trim();
            const quoteAsset = "AUD"; // CoinSpot trades exclusively in AUD

            // Side is pre-tagged by our connector (__side: "BUY" or "SELL")
            const side = (order.__side || order.type || "").toUpperCase();

            // Confirmed fields: amount = quantity, rate = price per unit
            const quantity = Number(order.amount || 0);
            const price = Number(order.rate || 0);
            const feeAmount = Number(order.fee || 0);

            // solddate is a UTC ISO string e.g. "2020-05-21T13:22:45.000Z"
            const timestamp = order.solddate
                ? new Date(order.solddate)
                : new Date(order.created || Date.now());

            // Build a stable tradeId from coin + solddate since CoinSpot lacks an order_id
            const tradeId = order.id
                || `${baseAsset}-${order.solddate || order.created || Date.now()}`;

            return {
                exchange: "COINSPOT",
                symbol: `${baseAsset}${quoteAsset}`,
                baseAsset,
                quoteAsset,
                side: side.includes("BUY") ? "BUY" : "SELL",
                quantity,
                price,
                feeAmount,
                feeAsset: "AUD",
                tradeId: String(tradeId),
                orderId: String(tradeId),
                timestamp,
                raw: order
            };
        })
        .filter(t => t.side && t.quantity > 0 && t.baseAsset !== "UNKNOWN");
}
