import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { recomputeLedger } from "@/lib/taxEngine/recomputeLedger";
import { NextResponse } from "next/server";
export async function GET() {
   await connectDB();
    const session = await getServerSession(authOptions);

   const userId = session.user.id;

   const result = await recomputeLedger({
      userId,
      strategy: "FIFO"
   });

   return NextResponse.json(result);
}