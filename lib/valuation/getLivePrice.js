import axios from "axios";

export async function getLivePrice(asset) {
    try{
        const symbol = `${asset}USDT`;

        const res = await axios.get(
            `https://api.binance.com/api/v3/ticker/price`,
            {
                params:{symbol}
            }
        );

        return Number(res.data.price);
    }catch(err){
        console.log("Live price fetch failed:",asset);
        console.log(err);
        return null;
    }
}