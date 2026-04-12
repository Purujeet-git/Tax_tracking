import axios from "axios";

const BASE_URL = "https://api.luno.com";

export async function discoverUserLunoTrades({ apiKey, secret }) {
    // Luno uses the simplest auth model: HTTP Basic Auth
    // Username = API Key ID, Password = API Secret
    const auth = {
        username: apiKey,
        password: secret
    };

    let allOrders = [];

    try {
        let beforeId = null;
        let hasMore = true;
        let loops = 0;

        // Luno paginates backwards using `before` cursor (order ID), cap at 10 pages
        while (hasMore && loops < 10) {
            loops++;

            const params = { state: "COMPLETE", limit: 100 };
            if (beforeId) params.before = beforeId;

            const res = await axios.get(`${BASE_URL}/api/exchange/2/listorders`, {
                auth,
                params
            });

            const orders = res.data?.orders || [];

            if (orders.length === 0) {
                hasMore = false;
                break;
            }

            allOrders.push(...orders);

            if (orders.length < 100) {
                // Fewer than max returned = we've reached the end
                hasMore = false;
            } else {
                // Use the oldest order's ID as the cursor for the next page
                beforeId = orders[orders.length - 1].order_id;
                await new Promise(r => setTimeout(r, 250)); // Rate-limit buffer
            }
        }

    } catch (err) {
        const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err.message;
        console.error("Luno Discovery Error:", err?.response?.data || err.message);
        throw new Error(`Luno Sync Failed: ${errorMsg}`);
    }

    return { trades: allOrders };
}
