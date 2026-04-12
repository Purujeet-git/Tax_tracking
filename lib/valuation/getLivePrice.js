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

            // Convert Binance USD price to INR (approximate oracle rate)
            // since the dashboard calculates taxes in INR for India market
            const usdToInrRate = 84; 
            return Number(res.data.price) * usdToInrRate;
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