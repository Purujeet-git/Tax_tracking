import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api.gemini.com/v1";

function signGemini(endpoint, payload, secret) {
    const payloadBuffer = Buffer.from(JSON.stringify(payload));
    const b64 = payloadBuffer.toString("base64");
    const signature = crypto
        .createHmac("sha384", secret)
        .update(b64)
        .digest("hex");
    
    return {
        "X-GEMINI-APIKEY": null, // Set in caller
        "X-GEMINI-PAYLOAD": b64,
        "X-GEMINI-SIGNATURE": signature,
        "Content-Type": "text/plain",
        "Content-Length": "0"
    };
}

export async function discoverGeminiTrades({ apiKey, secret }) {
    let allTrades = [];

    try {
        const endpoint = "/mytrades";
        const payload = {
            request: endpoint,
            nonce: Date.now(),
            limit_trades: 50
        };

        const headers = signGemini(endpoint, payload, secret);
        headers["X-GEMINI-APIKEY"] = apiKey;

        const res = await axios.post(`${BASE_URL}${endpoint}`, {}, { headers });

        if (res.data?.errorCode) {
            throw new Error(`Gemini API Error: ${res.data?.message || "Unknown error"}`);
        }

        const trades = res.data;

        if (trades && trades.length > 0) {
            allTrades.push(...trades);
        }
    } catch (err) {
        console.error("Gemini Discovery Error:", err?.response?.data || err.message);
        throw new Error(`Gemini Sync Failed: ${err?.response?.data?.message || err.message}`);
    }

    return { trades: allTrades };
}
