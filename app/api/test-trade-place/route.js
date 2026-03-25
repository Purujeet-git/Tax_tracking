import { placeTestTrade } from "@/lib/exchanges/binance";

export async function GET() {
    const trade = await placeTestTrade({
        apiKey:process.env.API_Key,
        symbol:process.env.Secret_Key,
        symbol:"ETHBTC",
        side:"BUY",
        quantity:0.02
    });

    return Response.json(trade);
}   