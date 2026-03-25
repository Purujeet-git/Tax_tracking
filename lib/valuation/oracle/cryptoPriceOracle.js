import axios from "axios";

const BASE_URL = "https://api.binance.com";

export async function getHistoricalUsdPrice(asset,timestamp){
    try{
        const symbol = `${asset}USDT`;

        const endTime = new Date(timestamp).getTime();
        const startTime = endTime - 60 * 1000;

        const url = `${BASE_URL}/api/v3/klines`;

        const res = await axios.get(url,{
            params:{
                symbol,
                interval:"1m",
                startTime,
                endTime,
                limit:1,
            },
        });

        if(!res.data || res.data.length === 0){
            console.log("No kline price for",symbol);
            return null;
        }

        const candle = res.data[0];

        const closePrice = Number(candle[4]);

        return closePrice;
    }catch(err){
        console.log("Oracle price error:",asset,err.message);
        return null;
    }
}