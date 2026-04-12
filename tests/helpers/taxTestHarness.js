import { createHash } from "node:crypto";
import Decimal from "decimal.js";
import { parse } from "csv-parse/sync";

export const FIFO_COUNTRIES = ["INDIA", "USA", "AUSTRALIA"];

export function parseGoldenCsv(csvText) {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((row, index) => normalizeCsvRow(row, index + 2));
}

export function normalizeCsvRow(row, sourceLine = null) {
  const quantity = Number(row.Quantity);
  const price = Number(row.Price);
  const fee = row.Fee === "" || row.Fee == null ? 0 : Number(row.Fee);
  const timestamp = new Date(row.Date);

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(`Invalid quantity on line ${sourceLine ?? "unknown"}`);
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Invalid price on line ${sourceLine ?? "unknown"}`);
  }

  if (!Number.isFinite(fee) || fee < 0) {
    throw new Error(`Invalid fee on line ${sourceLine ?? "unknown"}`);
  }

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error(`Invalid timestamp on line ${sourceLine ?? "unknown"}`);
  }

  return {
    id: createTransactionId(row),
    sourceLine,
    timestamp,
    type: row.Type.toUpperCase(),
    side: row.Type.toUpperCase(),
    asset: row.Asset,
    baseAsset: row.Asset,
    symbol: `${row.Asset}${row.Currency}`,
    quantity,
    price,
    unitFiatPrice: price,
    fee,
    currency: row.Currency,
    exchange: row.Exchange?.trim() || "UNKNOWN",
    raw: row,
  };
}

export function createTransactionId(row) {
  return createHash("sha256")
    .update([
      row.Date,
      row.Type,
      row.Asset,
      row.Quantity,
      row.Price,
      row.Fee ?? "0",
      row.Currency,
      row.Exchange || "UNKNOWN",
    ].join("|"))
    .digest("hex");
}

export function normalizeExchangeTrade(rawTrade, exchange = "Binance") {
  const side = rawTrade.isBuyer ? "BUY" : "SELL";
  const quoteAsset = rawTrade.quoteAsset || "USD";
  const row = {
    Date: new Date(rawTrade.time).toISOString(),
    Type: side,
    Asset: rawTrade.baseAsset,
    Quantity: rawTrade.qty,
    Price: rawTrade.price,
    Fee: rawTrade.commission ?? 0,
    Currency: quoteAsset,
    Exchange: exchange,
  };

  return normalizeCsvRow(row);
}

export function detectDuplicateTransactions(transactions) {
  const seen = new Set();
  const duplicates = [];

  for (const tx of transactions) {
    if (seen.has(tx.id)) duplicates.push(tx);
    seen.add(tx.id);
  }

  return duplicates;
}

export function runFifo(transactions) {
  const lotsByAsset = new Map();
  const disposals = [];

  for (const tx of sortedTrades(transactions)) {
    if (tx.type === "TRANSFER") continue;

    if (tx.type === "BUY") {
      const cost = new Decimal(tx.quantity).mul(tx.price).plus(tx.fee);
      const costPerUnit = cost.div(tx.quantity);
      const lot = {
        asset: tx.asset,
        acquiredAt: tx.timestamp,
        remainingQuantity: new Decimal(tx.quantity),
        costPerUnit,
      };
      lotsByAsset.set(tx.asset, [...(lotsByAsset.get(tx.asset) || []), lot]);
      continue;
    }

    if (tx.type === "SELL") {
      let remainingToSell = new Decimal(tx.quantity);
      const lots = lotsByAsset.get(tx.asset) || [];
      const grossProceeds = new Decimal(tx.quantity).mul(tx.price);
      const netProceeds = grossProceeds.minus(tx.fee);
      let combinedCost = new Decimal(0);
      let earliestAcquiredAt = null;

      for (const lot of lots) {
        if (remainingToSell.lte(0)) break;
        if (lot.remainingQuantity.lte(0)) continue;

        const quantitySold = Decimal.min(remainingToSell, lot.remainingQuantity);
        const totalCost = quantitySold.mul(lot.costPerUnit);
        combinedCost = combinedCost.plus(totalCost);
        earliestAcquiredAt = !earliestAcquiredAt || lot.acquiredAt < earliestAcquiredAt
          ? lot.acquiredAt
          : earliestAcquiredAt;

        lot.remainingQuantity = lot.remainingQuantity.minus(quantitySold);
        remainingToSell = remainingToSell.minus(quantitySold);
      }

      if (remainingToSell.gt(0)) {
        throw new Error(`Negative inventory for ${tx.asset}`);
      }

      const holdingDays = daysBetween(earliestAcquiredAt, tx.timestamp);
      disposals.push({
        asset: tx.asset,
        quantitySold: tx.quantity,
        proceeds: toNumber(netProceeds),
        totalCost: toNumber(combinedCost),
        gainLoss: toNumber(netProceeds.minus(combinedCost)),
        acquiredAt: earliestAcquiredAt.toISOString(),
        disposedAt: tx.timestamp.toISOString(),
        holdingDays,
        taxCategory: holdingDays >= 365 ? "LONG_TERM" : "SHORT_TERM",
        strategyUsed: "FIFO",
      });
    }
  }

  return disposals;
}

export function runAcb(transactions) {
  const pool = new Map();
  const disposals = [];

  for (const tx of sortedTrades(transactions)) {
    if (tx.type === "TRANSFER") continue;
    const state = pool.get(tx.asset) || { quantity: new Decimal(0), cost: new Decimal(0) };

    if (tx.type === "BUY") {
      state.quantity = state.quantity.plus(tx.quantity);
      state.cost = state.cost.plus(new Decimal(tx.quantity).mul(tx.price).plus(tx.fee));
      pool.set(tx.asset, state);
      continue;
    }

    if (tx.type === "SELL") {
      if (state.quantity.lte(0)) throw new Error(`Negative inventory for ${tx.asset}`);

      const quantitySold = new Decimal(tx.quantity);
      const averageCost = state.cost.div(state.quantity);
      const proceeds = quantitySold.mul(tx.price).minus(tx.fee);
      const totalCost = averageCost.mul(quantitySold);
      const gainLoss = proceeds.minus(totalCost);

      disposals.push({
        asset: tx.asset,
        quantitySold: toNumber(quantitySold),
        proceeds: toNumber(proceeds),
        totalCost: toNumber(totalCost),
        gainLoss: toNumber(gainLoss),
        acquiredAt: tx.timestamp.toISOString(),
        disposedAt: tx.timestamp.toISOString(),
        holdingDays: 0,
        taxCategory: "POOL",
        strategyUsed: "ACB",
      });

      state.quantity = state.quantity.minus(quantitySold);
      state.cost = state.cost.minus(totalCost);
      pool.set(tx.asset, state);
    }
  }

  return disposals;
}

export function runUkMatching(transactions) {
  const trades = sortedTrades(transactions).filter((tx) => tx.type !== "TRANSFER");
  const pool = new Map();
  const futureBuyRemaining = new Map();
  const disposals = [];

  for (const tx of trades) {
    if (tx.type === "BUY") {
      futureBuyRemaining.set(tx.id, new Decimal(tx.quantity));
    }
  }

  for (let index = 0; index < trades.length; index += 1) {
    const tx = trades[index];
    const state = pool.get(tx.asset) || { quantity: new Decimal(0), cost: new Decimal(0) };

    if (tx.type === "BUY") {
      state.quantity = state.quantity.plus(tx.quantity);
      state.cost = state.cost.plus(new Decimal(tx.quantity).mul(tx.price).plus(tx.fee));
      pool.set(tx.asset, state);
      continue;
    }

    if (tx.type !== "SELL") continue;

    let remainingToSell = new Decimal(tx.quantity);
    remainingToSell = matchUkBuys({
      disposals,
      tx,
      remainingToSell,
      buys: trades.filter((candidate) =>
        candidate.type === "BUY" &&
        candidate.asset === tx.asset &&
        utcDay(candidate.timestamp) === utcDay(tx.timestamp)
      ),
      futureBuyRemaining,
      category: "SAME_DAY",
    });

    remainingToSell = matchUkBuys({
      disposals,
      tx,
      remainingToSell,
      buys: trades.slice(index + 1).filter((candidate) =>
        candidate.type === "BUY" &&
        candidate.asset === tx.asset &&
        candidate.timestamp > tx.timestamp &&
        daysBetween(tx.timestamp, candidate.timestamp) <= 30
      ),
      futureBuyRemaining,
      category: "BED_AND_BREAKFAST",
    });

    if (remainingToSell.gt(0)) {
      const current = pool.get(tx.asset);
      if (!current || current.quantity.lte(0)) throw new Error(`Negative inventory for ${tx.asset}`);

      const averageCost = current.cost.div(current.quantity);
      const proceeds = remainingToSell.mul(tx.price).minus(remainingToSell.div(tx.quantity).mul(tx.fee));
      const totalCost = averageCost.mul(remainingToSell);
      const gainLoss = proceeds.minus(totalCost);

      disposals.push({
        asset: tx.asset,
        quantitySold: toNumber(remainingToSell),
        proceeds: toNumber(proceeds),
        totalCost: toNumber(totalCost),
        gainLoss: toNumber(gainLoss),
        acquiredAt: tx.timestamp.toISOString(),
        disposedAt: tx.timestamp.toISOString(),
        holdingDays: 0,
        taxCategory: "SECTION_104",
        strategyUsed: "UK",
      });

      current.quantity = current.quantity.minus(remainingToSell);
      current.cost = current.cost.minus(totalCost);
      pool.set(tx.asset, current);
    }
  }

  return disposals;
}

function matchUkBuys({ disposals, tx, remainingToSell, buys, futureBuyRemaining, category }) {
  let remaining = remainingToSell;

  for (const buy of buys) {
    if (remaining.lte(0)) break;
    const buyRemaining = futureBuyRemaining.get(buy.id) || new Decimal(0);
    if (buyRemaining.lte(0)) continue;

    const quantitySold = Decimal.min(remaining, buyRemaining);
    const buyCostPerUnit = new Decimal(buy.quantity).mul(buy.price).plus(buy.fee).div(buy.quantity);
    const proceeds = quantitySold.mul(tx.price).minus(quantitySold.div(tx.quantity).mul(tx.fee));
    const totalCost = quantitySold.mul(buyCostPerUnit);
    const gainLoss = proceeds.minus(totalCost);

    disposals.push({
      asset: tx.asset,
      quantitySold: toNumber(quantitySold),
      proceeds: toNumber(proceeds),
      totalCost: toNumber(totalCost),
      gainLoss: toNumber(gainLoss),
      acquiredAt: buy.timestamp.toISOString(),
      disposedAt: tx.timestamp.toISOString(),
      holdingDays: 0,
      taxCategory: category,
      strategyUsed: "UK",
    });

    futureBuyRemaining.set(buy.id, buyRemaining.minus(quantitySold));
    remaining = remaining.minus(quantitySold);
  }

  return remaining;
}

export function summarizeDisposals(disposals, country = "USA") {
  const summary = disposals.reduce((acc, disposal) => {
    acc.totalProceeds = acc.totalProceeds.plus(disposal.proceeds);
    acc.totalCost = acc.totalCost.plus(disposal.totalCost);
    acc.totalGain = acc.totalGain.plus(disposal.gainLoss);

    if (disposal.taxCategory === "SHORT_TERM") {
      acc.shortTermGain = acc.shortTermGain.plus(disposal.gainLoss);
    } else if (disposal.taxCategory === "LONG_TERM") {
      acc.longTermGain = acc.longTermGain.plus(disposal.gainLoss);
    } else {
      acc.specialGain = acc.specialGain.plus(disposal.gainLoss);
    }

    return acc;
  }, {
    totalProceeds: new Decimal(0),
    totalCost: new Decimal(0),
    totalGain: new Decimal(0),
    shortTermGain: new Decimal(0),
    longTermGain: new Decimal(0),
    specialGain: new Decimal(0),
  });

  return {
    country,
    totalGain: toNumber(summary.totalGain),
    shortTermGain: toNumber(summary.shortTermGain),
    longTermGain: toNumber(summary.longTermGain),
    specialGain: toNumber(summary.specialGain),
    totalProceeds: toNumber(summary.totalProceeds),
    totalCost: toNumber(summary.totalCost),
    disposalCount: disposals.length,
  };
}

export function applyCountryRules(country, disposals) {
  const summary = summarizeDisposals(disposals, country);

  if (country === "INDIA") {
    return {
      ...summary,
      taxableIncomeVDA: toNumber(disposals.reduce(
        (sum, disposal) => disposal.gainLoss > 0 ? sum.plus(disposal.gainLoss) : sum,
        new Decimal(0)
      )),
    };
  }

  if (country === "CANADA") {
    return {
      ...summary,
      taxableCapitalGain: toNumber(new Decimal(summary.totalGain).mul(0.5)),
    };
  }

  if (country === "AUSTRALIA") {
    return {
      ...summary,
      discountedCapitalGain: toNumber(disposals.reduce(
        (sum, disposal) => disposal.holdingDays > 365 && disposal.gainLoss > 0
          ? sum.plus(new Decimal(disposal.gainLoss).mul(0.5))
          : sum,
        new Decimal(0)
      )),
    };
  }

  return summary;
}

export function exportDisposalsCsv(disposals) {
  const header = "Asset,Quantity Sold,Proceeds,Cost Basis,Gain/Loss,Tax Category,Strategy";
  const rows = disposals.map((item) => [
    item.asset,
    formatNumber(item.quantitySold),
    formatNumber(item.proceeds),
    formatNumber(item.totalCost),
    formatNumber(item.gainLoss),
    item.taxCategory,
    item.strategyUsed,
  ].join(","));

  return [header, ...rows].join("\n");
}

export function hashCsv(csv) {
  return createHash("sha256").update(csv).digest("hex");
}

export function sortedTrades(transactions) {
  return [...transactions].sort((a, b) => a.timestamp - b.timestamp);
}

export function utcTaxYear(date) {
  return date.getUTCFullYear();
}

export function daysBetween(start, end) {
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function utcDay(date) {
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  return Number(new Decimal(value).toDecimalPlaces(8).toString());
}

function formatNumber(value) {
  return new Decimal(value).toDecimalPlaces(8).toString();
}
