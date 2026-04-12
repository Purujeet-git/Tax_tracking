// Kraken uses unusual asset name prefixes (X for crypto, Z for fiat)
// e.g. XXBT = BTC, XETH = ETH, ZUSD = USD, ZEUR = EUR
function normalizeKrakenAsset(asset) {
    if (!asset) return "UNKNOWN";
    // Strip leading X or Z for 4-char assets
    if (asset.length === 4 && (asset.startsWith("X") || asset.startsWith("Z"))) {
        const stripped = asset.slice(1);
        if (stripped === "XBT") return "BTC"; // Kraken calls Bitcoin "XBT"
        return stripped;
    }
    if (asset === "XBT") return "BTC";
    return asset;
}

export function normalizeTrades(rawTrades) {
    if (!Array.isArray(rawTrades)) return [];

    return rawTrades.map(trade => {
        // Kraken pair format: "XXBTZUSD" or "XETHZEUR"
        // We use our asset normalizer to strip X/Z prefixes and map XBT→BTC
        const pair = String(trade.pair || "");

        // Kraken pairs are 6-8 chars. First half is base, second half is quote.
        // Split roughly in the middle and normalize each part.
        let baseAsset = "UNKNOWN";
        let quoteAsset = "UNKNOWN";

        // Common pair lengths: XXBTZUSD (8), XETHZEUR (8), ADAUSD (6)
        if (pair.length >= 6) {
            const mid = Math.ceil(pair.length / 2);
            const rawBase = pair.slice(0, mid);
            const rawQuote = pair.slice(mid);
            baseAsset = normalizeKrakenAsset(rawBase);
            quoteAsset = normalizeKrakenAsset(rawQuote);
        }

        // Kraken type: "buy" or "sell"
        const side = String(trade.type || "").toUpperCase();

        const quantity = Number(trade.vol);
        const price = Number(trade.price);
        const feeAmount = Number(trade.fee || 0);

        return {
            exchange: "KRAKEN",
            symbol: `${baseAsset}${quoteAsset}`,
            baseAsset,
            quoteAsset,
            side,
            quantity,
            price,
            feeAmount,
            feeAsset: quoteAsset,
            tradeId: String(trade.txid || trade.ordertxid || ""),
            orderId: String(trade.ordertxid || ""),
            timestamp: new Date(Number(trade.time) * 1000), // Kraken gives Unix seconds
            raw: trade
        };
    }).filter(t => t.side && t.quantity > 0);
}
