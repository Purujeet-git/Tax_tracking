import axios from "axios";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const BASE_URL = "https://api.coinbase.com";

function getCoinbaseHeaders(method, requestPath, apiKey, secret) {
    // Determine Auth type. Modern Coinbase Advanced Trade uses EC private keys starting with -----BEGIN.
    const isModernCDP = secret.includes("BEGIN EC PRIVATE KEY");

    if (isModernCDP) {
        // Robust PEM key formatter: normalize ALL possible newline escape variants.
        // The key could arrive from the DB as:
        //   - literal backslash-n:  "-----BEGIN...\nMHc..."  (most common from UI paste)
        //   - double-escaped:       "-----BEGIN...\\nMHc..."
        //   - already real newlines: "-----BEGIN...\nMHc..."
        // We handle all cases by first replacing any literal "\n" text with a real newline.
        const formattedKey = secret
            .replace(/\\n/g, "\n")   // handles double-escaped \\n → real newline
            .replace(/\\n/g, "\n");  // second pass handles literal \n → real newline (idempotent-safe)

        // Validate the key looks structurally correct before signing
        if (!formattedKey.includes("-----BEGIN EC PRIVATE KEY-----") || !formattedKey.includes("-----END EC PRIVATE KEY-----")) {
            throw new Error("Malformed Coinbase EC Private Key. Ensure the full PEM block including headers is pasted correctly.");
        }

        const algorithm = "ES256";
        // Strip query params from URI — Coinbase CDP JWT must NOT include them
        const basePath = requestPath.split("?")[0];
        const uri = `${method} api.coinbase.com${basePath}`;

        const token = jwt.sign(
            {
                iss: "cdp",
                nbf: Math.floor(Date.now() / 1000) - 60, // 60s negative drift buffer
                exp: Math.floor(Date.now() / 1000) + 180, // 3 min expiry
                sub: apiKey,
                uri,
            },
            formattedKey,
            {
                algorithm,
                header: {
                    kid: apiKey,
                    nonce: crypto.randomBytes(16).toString("hex"),
                },
            }
        );

        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    } else {
        // Legacy HMAC Authentication Fallback
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const message = timestamp + method + requestPath + "";
        const signature = crypto.createHmac("sha256", secret).update(message).digest("hex");
        
        return {
            "CB-ACCESS-KEY": apiKey,
            "CB-ACCESS-SIGN": signature,
            "CB-ACCESS-TIMESTAMP": timestamp,
            "Content-Type": "application/json"
        };
    }
}

export async function discoverUserCoinbaseTrades({ apiKey, secret }) {
    let allTrades = [];
    
    try {
        const method = "GET";
        const requestPath = "/api/v3/brokerage/orders/historical/fills";
        
        let cursor = "";
        let hasNext = true;
        let loops = 0;

        while (hasNext && loops < 3) {
            loops++;
            
            let queryParams = "?limit=100";
            if (cursor) {
                queryParams += `&cursor=${cursor}`;
            }

            const activePath = requestPath + queryParams;
            
            // Fetch Universal Headers (Handling both JWT and HMAC natively)
            const headers = getCoinbaseHeaders(method, activePath, apiKey, secret);

            const res = await axios.get(`${BASE_URL}${activePath}`, { headers });
            
            if (res.data && res.data.fills) {
                allTrades.push(...res.data.fills);
            }

            cursor = res.data.cursor;
            hasNext = !!cursor;
            
            if (hasNext) {
                await new Promise(r => setTimeout(r, 250)); // Strict Rate-Limit
            }
        }
        
    } catch (err) {
        // Log the FULL Coinbase error response so we can see exactly what they say
        if (err?.response) {
            console.error("Coinbase HTTP Status:", err.response.status);
            console.error("Coinbase Error Body:", JSON.stringify(err.response.data, null, 2));
            console.error("Coinbase Error Headers:", JSON.stringify(err.response.headers, null, 2));
        } else {
            console.error("Coinbase Local Error:", err.message);
        }
        throw new Error(`Coinbase Sync Failed: ${err?.response?.data?.message || err?.response?.data?.error || err.message}`);
    }

    return {
        trades: allTrades
    };
}
