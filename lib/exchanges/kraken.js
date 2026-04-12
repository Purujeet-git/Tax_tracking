import axios from "axios";
import crypto from "crypto";
import qs from "querystring";

const BASE_URL = "https://api.kraken.com";

function signKraken(path, postData, secret) {
    const nonce = Date.now().toString();
    const message = postData + nonce + postData;

    // Kraken uses a 2-layer signing: SHA-256 then HMAC-SHA-512
    const secretBuffer = Buffer.from(secret, "base64");
    const hash = crypto.createHash("sha256").update(nonce + postData).digest();
    const hmacPayload = Buffer.concat([Buffer.from(path), hash]);

    const signature = crypto
        .createHmac("sha512", secretBuffer)
        .update(hmacPayload)
        .digest("base64");

    return { signature, nonce };
}

// Kraken uses unusual asset name prefixes (X for crypto, Z for fiat)
// e.g. XXBT = BTC, XETH = ETH, ZUSD = USD, ZEUR = EUR
function normalizeKrakenAsset(asset) {
    if (!asset) return "UNKNOWN";
    // Strip leading X or Z for 4-char assets
    if (asset.length === 4 && (asset.startsWith("X") || asset.startsWith("Z"))) {
        const stripped = asset.slice(1);
        // Special case: XBT → BTC (Kraken calls Bitcoin "XBT")
        if (stripped === "XBT") return "BTC";
        return stripped;
    }
    if (asset === "XBT") return "BTC";
    return asset;
}

export async function discoverUserKrakenTrades({ apiKey, secret }) {
    const allTrades = [];

    try {
        const path = "/0/private/TradesHistory";
        let offset = 0;
        let hasMore = true;

        // Cap at 5 pages (2500 trades max) for MVP
        while (hasMore && offset < 2500) {
            const postData = qs.stringify({
                nonce: Date.now().toString(),
                ofs: offset,
            });

            const { signature, nonce } = signKraken(path, postData, secret);

            const res = await axios.post(`${BASE_URL}${path}`, postData, {
                headers: {
                    "API-Key": apiKey,
                    "API-Sign": signature,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            if (res.data.error && res.data.error.length > 0) {
                throw new Error(`Kraken API Error: ${res.data.error.join(", ")}`);
            }

            const trades = res.data.result?.trades;
            if (!trades || Object.keys(trades).length === 0) {
                hasMore = false;
                break;
            }

            allTrades.push(...Object.entries(trades).map(([txid, t]) => ({ ...t, txid })));

            const count = res.data.result?.count;
            offset += Object.keys(trades).length;

            if (offset >= count) {
                hasMore = false;
            } else {
                await new Promise(r => setTimeout(r, 350)); // Rate-limit buffer
            }
        }
    } catch (err) {
        console.error("Kraken Discovery Error:", err?.response?.data || err.message);
        throw new Error(`Kraken Sync Failed: ${err?.response?.data?.error || err.message}`);
    }

    return { trades: allTrades, normalizeAsset: normalizeKrakenAsset };
}

export { normalizeKrakenAsset };
