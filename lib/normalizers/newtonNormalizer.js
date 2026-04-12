export function normalizeTrades(rawOrders) {
    if (!Array.isArray(rawOrders)) return [];

    // Newton order status may be returned as various strings — accept all completed states
    const COMPLETED_STATUSES = new Set(["FILLED", "COMPLETE", "COMPLETED", "closed", "complete"]);

    return rawOrders
        .filter(o => {
            // Accept if explicitly filled, or if status is in completed set, or no status (assume completed if returned)
            return o.is_filled === true
                || COMPLETED_STATUSES.has(o.status)
                || o.completed_at
                || (!o.status && !o.is_open);
        })
        .map(order => {
            // Newton symbol format: "BTC_CAD" or "ETH_CAD"
            const symbol = String(order.symbol || order.product || "").toUpperCase();
            const parts = symbol.split("_");
            const baseAsset = (parts[0] || "UNKNOWN").toUpperCase();
            const quoteAsset = (parts[1] || "CAD").toUpperCase(); // Newton is Canadian — default CAD

            // Newton side: "BUY" or "SELL" (or "buy"/"sell" lowercase variants)
            const rawSide = String(order.order_type || order.side || order.type || "").toUpperCase();
            const side = rawSide.includes("BUY") ? "BUY" : rawSide.includes("SELL") ? "SELL" : null;

            // Quantity: prefer filled quantity over requested quantity
            const quantity = Number(order.filled_quantity || order.quantity || order.qty || 0);
            // Price: prefer execution price over limit price
            const price = Number(order.average_price || order.price || order.limit_price || 0);
            const feeAmount = Number(order.fee || order.commission || 0);

            // Timestamp: prefer completion time over creation time
            const timestamp = new Date(
                order.completed_at || order.date_created || order.created_at || order.time || Date.now()
            );

            return {
                exchange: "NEWTON",
                symbol: `${baseAsset}${quoteAsset}`,
                baseAsset,
                quoteAsset,
                side,
                quantity,
                price,
                feeAmount,
                feeAsset: quoteAsset,
                tradeId: String(order.order_id || order.id || order.trade_id || ""),
                orderId: String(order.order_id || order.id || ""),
                timestamp,
                raw: order
            };
        })
        .filter(t => t.side && t.quantity > 0 && t.baseAsset !== "UNKNOWN");
}
