import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Disposal from "@/models/Disposal";

import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";

export async function  GET(req) {
    try{
        await connectDB();
        const session= await getServerSession(authOptions);
        if(!session){
            return NextResponse.json(
                {error:"Unauthorized"},
                {status:401}
            );
        }

        const { searchParams } = new URL(req.url);
        const country = searchParams.get("country") || "INDIA";
        const year = Number(searchParams.get("year")) || new Date().getFullYear();
        const { start, end } = getTaxYearRange({ country, year });

        const userId = session.user.id;
        const disposals = await Disposal.find({
            userId,
            disposedAt: {
                $gte: start,
                $lte: end
            }
        })
            .sort({disposedAt:-1});

        const summary = disposals.reduce(
            (acc,d) => {
                acc.totalGain += d.gainLoss || 0;
                acc.disposalCount += 1;

                if(d.taxCategory === "SHORT_TERM"){
                    acc.shortTermGain += d.gainLoss || 0;
                }

                if(d.taxCategory === "LONG_TERM"){
                    acc.longTermGain += d.gainLoss || 0;
                }

                if(
                    ["POOL","SECTION_104","SAME_DAY","BED_AND_BREAKFAST"].includes(
                        d.taxCategory
                    )
                ){
                    acc.specialGain += d.gainLoss ||0;
                }

                return acc;
            },
            {
                totalGain:0,
                shortTermGain:0,
                longTermGain:0,
                specialGain:0,
                disposalCount:0
            }
        );

        return NextResponse.json({
            success:true,
            summary,
            disposals
        });
    }catch(error){
        console.error("DISPOSALS API ERROR:",error);

        return NextResponse.json(
            {error:"Failed to fetch disposals."},
            {status:500}
        );
    }
}