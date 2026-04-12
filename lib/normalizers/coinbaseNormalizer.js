export function normalizeTrades(rawTrades) {
    if (!Array.isArray(rawTrades)) return [];

    return rawTrades.map(trade => {
        // Coinbase product_id looks like "BTC-USD" or "ETH-USDC"
        const symbol = String(trade.product_id);
        
        const [baseAsset, quoteAsset] = symbol.includes('-') 
            ? symbol.split('-') 
            : [symbol, 'UNKNOWN'];

        // Coinbase side is strictly "BUY" or "SELL" natively
        const side = String(trade.side).toUpperCase();

        return {
            exchange: "COINBASE",
            
            symbol: symbol.replace('-', ''), // Unified format e.g. BTCUSD
            baseAsset,
            quoteAsset,
            side,

            quantity: Number(trade.size), // Base quantity executed
            price: Number(trade.price), // Price executed at
            
            feeAmount: Number(trade.commission || 0),
            // Coinbase commissions are almost universally deducted in the Quote Currency (USD)
            feeAsset: quoteAsset,

            tradeId: String(trade.trade_id),
            orderId: String(trade.order_id),

            timestamp: new Date(trade.trade_time),

            raw: trade
        };
    }).filter(t => t.side && t.quantity > 0);
}
