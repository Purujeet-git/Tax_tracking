import { discoverUserBinanceTrades, fetchExchangeSymbolMap as fetchBinanceSymbols } from "./binance";
import { discoverUserCoinDcxTrades, fetchCoinDcxSymbolMap } from "./coindcx";
import { discoverUserWazirxTrades, fetchWazirxSymbolMap } from "./wazirx";
import { discoverUserCoinbaseTrades } from "./coinbase";
import { discoverUserKucoinTrades } from "./kucoin";
import { discoverUserKrakenTrades } from "./kraken";
import { discoverUserLunoTrades } from "./luno";
import { discoverUserNewtonTrades } from "./newton";
import { discoverUserCoinSpotTrades } from "./coinspot";
import { discoverUserBybitTrades } from "./bybit";
import { discoverCryptoComTrades } from "./cryptocom";
import { discoverGeminiTrades } from "./gemini";

// Normalizers
import { normalizeTrades as normalizeBinance } from "../normalizers/binanceNormalizer";
import { normalizeTrades as normalizeCoinDcx } from "../normalizers/coindcxNormalizer";
import { normalizeTrades as normalizeWazirx } from "../normalizers/wazirxNormalizer";
import { normalizeTrades as normalizeCoinbase } from "../normalizers/coinbaseNormalizer";
import { normalizeTrades as normalizeKucoin } from "../normalizers/kucoinNormalizer";
import { normalizeTrades as normalizeKraken } from "../normalizers/krakenNormalizer";
import { normalizeTrades as normalizeLuno } from "../normalizers/lunoNormalizer";
import { normalizeTrades as normalizeNewton } from "../normalizers/newtonNormalizer";
import { normalizeTrades as normalizeCoinSpot } from "../normalizers/coinspotNormalizer";
import { normalizeTrades as normalizeBybit } from "../normalizers/bybitNormalizer";
import { normalizeTrades as normalizeCryptoCom } from "../normalizers/cryptocomNormalizer";
import { normalizeTrades as normalizeGemini } from "../normalizers/geminiNormalizer";

export class ExchangeFactory {
    static async sync(exchangeName, credentials) {
        switch (exchangeName.toUpperCase()) {
            case "BINANCE": {
                const raw = await discoverUserBinanceTrades(credentials);
                const map = await fetchBinanceSymbols();
                return normalizeBinance(raw.trades, map);
            }
            case "COINDCX": {
                const raw = await discoverUserCoinDcxTrades(credentials);
                const map = await fetchCoinDcxSymbolMap();
                return normalizeCoinDcx(raw.trades, map);
            }
            case "WAZIRX": {
                const raw = await discoverUserWazirxTrades(credentials);
                const map = await fetchWazirxSymbolMap();
                return normalizeWazirx(raw.trades, map);
            }
            case "COINBASE": {
                const raw = await discoverUserCoinbaseTrades(credentials);
                return normalizeCoinbase(raw.trades);
            }
            case "KUCOIN": {
                // credentials.passphrase is forwarded from the sync route
                const raw = await discoverUserKucoinTrades(credentials);
                return normalizeKucoin(raw.trades);
            }
            case "KRAKEN": {
                const raw = await discoverUserKrakenTrades(credentials);
                return normalizeKraken(raw.trades);
            }
            case "LUNO": {
                const raw = await discoverUserLunoTrades(credentials);
                return normalizeLuno(raw.trades);
            }
            case "NEWTON": {
                const raw = await discoverUserNewtonTrades(credentials);
                return normalizeNewton(raw.trades);
            }
            case "COINSPOT": {
                const raw = await discoverUserCoinSpotTrades(credentials);
                return normalizeCoinSpot(raw.trades);
            }
            case "BYBIT": {
                const raw = await discoverUserBybitTrades(credentials);
                return normalizeBybit(raw.trades);
            }
            case "CRYPTOCOM": {
                const raw = await discoverCryptoComTrades(credentials);
                return normalizeCryptoCom(raw.trades);
            }
            case "GEMINI": {
                const raw = await discoverGeminiTrades(credentials);
                return normalizeGemini(raw.trades);
            }
            default:
                throw new Error(`Exchange integration for ${exchangeName} is not implemented.`);
        }
    }
}
