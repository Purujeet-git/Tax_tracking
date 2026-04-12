const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const dummySecret = "-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIHZl1WNd2bRNZJAOCGjLCMFQQ00qh3CvYxPTBgR8YxdioAoGCCqGSM49\nAwEHoUQDQgAEnP2gF6lhfENglybGqt/UGRhsfUljVJI1mbkOWlGC3BefFLbcUNm6\nbXSnVoK6KenzvfBgGahUd0H/WgCbJcylVQ==\n-----END EC PRIVATE KEY-----\n";

const apiKey = "organizations/5c749f37-d4c3-48b9-88c8-f4f20c74cef8/apiKeys/90483671-6351-4af1-a7ee-75dcf9255047";

const method = "GET";
const basePath = "/api/v3/brokerage/orders/historical/fills";
const isModernCDP = dummySecret.includes("BEGIN EC PRIVATE KEY");

if (isModernCDP) {
    const formattedKey = dummySecret.replace(/\\n/g, "\n");
    console.log("Formatted Key Structure:");
    console.log(formattedKey);

    const algorithm = "ES256";
    const uri = `${method} api.coinbase.com${basePath}`;

    try {
        const token = jwt.sign(
            {
                iss: "cdp",
                nbf: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 120, // 2 min expiration
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
        console.log("SUCCESS! JWT was formulated:");
        console.log(token);
    } catch(e) {
        console.error("JWT SIGN ERROR:", e);
    }
}
