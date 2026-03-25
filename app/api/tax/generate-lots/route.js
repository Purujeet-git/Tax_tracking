import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { generateLotsForUser } from "@/lib/taxEngine/generateLots";

export async function POST(){
    await connectDB();

    const session = await getServerSession(authOptions);
    if(!session){
        return NextResponse.json({error:"Unauthorized"},{status:401});
    }

    const count = await generateLotsForUser(session.user.id);

    return NextResponse.json({
        success:true,
        disposalsCreated:count,
    });
}