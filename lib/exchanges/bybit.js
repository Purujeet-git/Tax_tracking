import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api.bybit.com";

function signBybit(queryString, secret, timestamp, apiKey, recvWindow) {
    const strToSign = timestamp + apiKey + recvWindow + queryString;
    return crypto
        .createHmac("sha256", secret)
        .update(strToSign)
        .digest("hex");
}

export async function discoverUserBybitTrades({ apiKey, secret }) {
    let allTrades = [];

    try {
        const timestamp = Date.now().toString();
        // Bybit V5 API endpoint for execution history
        const endpoint = "/v5/execution/list";
        const params = `category=spot&limit=50`;
        const recvWindow = "10000";

        const signature = signBybit(params, secret, timestamp, apiKey, recvWindow);

        const headers = {
            "X-BAPI-API-KEY": apiKey,
            "X-BAPI-SIGN": signature,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recvWindow,
            "Content-Type": "application/json"
        };

        const res = await axios.get(`${BASE_URL}${endpoint}?${params}`, { headers });

        if (res.data?.retCode !== 0) {
            throw new Error(`Bybit API Error: ${res.data?.retMsg || "Unknown error"}`);
        }

        const items = res.data.result?.list;

        if (items && items.length > 0) {
            allTrades.push(...items);
        }
    } catch (err) {
        console.error("Bybit Discovery Error:", err?.response?.data || err.message);
        throw new Error(`Bybit Sync Failed: ${err?.response?.data?.retMsg || err.message}`);
    }

    return { trades: allTrades };
}
