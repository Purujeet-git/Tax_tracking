import axios from "axios";

export async function getLivePrice(asset, exchange = "binance") {
    try {
        // 🪙 Crypto from Binance
        if (exchange === "binance") {
            const symbol = `${asset}USDT`;

            const res = await axios.get(
                "https://api.binance.com/api/v3/ticker/price",
                {
                    params: { symbol },
                }
            );

            return Number(res.data.price);
        }

        // 📈 Indian stocks from Zerodha CSV (mock provider)
        if (exchange === "zerodha") {
            const stockPrices = {
                TCS: 4100,
                INFY: 1650,
                RELIANCE: 2950,
            };

            return stockPrices[asset] ?? null;
        }

        return null;
    } catch (error) {
        console.error(
            `Live price fetch failed: ${asset} (${exchange})`,
            error.response?.data || error.message
        );

        return null;
    }
}