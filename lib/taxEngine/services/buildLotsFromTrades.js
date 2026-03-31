export function buildLotsFromTrades(trades = []){
    const lots = [];

    for(const trade of trades){
        if(trade.type === "BUY"){
            lots.push({
                asset:trade.asset,
                quantity:trade.quantity,
                costPerUnit:trade.price,
                buyDate:trade.date,
                exchange:trade.exchange,
                sourceTradeId:trade._id,
            });
        }
    }

    return lots;
}