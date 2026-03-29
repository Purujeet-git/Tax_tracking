import { NextResponse } from "next/server";
import { getLossHarvsetingOpportunities } from "@/lib/taxEngine/intelligence/lossHarvesting";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";

export async function GET(){
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json(
            {error:"Unauthorized"},
            {status:401}
        );
    }

    const data = await getLossHarvsetingOpportunities(
        session.user.id
    )

    return NextResponse.json({
        success:true,
        opportunities: data
    })
}