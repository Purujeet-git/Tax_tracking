import Transaction from "@/models/Transaction";
import { valuateTradeUSD } from "../valuation/tradeValuation";
export async function  insertTransactions({userId,trades}) {
    try{
        const docs = [];

        for(const t of trades){
            const valued = await valuateTradeUSD(t);
            docs.push({
                ...valued,
                userId,
            });
        }

        const res = await Transaction.insertMany(docs, {
            ordered:false,
        })

        return res.length
    }catch(err){
        if(err.writeErrors){
            return err.result?.nInserted || 0
        }
        throw err;
    }
}