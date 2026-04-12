import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://www.coinspot.com.au";

// CoinSpot uses HMAC SHA-512 authentication
function signCoinSpot(postData, secret) {
    return crypto
        .createHmac("sha512", secret)
        .update(postData)
        .digest("hex");
}

export async function discoverUserCoinSpotTrades({ apiKey, secret }) {
    let allTrades = [];

    try {
        // CoinSpot read-only trades history endpoint
        const path = "/api/v2/ro/my/orders/completed";
        const nonce = Date.now();
        const postData = JSON.stringify({ nonce });
        const sign = signCoinSpot(postData, secret);

        const res = await axios.post(`${BASE_URL}${path}`, postData, {
            headers: {
                "key": apiKey,
                "sign": sign,
                "Content-Type": "application/json"
            }
        });

        if (res.data?.status !== "ok") {
            throw new Error(`CoinSpot API Error: ${res.data?.message || "Unknown error"}`);
        }

        const orders = res.data?.buyorders || [];
        const sellOrders = res.data?.sellorders || [];

        // Tag each order with its type since CoinSpot separates them
        orders.forEach(o => o.__side = "BUY");
        sellOrders.forEach(o => o.__side = "SELL");

        allTrades.push(...orders, ...sellOrders);

    } catch (err) {
        const errorMsg = err?.response?.data?.message || err.message;
        console.error("CoinSpot Discovery Error:", err?.response?.data || err.message);
        throw new Error(`CoinSpot Sync Failed: ${errorMsg}`);
    }

    return { trades: allTrades };
}
