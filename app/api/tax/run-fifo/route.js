import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { runFifoFullRecompute } from "@/lib/taxEngine/runFifoRecompute";

export async function  POST() {
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json(
            {error:"Unauthorized"},
            {status:401}
        );
    }

    const count = await runFifoFullRecompute(session.user.id);

    return NextResponse.json({
        success:true,
        disposalCreated:count,
    });
}