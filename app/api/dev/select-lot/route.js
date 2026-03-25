import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SellLotSelection from "@/models/SellLotSelection";

export async function POST(req) {
    await connectDB();

    const body = await req.json();

    const {userId,sellTransactionId,lotId,quantity} = body;

    if(!userId || !sellTransactionId || !lotId || !quantity){
        return NextResponse.json(
            { error: "Missing fields"},
            { status: 400 }
        );
    }

    
    console.log("DB NAME:", SellLotSelection.db.name);

    const doc = await SellLotSelection.create({
        userId,
        sellTransactionId,
        lotId,
        quantity
    });

    console.log("DB NAME:", SellLotSelection.db.name);

    return NextResponse.json({
        success:true,
        selection:doc
    });
}