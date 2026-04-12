import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FIFO_COUNTRIES,
  applyCountryRules,
  detectDuplicateTransactions,
  exportDisposalsCsv,
  hashCsv,
  normalizeCsvRow,
  normalizeExchangeTrade,
  parseGoldenCsv,
  runAcb,
  runFifo,
  runUkMatching,
  utcTaxYear,
} from "../helpers/taxTestHarness";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(__dirname, "../fixtures");
const goldenCsv = fs.readFileSync(path.join(fixturesDir, "golden-master-btc-eth-mixed.csv"), "utf8");

function readSnapshot(name) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, `${name}.json`), "utf8"));
}

function expectCloseObject(received, expected, keys) {
  for (const key of keys) {
    expect(received[key], key).toBeCloseTo(expected[key], 8);
  }
}

describe("golden master CSV import", () => {
  it("parses every row with stable normalized fields", () => {
    const trades = parseGoldenCsv(goldenCsv);

    expect(trades).toHaveLength(7);
    expect(trades[0]).toMatchObject({
      type: "BUY",
      side: "BUY",
      asset: "BTC",
      baseAsset: "BTC",
      symbol: "BTCUSD",
      quantity: 1,
      price: 50000,
      fee: 50,
      currency: "USD",
      exchange: "Binance",
    });
    expect(trades[5].type).toBe("TRANSFER");
  });

  it("normalizes exchange API trades into the same ingestion shape as CSV imports", () => {
    const normalized = normalizeExchangeTrade({
      id: 1001,
      orderId: 9001,
      isBuyer: false,
      baseAsset: "BTC",
      quoteAsset: "USD",
      qty: "0.8",
      price: "60000",
      commission: "30",
      time: "2025-05-01T10:00:00Z",
    }, "Binance");

    expect(normalized).toMatchObject({
      type: "SELL",
      asset: "BTC",
      quantity: 0.8,
      price: 60000,
      fee: 30,
      exchange: "Binance",
      symbol: "BTCUSD",
    });
  });
});

describe("FIFO golden master cost basis", () => {
  it("matches manual BTC, ETH, and total gain truth", () => {
    const disposals = runFifo(parseGoldenCsv(goldenCsv));

    expect(disposals).toHaveLength(3);
    expect(disposals[0]).toMatchObject({
      asset: "BTC",
      quantitySold: 0.8,
      proceeds: 47970,
      totalCost: 40040,
      gainLoss: 7930,
      taxCategory: "SHORT_TERM",
    });
    expect(disposals[1]).toMatchObject({
      asset: "ETH",
      quantitySold: 4,
      proceeds: 13990,
      totalCost: 12008,
      gainLoss: 1982,
      taxCategory: "SHORT_TERM",
    });
    expect(disposals[2]).toMatchObject({
      asset: "BTC",
      quantitySold: 0.3,
      proceeds: 19480,
      totalCost: 15515,
      gainLoss: 3965,
      taxCategory: "SHORT_TERM",
    });

    const summary = applyCountryRules("USA", disposals);
    expect(summary.totalGain).toBe(13877);
    expect(summary.totalProceeds).toBe(81440);
    expect(summary.totalCost).toBe(67563);
  });

  it.each(FIFO_COUNTRIES)("returns total gain 13877 USD for %s", (country) => {
    const summary = applyCountryRules(country, runFifo(parseGoldenCsv(goldenCsv)));
    expect(summary.totalGain).toBe(13877);
    expect(summary.shortTermGain).toBe(13877);
    expect(summary.longTermGain).toBe(0);
  });
});

describe("country strategy snapshots", () => {
  it("matches USA regression snapshot", () => {
    const snapshot = readSnapshot("usa");
    const disposals = runFifo(parseGoldenCsv(goldenCsv));
    const summary = applyCountryRules("USA", disposals);
    const exportedCsvHash = hashCsv(exportDisposalsCsv(disposals));

    expectCloseObject(summary, snapshot, [
      "totalGain",
      "shortTermGain",
      "longTermGain",
      "totalProceeds",
      "totalCost",
      "disposalCount",
    ]);
    expect(disposals).toMatchObject(snapshot.lotMatches);
    expect(exportedCsvHash).toBe(snapshot.exportedCsvHash);
  });

  it("matches India regression snapshot including VDA taxable income", () => {
    const snapshot = readSnapshot("india");
    const summary = applyCountryRules("INDIA", runFifo(parseGoldenCsv(goldenCsv)));

    expectCloseObject(summary, snapshot, [
      "totalGain",
      "shortTermGain",
      "longTermGain",
      "taxableIncomeVDA",
      "totalProceeds",
      "totalCost",
      "disposalCount",
    ]);
  });

  it("matches Australia regression snapshot including CGT discount field", () => {
    const snapshot = readSnapshot("australia");
    const summary = applyCountryRules("AUSTRALIA", runFifo(parseGoldenCsv(goldenCsv)));

    expectCloseObject(summary, snapshot, [
      "totalGain",
      "shortTermGain",
      "longTermGain",
      "discountedCapitalGain",
      "totalProceeds",
      "totalCost",
      "disposalCount",
    ]);
  });

  it("matches Canada pooled ACB snapshot and 50 percent taxable gain", () => {
    const snapshot = readSnapshot("canada");
    const disposals = runAcb(parseGoldenCsv(goldenCsv));
    const summary = applyCountryRules("CANADA", disposals);

    expectCloseObject(summary, snapshot, [
      "totalGain",
      "taxableCapitalGain",
      "specialGain",
      "totalProceeds",
      "totalCost",
      "disposalCount",
    ]);
    expect(hashCsv(exportDisposalsCsv(disposals))).toBe(snapshot.exportedCsvHash);
  });

  it("matches UK section 104 snapshot for the golden dataset", () => {
    const snapshot = readSnapshot("uk");
    const disposals = runUkMatching(parseGoldenCsv(goldenCsv));
    const summary = applyCountryRules("UK", disposals);

    expectCloseObject(summary, snapshot, [
      "totalGain",
      "specialGain",
      "totalProceeds",
      "totalCost",
      "disposalCount",
    ]);
    expect(disposals).toMatchObject(snapshot.lotMatches);
    expect(hashCsv(exportDisposalsCsv(disposals))).toBe(snapshot.exportedCsvHash);
  });
});

describe("UK same-day and bed-and-breakfast matching", () => {
  it("matches same-day buys before section 104 pool", () => {
    const rows = [
      normalizeCsvRow({ Date: "2025-01-01T09:00:00Z", Type: "BUY", Asset: "BTC", Quantity: "1", Price: "10000", Fee: "0", Currency: "USD", Exchange: "Coinbase" }),
      normalizeCsvRow({ Date: "2025-02-01T09:00:00Z", Type: "SELL", Asset: "BTC", Quantity: "0.5", Price: "12000", Fee: "0", Currency: "USD", Exchange: "Coinbase" }),
      normalizeCsvRow({ Date: "2025-02-01T18:00:00Z", Type: "BUY", Asset: "BTC", Quantity: "0.5", Price: "11000", Fee: "0", Currency: "USD", Exchange: "Coinbase" }),
    ];

    const disposals = runUkMatching(rows);
    expect(disposals[0]).toMatchObject({
      taxCategory: "SAME_DAY",
      quantitySold: 0.5,
      proceeds: 6000,
      totalCost: 5500,
      gainLoss: 500,
    });
  });

  it("matches future buys inside the 30-day bed-and-breakfast window", () => {
    const rows = [
      normalizeCsvRow({ Date: "2025-01-01T09:00:00Z", Type: "BUY", Asset: "ETH", Quantity: "10", Price: "1000", Fee: "0", Currency: "USD", Exchange: "Kraken" }),
      normalizeCsvRow({ Date: "2025-02-01T09:00:00Z", Type: "SELL", Asset: "ETH", Quantity: "4", Price: "1300", Fee: "0", Currency: "USD", Exchange: "Kraken" }),
      normalizeCsvRow({ Date: "2025-02-20T09:00:00Z", Type: "BUY", Asset: "ETH", Quantity: "4", Price: "1200", Fee: "0", Currency: "USD", Exchange: "Kraken" }),
    ];

    const disposals = runUkMatching(rows);
    expect(disposals[0]).toMatchObject({
      taxCategory: "BED_AND_BREAKFAST",
      quantitySold: 4,
      proceeds: 5200,
      totalCost: 4800,
      gainLoss: 400,
    });
  });
});

describe("UI/export parity", () => {
  it("export CSV totals equal summary values rendered by the backend", () => {
    const disposals = runFifo(parseGoldenCsv(goldenCsv));
    const summary = applyCountryRules("USA", disposals);
    const csv = exportDisposalsCsv(disposals);
    const [, ...rows] = csv.split("\n");

    const exportedTotals = rows.reduce((acc, row) => {
      const [, , proceeds, costBasis, gainLoss] = row.split(",");
      acc.totalProceeds += Number(proceeds);
      acc.totalCost += Number(costBasis);
      acc.totalGain += Number(gainLoss);
      return acc;
    }, { totalProceeds: 0, totalCost: 0, totalGain: 0 });

    expect(exportedTotals.totalProceeds).toBe(summary.totalProceeds);
    expect(exportedTotals.totalCost).toBe(summary.totalCost);
    expect(exportedTotals.totalGain).toBe(summary.totalGain);
  });
});

describe("critical import edge cases", () => {
  it("detects duplicate rows instead of silently corrupting imports", () => {
    const trades = parseGoldenCsv(goldenCsv);
    const duplicates = detectDuplicateTransactions([...trades, trades[0]]);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe(trades[0].id);
  });

  it("keeps near-midnight UTC sells in the correct tax year", () => {
    const tx = normalizeCsvRow({
      Date: "2025-12-31T23:59:59Z",
      Type: "SELL",
      Asset: "BTC",
      Quantity: "0.1",
      Price: "50000",
      Fee: "0",
      Currency: "USD",
      Exchange: "Binance",
    });

    expect(utcTaxYear(tx.timestamp)).toBe(2025);
  });

  it("defaults missing fees to zero", () => {
    const tx = normalizeCsvRow({
      Date: "2025-04-01T10:00:00Z",
      Type: "BUY",
      Asset: "BTC",
      Quantity: "1",
      Price: "50000",
      Fee: "",
      Currency: "USD",
      Exchange: "Binance",
    });

    expect(tx.fee).toBe(0);
  });

  it("defaults missing exchange names to UNKNOWN", () => {
    const tx = normalizeCsvRow({
      Date: "2025-04-01T10:00:00Z",
      Type: "BUY",
      Asset: "BTC",
      Quantity: "1",
      Price: "50000",
      Fee: "0",
      Currency: "USD",
      Exchange: "",
    });

    expect(tx.exchange).toBe("UNKNOWN");
  });

  it("hard-fails negative quantities", () => {
    expect(() => normalizeCsvRow({
      Date: "2025-04-01T10:00:00Z",
      Type: "BUY",
      Asset: "BTC",
      Quantity: "-1",
      Price: "50000",
      Fee: "0",
      Currency: "USD",
      Exchange: "Binance",
    })).toThrow(/Invalid quantity/);
  });

  it("does not create a taxable disposal for transfers", () => {
    const disposals = runFifo(parseGoldenCsv(goldenCsv));
    expect(disposals.every((disposal) => disposal.asset !== "TRANSFER")).toBe(true);
    expect(disposals).toHaveLength(3);
  });
});
