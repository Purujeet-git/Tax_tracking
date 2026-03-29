import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { buildHarvestPlan } from "@/lib/taxEngine/intelligence/harvestPlan";

export async function GET(){
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json(
            { error : "Unauthorized" },
            { status : 401 }
        );
    }

    const data = await buildHarvestPlan(session.user.id);

    return NextResponse.json({
        success:true,
        plan:data
    });
}