import { describe, expect, it } from "vitest";

import { normalizeTrades as normalizeBinance } from "../../lib/normalizers/binanceNormalizer";
import { normalizeTrades as normalizeCoinDcx } from "../../lib/normalizers/coindcxNormalizer";
import { normalizeTrades as normalizeWazirx } from "../../lib/normalizers/wazirxNormalizer";
import { normalizeTrades as normalizeCoinbase } from "../../lib/normalizers/coinbaseNormalizer";
import { normalizeTrades as normalizeKucoin } from "../../lib/normalizers/kucoinNormalizer";
import { normalizeTrades as normalizeKraken } from "../../lib/normalizers/krakenNormalizer";
import { normalizeTrades as normalizeLuno } from "../../lib/normalizers/lunoNormalizer";
import { normalizeTrades as normalizeNewton } from "../../lib/normalizers/newtonNormalizer";
import { normalizeTrades as normalizeCoinSpot } from "../../lib/normalizers/coinspotNormalizer";
import { normalizeTrades as normalizeBybit } from "../../lib/normalizers/bybitNormalizer";
import { normalizeTrades as normalizeCryptoCom } from "../../lib/normalizers/cryptocomNormalizer";
import { normalizeTrades as normalizeGemini } from "../../lib/normalizers/geminiNormalizer";

function expectSharedTradeShape(trade, exchange) {
    expect(trade).toMatchObject({
        exchange,
        symbol: expect.any(String),
        baseAsset: expect.any(String),
        quoteAsset: expect.any(String),
        side: expect.stringMatching(/^(BUY|SELL)$/),
        quantity: expect.any(Number),
        price: expect.any(Number),
        feeAmount: expect.any(Number),
        feeAsset: expect.any(String),
        timestamp: expect.any(Date),
    });
    expect(Number.isFinite(trade.quantity)).toBe(true);
    expect(Number.isFinite(trade.price)).toBe(true);
    expect(Number.isFinite(trade.feeAmount)).toBe(true);
    expect(Number.isNaN(trade.timestamp.getTime())).toBe(false);
}

describe("exchange normalizers", () => {
    it.each([
        ["BINANCE", () => normalizeBinance([{
            symbol: "BTCUSDT", isBuyer: true, qty: "0.25", price: "50000", commission: "1.25",
            commissionAsset: "USDT", id: 1, orderId: 10, time: 1735689600000,
        }], { BTCUSDT: { baseAsset: "BTC", quoteAsset: "USDT" } })],
        ["COINDCX", () => normalizeCoinDcx([{
            market: "BTCINR", side: "sell", total_quantity: "0.1", price_per_unit: "4200000",
            fee_amount: "25", fee_currency: "INR", id: "cdx-1", client_order_id: "co-1", created_at: "2025-01-01T00:00:00Z",
        }], { BTCINR: { baseAsset: "BTC", quoteAsset: "INR" } })],
        ["WAZIRX", () => normalizeWazirx([{
            symbol: "btcinr", isBuyer: true, qty: "0.2", price: "4100000", commission: "10",
            commissionAsset: "INR", id: "w-1", orderId: "wo-1", time: "2025-01-01T00:00:00Z",
        }], { btcinr: { baseAsset: "BTC", quoteAsset: "INR" } })],
        ["COINBASE", () => normalizeCoinbase([{
            product_id: "BTC-USD", side: "BUY", size: "0.2", price: "50000", commission: "2",
            trade_id: "cb-1", order_id: "cbo-1", trade_time: "2025-01-01T00:00:00Z",
        }])],
        ["KUCOIN", () => normalizeKucoin([{
            symbol: "BTC-USDT", side: "sell", size: "0.15", price: "51000", fee: "1",
            feeCurrency: "USDT", tradeId: "k-1", orderId: "ko-1", createdAt: 1735689600000,
        }])],
        ["KRAKEN", () => normalizeKraken([{ pair: "XBTUSD", type: "buy", vol: "0.12", price: "50500", fee: "1.1", ordertxid: "kr-1", time: 1735689600 }])],
        ["LUNO", () => normalizeLuno([{ pair: "XBTZAR", state: "COMPLETE", type: "BID", limit_volume: "0.1", limit_price: "900000", fee_base: "0.001", order_id: "l-1", creation_timestamp: 1735689600000 }])],
        ["NEWTON", () => normalizeNewton([{ symbol: "BTC_CAD", side: "SELL", quantity: "0.1", price: "65000", fee: "1", id: "n-1", created_at: "2025-01-01T00:00:00Z" }])],
        ["COINSPOT", () => normalizeCoinSpot([{ coin: "BTC", market: "AUD", type: "buy", amount: "0.1", rate: "76000", fee: "1", id: "cs-1", solddate: "2025-01-01T00:00:00Z" }])],
        ["BYBIT", () => normalizeBybit([{ symbol: "BTCUSDT", side: "Sell", execQty: "0.1", execPrice: "51000", execFee: "0.5", feeCurrency: "USDT", execId: "bb-1", orderId: "bbo-1", execTime: 1735689600000 }])],
        ["CRYPTOCOM", () => normalizeCryptoCom([{ instrument_name: "BTC_USDT", side: "BUY", traded_quantity: "0.1", traded_price: "50000", fee: "1", fee_currency: "USDT", trade_id: "cc-1", order_id: "cco-1", create_time: 1735689600000 }])],
        ["GEMINI", () => normalizeGemini([{ symbol: "btcusd", type: "Buy", amount: "0.1", price: "50000", fee_amount: "1", fee_currency: "USD", tid: "g-1", order_id: "go-1", timestampms: 1735689600000 }])],
    ])("normalizes %s trades into the shared ledger shape", (exchange, normalize) => {
        const [trade] = normalize();
        expectSharedTradeShape(trade, exchange);
    });
});
