import Trade from "@/models/Trade";

export async function getUserTrades(userId){
    return await Trade.find({userId}).sort({data:1});
}