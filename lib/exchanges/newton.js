import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api.newton.co";

// Newton uses HMAC SHA-256 authentication
function signNewton(method, path, body, apiKey, secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyStr = body ? JSON.stringify(body) : "";
    const contentHash = crypto.createHash("sha256").update(bodyStr).digest("hex");

    // Newton signature format: timestamp:method:path:contentHash
    const message = `${timestamp}:${method.toUpperCase()}:${path}:${contentHash}`;
    const signature = crypto.createHmac("sha256", secret).update(message).digest("hex");

    return {
        "Newton-API-Key": apiKey,
        "Newton-Signature": signature,
        "Newton-Timestamp": timestamp,
        "Content-Type": "application/json"
    };
}

export async function discoverUserNewtonTrades({ apiKey, secret }) {
    let allTrades = [];

    try {
        const method = "GET";
        let offset = 0;
        let hasMore = true;

        while (hasMore && offset < 2000) {
            const path = `/v1/order/history?limit=100&offset=${offset}&open=false`;
            const headers = signNewton(method, path, null, apiKey, secret);

            const res = await axios.get(`${BASE_URL}${path}`, { headers });

            const orders = res.data?.orders || res.data?.results || [];

            if (orders.length === 0) {
                hasMore = false;
                break;
            }

            allTrades.push(...orders);
            offset += orders.length;

            if (orders.length < 100) {
                hasMore = false;
            } else {
                await new Promise(r => setTimeout(r, 300));
            }
        }
    } catch (err) {
        const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err.message;
        console.error("Newton Discovery Error:", err?.response?.data || err.message);
        throw new Error(`Newton Sync Failed: ${errorMsg}`);
    }

    return { trades: allTrades };
}
