import { fetchExchangeSymbolMap } from "@/lib/exchanges/binance";

export async function GET() {
    try {
        const map = await fetchExchangeSymbolMap();

        return Response.json({
            success: true,
            totalSymbols: Object.keys(map).length,
            sample: Object.entries(map).slice(0, 5),
        });
    } catch (err) {
        return Response.json({
            success: false,
            error: err.message,
        });
    }
}