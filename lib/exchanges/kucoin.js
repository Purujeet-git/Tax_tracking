import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api.kucoin.com";

function signKuCoin(method, endpoint, bodyString, secret, passphrase) {
    const timestamp = Date.now().toString();
    const strToSign = timestamp + method.toUpperCase() + endpoint + bodyString;
    
    const signature = crypto
        .createHmac("sha256", secret)
        .update(strToSign)
        .digest("base64");

    // Passphrase also needs to be signed with the secret
    const signedPassphrase = crypto
        .createHmac("sha256", secret)
        .update(passphrase)
        .digest("base64");

    return {
        "KC-API-KEY": null, // Set in caller
        "KC-API-SIGN": signature,
        "KC-API-TIMESTAMP": timestamp,
        "KC-API-PASSPHRASE": signedPassphrase,
        "KC-API-KEY-VERSION": "2", // Version 2 uses signed passphrases
        "Content-Type": "application/json"
    };
}

export async function discoverUserKucoinTrades({ apiKey, secret, passphrase }) {
    if (!passphrase) {
        throw new Error("KuCoin requires an API Passphrase. Please reconnect and provide your passphrase.");
    }

    let allTrades = [];

    try {
        const method = "GET";
        let pageNumber = 1;
        let hasMore = true;

        // KuCoin paginates with page numbers, cap at 10 pages (500 trades max) for MVP
        while (hasMore && pageNumber <= 10) {
            const endpoint = `/api/v1/fills?pageSize=50&currentPage=${pageNumber}&tradeType=TRADE`;

            const headers = signKuCoin(method, endpoint, "", secret, passphrase);
            headers["KC-API-KEY"] = apiKey;

            const res = await axios.get(`${BASE_URL}${endpoint}`, { headers });

            if (res.data?.code !== "200000") {
                throw new Error(`KuCoin API Error: ${res.data?.msg || "Unknown error"}`);
            }

            const { items, totalPage } = res.data.data;

            if (items && items.length > 0) {
                allTrades.push(...items);
            }

            if (pageNumber >= totalPage || (items && items.length < 50)) {
                hasMore = false;
            } else {
                pageNumber++;
                await new Promise(r => setTimeout(r, 300)); // Rate-limit buffer
            }
        }
    } catch (err) {
        console.error("KuCoin Discovery Error:", err?.response?.data || err.message);
        throw new Error(`KuCoin Sync Failed: ${err?.response?.data?.msg || err.message}`);
    }

    return { trades: allTrades };
}
