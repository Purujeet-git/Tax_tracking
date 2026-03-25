import Transaction from "@/models/Transaction";
import Disposal from "@/models/Disposal";
import Decimal from "decimal.js";

function getUtcDayKey(date) {
  return date.toISOString().slice(0, 10);
}

export async function runUkStrategy(userId) {

  console.log("Starting UK matching engine...");

  const trades = await Transaction.find({
    userId,
    type: "TRADE"
  }).sort({ timestamp: 1 });

  let disposalCount = 0;

  const sameDayBuyMap = {};
  const pool = {};

  for (let i = 0; i < trades.length; i++) {

    const tx = trades[i];

    if (!tx.unitFiatPrice) continue;

    const asset = tx.baseAsset;
    const dayKey = getUtcDayKey(tx.timestamp);

    if (!sameDayBuyMap[asset]) sameDayBuyMap[asset] = {};
    if (!sameDayBuyMap[asset][dayKey]) sameDayBuyMap[asset][dayKey] = [];

    if (!pool[asset]) {
      pool[asset] = {
        qty: new Decimal(0),
        cost: new Decimal(0)
      };
    }

    const qty = new Decimal(tx.quantity);
    const price = new Decimal(tx.unitFiatPrice);

    // ===== BUY =====
    if (tx.side === "BUY") {

      // track remaining for B&B
      tx.__ukRemainingQty = new Decimal(tx.quantity);

      // same-day bucket
      sameDayBuyMap[asset][dayKey].push({
        ref: tx,
        remaining: tx.__ukRemainingQty,
        price
      });

      // also immediately add to pool
      const tradeCost = qty.mul(price);
      pool[asset].qty = pool[asset].qty.plus(qty);
      pool[asset].cost = pool[asset].cost.plus(tradeCost);

      continue;
    }

    // ===== SELL =====
    if (tx.side === "SELL") {

      let remainingToSell = qty;

      // STEP-1 SAME DAY
      const sameDayBuys = sameDayBuyMap[asset][dayKey];

      for (const buy of sameDayBuys) {

        if (remainingToSell.lte(0)) break;
        if (buy.remaining.lte(0)) continue;

        const consume = Decimal.min(remainingToSell, buy.remaining);

        const proceeds = consume.mul(price);
        const costBasis = consume.mul(buy.price);
        const gainLoss = proceeds.minus(costBasis);

        await Disposal.create({
          userId,
          asset,
          sellTransactionId: tx._id,
          lotId: null,
          quantitySold: Number(consume),
          salePrice: tx.price,
          proceeds: Number(proceeds.toFixed(12)),
          costPerUnit: Number(buy.price.toFixed(12)),
          totalCost: Number(costBasis.toFixed(12)),
          gainLoss: Number(gainLoss.toFixed(12)),
          acquiredAt: tx.timestamp,
          disposedAt: tx.timestamp,
          holdingDays: 0,
          taxCategory: "SAME_DAY",
          strategyUsed: "UK"
        });

        disposalCount++;

        buy.remaining = buy.remaining.minus(consume);
        remainingToSell = remainingToSell.minus(consume);

        // remove from pool too
        pool[asset].qty = pool[asset].qty.minus(consume);
        pool[asset].cost = pool[asset].cost.minus(costBasis);
      }

      // STEP-2 BED & BREAKFAST
      if (remainingToSell.gt(0)) {

        const sellTime = tx.timestamp.getTime();
        const windowEnd = sellTime + (30 * 86400000);

        for (let j = i + 1; j < trades.length; j++) {

          const future = trades[j];

          if (future.baseAsset !== asset) continue;
          if (future.side !== "BUY") continue;

          const futureTime = future.timestamp.getTime();
          if (futureTime > windowEnd) break;

          if (future.__ukRemainingQty.lte(0)) continue;

          const futurePrice = new Decimal(future.unitFiatPrice);

          const consume = Decimal.min(
            remainingToSell,
            future.__ukRemainingQty
          );

          const proceeds = consume.mul(price);
          const costBasis = consume.mul(futurePrice);
          const gainLoss = proceeds.minus(costBasis);

          await Disposal.create({
            userId,
            asset,
            sellTransactionId: tx._id,
            lotId: null,
            quantitySold: Number(consume),
            salePrice: tx.price,
            proceeds: Number(proceeds.toFixed(12)),
            costPerUnit: Number(futurePrice.toFixed(12)),
            totalCost: Number(costBasis.toFixed(12)),
            gainLoss: Number(gainLoss.toFixed(12)),
            acquiredAt: future.timestamp,
            disposedAt: tx.timestamp,
            holdingDays: 0,
            taxCategory: "BED_AND_BREAKFAST",
            strategyUsed: "UK"
          });

          disposalCount++;

          future.__ukRemainingQty =
            future.__ukRemainingQty.minus(consume);

          remainingToSell = remainingToSell.minus(consume);

          if (remainingToSell.lte(0)) break;
        }
      }

      // STEP-3 SECTION-104 POOL
      if (remainingToSell.gt(0)) {

        const state = pool[asset];

        if (state.qty.gt(0)) {

          const avgCost = state.cost.div(state.qty);

          const costBasis = avgCost.mul(remainingToSell);
          const proceeds = price.mul(remainingToSell);
          const gainLoss = proceeds.minus(costBasis);

          await Disposal.create({
            userId,
            asset,
            sellTransactionId: tx._id,
            lotId: null,
            quantitySold: Number(remainingToSell),
            salePrice: tx.price,
            proceeds: Number(proceeds.toFixed(12)),
            costPerUnit: Number(avgCost.toFixed(12)),
            totalCost: Number(costBasis.toFixed(12)),
            gainLoss: Number(gainLoss.toFixed(12)),
            acquiredAt: tx.timestamp,
            disposedAt: tx.timestamp,
            holdingDays: 0,
            taxCategory: "SECTION_104",
            strategyUsed: "UK"
          });

          disposalCount++;

          state.qty = state.qty.minus(remainingToSell);
          state.cost = state.cost.minus(costBasis);
        }
      }
    }
  }

  console.log("UK matching finished:", disposalCount);

  return disposalCount;
}