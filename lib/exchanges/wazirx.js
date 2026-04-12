import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api.wazirx.com/sapi/v1";

function sign(query, secret) {
    return crypto.createHmac("sha256", secret).update(query).digest("hex");
}

export async function fetchWazirxSymbolMap() {
    try {
        const res = await axios.get("https://api.wazirx.com/sapi/v1/exchangeInfo");
        const map = {};
        for (const s of res.data.symbols) {
            map[s.symbol] = {
                baseAsset: s.baseAsset,
                quoteAsset: s.quoteAsset,
                status: s.status
            };
        }
        return map;
    } catch (e) {
        console.error("WazirX Exchange Info Error:", e.message);
        return {};
    }
}

export async function discoverUserWazirxTrades({ apiKey, secret }) {
    let allTrades = [];
    
    // WazirX v1 historically didn't absolutely mandate symbol for some older private endpoints,
    // but the sapi/v1/historicalTrades DOES. Standard API practice for /sapi/v1/historicalTrades 
    // requires checking the top pairings.
    
    const TOP_SYMBOLS = [
        "btcinr", "ethinr", "usdtinr", "wrxinr", "trxinr", "maticinr", "shibinr",
        "solinr", "adainr", "xrpinr", "dotinr", "dogeinr", "trxusdt", "ethusdt", "btcusdt"
    ];

    for (const symbol of TOP_SYMBOLS) {
        try {
            const timestamp = Date.now();
            // WazirX uses myTrades exactly like Binance for secured fetching
            const query = `symbol=${symbol}&timestamp=${timestamp}`;
            const signature = sign(query, secret);

            const url = `${BASE_URL}/myTrades?${query}&signature=${signature}`;

            const res = await axios.get(url, {
                headers: {
                    "X-Api-Key": apiKey
                }
            });

            if (res.data && res.data.length > 0) {
                // WazirX trades don't include the symbol explicitly in the item payload, so we inject it
                const labeledTrades = res.data.map(t => ({ ...t, symbol }));
                allTrades.push(...labeledTrades);
            }
            
            // WazirX has strict ratelimits 
            await new Promise((r) => setTimeout(r, 600));

        } catch (err) {
            // Ignoring 400s or 404s for symbol pairs that the user has no history on
        }
    }

    return { trades: allTrades };
}
