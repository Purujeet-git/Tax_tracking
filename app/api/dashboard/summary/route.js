import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getDashboardSummary } from "@/lib/taxEngine/dashboardEngine";

export async function GET(){
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json(
            {error:"Unauthorized!"},
            {status:401}
        );
    }

    const data = await getDashboardSummary(session.user.id);

    return NextResponse.json({
        success:true,
        dashboard:data,
    });
}