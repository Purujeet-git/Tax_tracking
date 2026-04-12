import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api.coindcx.com";

function sign(payload, secret) {
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function fetchCoinDcxSymbolMap() {
    // CoinDCX public market details
    const res = await axios.get(`${BASE_URL}/exchange/v1/markets_details`);
    
    const map = {};
    for (const m of res.data) {
        // e.g. symbol: "B-BTC_INR", base_currency_short_name: "BTC", target_currency_short_name: "INR"
        map[m.symbol] = {
            baseAsset: m.base_currency_short_name,
            quoteAsset: m.target_currency_short_name,
            status: m.status
        };
    }
    return map;
}

export async function fetchCoinDcxTrades({ apiKey, secret, limit = 500, offset = 0 }) {
    const timestamp = Date.now();
    
    const body = {
        timestamp,
        limit,
        offset
    };

    const payload = Buffer.from(JSON.stringify(body)).toString();
    const signature = sign(payload, secret);

    const url = `${BASE_URL}/exchange/v1/orders/closed`;

    const res = await axios.post(url, body, {
        headers: {
            "X-AUTH-APIKEY": apiKey,
            "X-AUTH-SIGNATURE": signature,
            "Content-Type": "application/json" // required by CoinDCX
        }
    });

    return res.data; // Array of historical orders/trades
}

export async function discoverUserCoinDcxTrades({ apiKey, secret }) {
    // CoinDCX returns a paginated list of all closed orders. 
    // We will pull the latest 500 for MVP since there's no symbol requirement.
    let allTrades = [];
    
    try {
        const trades = await fetchCoinDcxTrades({ apiKey, secret, limit: 500, offset: 0 });
        if (trades && Array.isArray(trades)) {
            allTrades = trades;
        }
    } catch (err) {
        console.error("CoinDCX Discovery Error:", err?.response?.data || err.message);
        throw new Error("Failed to fetch CoinDCX Historical Trades. Check API Keys.");
    }

    return {
        trades: allTrades
    };
}
