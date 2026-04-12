import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Disposal from "@/models/Disposal";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";

const COUNTRY_STRATEGY_MAP = {
    INDIA: "FIFO",
    USA: "HIFO",
    CANADA: "ACB",
    UK: "UK",
    AUSTRALIA: "FIFO",
};

export async function GET(req) {
    try {
        await connectDB();

        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);

        const country =
            searchParams.get("country") || "INDIA";

        const year =
            Number(searchParams.get("year")) ||
            new Date().getFullYear();

        const { start, end, label } =
            getTaxYearRange({
                country,
                year
            });

        const userId = session.user.id;

        const disposals = await Disposal.find({
            userId,
            disposedAt: {
                $gte: start,
                $lte: end
            }
        });

        let realizedGain = 0;
        let shortTermGain = 0;
        let longTermGain = 0;
        let specialGain = 0;
        let taxableGainVDA = 0; // India Section 115BBH: only gains, losses cannot offset
        let totalProceeds = 0;
        let totalCost = 0;

        for (const d of disposals) {
            const gain = d.gainLoss || 0;

            realizedGain += gain;
            totalProceeds += (d.proceeds || 0);
            totalCost += (d.totalCost || 0);

            // India: losses from one VDA cannot offset another
            if (country === "INDIA") {
                taxableGainVDA += Math.max(0, gain);
            }

            if (d.taxCategory === "SHORT_TERM") {
                shortTermGain += gain;
            } else if (d.taxCategory === "LONG_TERM") {
                longTermGain += gain;
            } else {
                specialGain += gain;
            }
        }

        const taxBase = country === "INDIA" ? taxableGainVDA : Math.max(realizedGain, 0);
        const estimatedTax = taxBase * 0.3;

        return NextResponse.json({
            success: true,
            summary: {
                country,
                taxYear: label,
                strategy: COUNTRY_STRATEGY_MAP[country] || "FIFO",
                realizedGain: Number(realizedGain.toFixed(2)),
                taxableIncomeVDA: country === "INDIA" ? Number(taxableGainVDA.toFixed(2)) : null,
                totalProceeds: Number(totalProceeds.toFixed(2)),
                totalCost: Number(totalCost.toFixed(2)),
                shortTermGain: Number(shortTermGain.toFixed(2)),
                longTermGain: Number(longTermGain.toFixed(2)),
                specialGain: Number(specialGain.toFixed(2)),
                estimatedTax: Number(estimatedTax.toFixed(2)),
                disposalCount: disposals.length
            }
        });
    } catch (error) {
        console.error(
            "DASHBOARD TAX YEAR ERROR:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to fetch tax year summary"
            },
            { status: 500 }
        );
    }
}