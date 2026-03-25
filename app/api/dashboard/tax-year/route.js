import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getIndiaTaxYearSummary } from "@/lib/taxEngine/taxYearSummary";


export async function GET(){
    await connectDB();

    const session = await getServerSession(authOptions);

    if(!session){
        return NextResponse.json(
            {error:"Unauthorized"},
            {status:401}
        );
    }

    const summary = await getIndiaTaxYearSummary(session.user.id);

    return NextResponse.json({
        success:true,
        summary,
    });
}