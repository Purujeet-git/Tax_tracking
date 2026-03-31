import Decimal from "decimal.js";

export function matchDisposals(trades = [], strategy = "FIFO") {
    const inventory = {};
    const disposals = [];

    const sortedTrades = [...trades].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    for (const trade of sortedTrades) {
        const asset = trade.asset;

        if (!inventory[asset]) {
            inventory[asset] = [];
        }

        // ✅ BUY creates lots
        if (trade.type === "BUY") {
            inventory[asset].push({
                quantity: new Decimal(trade.quantity),
                price: new Decimal(trade.price),
                date: trade.date,
                tradeId: trade._id,
            });

            continue;
        }

        // ✅ SELL disposal
        if (trade.type === "SELL") {
            let sellQty = new Decimal(trade.quantity);

            // 🧠 choose strategy
            if (strategy === "HIFO") {
                inventory[asset].sort(
                    (a, b) => b.price.minus(a.price).toNumber()
                );
            } else if (strategy === "LIFO") {
                inventory[asset].sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );
            } else {
                // FIFO default
                inventory[asset].sort(
                    (a, b) => new Date(a.date) - new Date(b.date)
                );
            }

            while (
                sellQty.gt(0) &&
                inventory[asset].length > 0
            ) {
                const lot = inventory[asset][0];

                const matchedQty = Decimal.min(
                    sellQty,
                    lot.quantity
                );

                const proceeds = matchedQty.mul(
                    new Decimal(trade.price)
                );

                const costBasis = matchedQty.mul(lot.price);

                const gain = proceeds.minus(costBasis);

                disposals.push({
                    asset,
                    quantity: Number(matchedQty.toFixed(8)),
                    proceeds: Number(proceeds.toFixed(8)),
                    costBasis: Number(costBasis.toFixed(8)),
                    gain: Number(gain.toFixed(8)),
                    sellDate: trade.date,
                    buyDate: lot.date,
                    strategy,
                });

                // update lot
                lot.quantity = lot.quantity.minus(matchedQty);

                if (lot.quantity.lte(0)) {
                    inventory[asset].shift();
                }

                sellQty = sellQty.minus(matchedQty);
            }
        }
    }

    return disposals;
}