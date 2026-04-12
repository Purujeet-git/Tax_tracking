import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api.crypto.com/v2";

function signCryptoCom(method, endpoint, params, secret, apiKey, timestamp) {
    const paramString = params ? Object.keys(params).sort().map(k => `${k}${params[k]}`).join('') : "";
    const strToSign = method + endpoint + apiKey + paramString + timestamp;
    
    return crypto
        .createHmac("sha256", secret)
        .update(strToSign)
        .digest("hex");
}

export async function discoverCryptoComTrades({ apiKey, secret }) {
    let allTrades = [];

    try {
        const timestamp = Date.now().toString();
        const method = "private/get-trades";
        const endpoint = "/v2/private/get-trades";
        const params = {
            "api_key": apiKey,
            "id": 1,
            "method": method,
            "nonce": timestamp,
            "params": {}
        };

        const signature = signCryptoCom("POST", endpoint, params.params, secret, apiKey, timestamp);
        params.sig = signature;

        const res = await axios.post(`${BASE_URL}${endpoint}`, params);

        if (res.data?.code !== 0) {
            throw new Error(`Crypto.com API Error: ${res.data?.message || "Unknown error"}`);
        }

        const trades = res.data.result?.trade_list;

        if (trades && trades.length > 0) {
            allTrades.push(...trades);
        }
    } catch (err) {
        console.error("Crypto.com Discovery Error:", err?.response?.data || err.message);
        throw new Error(`Crypto.com Sync Failed: ${err?.response?.data?.message || err.message}`);
    }

    return { trades: allTrades };
}
