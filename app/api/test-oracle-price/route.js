import { getHistoricalUsdPrice } from "@/lib/valuation/oracle/cryptoPriceOracle";

export async function GET(){
    try{
        const price = await getHistoricalUsdPrice(
            "BTC",
            "2026-03-21T10:48:56.265Z"
        );

        return Response.json({
            success:true,
            price,
        });
    }catch(err){
        return Response.json({
            success:false,
            error:err.message,
        });
    }
}