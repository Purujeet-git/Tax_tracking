import Transaction from "@/models/Transaction";
import { connectDB } from "@/lib/db";

export async function getUserTrades(userId){
    return await Transaction.find({userId}).sort({timestamp:1});
}