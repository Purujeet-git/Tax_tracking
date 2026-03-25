export function normalizeTrades(rawTrades,symbolMap){
    return rawTrades.map(trade => {
        const symbol = trade.symbol;

        const meta = symbolMap[symbol];

        if(!meta){
            console.log("Unknown symbol metadata:",symbol);
        }
        const baseAsset = meta?.baseAsset || null;
        const quoteAsset = meta?.quoteAsset || null;

        const side = trade.isBuyer?"BUY":"SELL";

        return{
            exchange: "BINANCE",

            symbol,

            baseAsset,
            quoteAsset,

            side,

            quantity: Number(trade.qty),
            price: Number(trade.price),

            feeAmount: Number(trade.commission),
            feeAsset: trade.commissionAsset,

            tradeId: trade.id,
            orderId: trade.orderId,

            timestamp: new Date(trade.time),

            raw: trade
        };
    });
}