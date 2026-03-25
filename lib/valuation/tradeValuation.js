import { getHistoricalUsdPrice } from "./oracle/cryptoPriceOracle";
const STABLE_USD_QUOTES = ["USDT","USDC","BUSD","FDUSD"];

export async function valuateTradeUSD(trade) {
    console.log("Valuating Trade:",trade.symbol,trade.quoteAsset);
    try{
        if(STABLE_USD_QUOTES.includes(trade.quoteAsset)) {
            const unitFiatPrice = trade.price;
            const fiatValue = trade.quantity * trade.price;

            return {
                ...trade,
                unitFiatPrice,
                fiatValue,
                fiatCurrency:"USD",
                fxRateUsed:1,
                valuationSource:"STABLE_DIRECT",
            };
        }

        const quoteUsd = await getHistoricalUsdPrice(
            trade.quoteAsset,
            trade.timestamp
        );

        if(quoteUsd){
            const unitFiatPrice = trade.price * quoteUsd;
            const fiatValue = trade.quantity * unitFiatPrice;

            return {
                ...trade,
                unitFiatPrice,
                fiatValue,
                fiatCurrency:"USD",
                fxRateUsed:quoteUsd,
                valuationSource:"CRYPTO_CROSS",
            };
        }

        return {
            ...trade,
            valuationSource:"UNVALUED",
        };
    }catch(err){
        console.log("Valuation Error:",err.message);
        return trade;
    }
}