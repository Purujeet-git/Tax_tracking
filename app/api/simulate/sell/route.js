import { NextResponse } from "next/server";
import { simulateSell } from "@/lib/taxEngine/simulator/simulateSell";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";

export async function POST(req) {
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json({error:"Unauthorized"},{status:401});
    }

    const { asset, quantity, strategy} = await req.json();

    const result = await simulateSell({
        userId:session.user.id,
        asset,
        quantity,
        strategy
    });

    return NextResponse.json({
        success:true,
        simulation:result
    });
}