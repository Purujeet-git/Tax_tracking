import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { getRealizedSummary } from "@/lib/taxEngine/analytics/getRealizedSummary";

export async function  GET() {
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json(
            {error:"Unauthorized"},
            {status:401}
        );
    }

    const summary = await getRealizedSummary(session.user.id);

    return NextResponse.json({
        success:true,
        summary
    });
}