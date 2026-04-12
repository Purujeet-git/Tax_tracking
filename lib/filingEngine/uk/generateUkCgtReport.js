import Disposal from "@/models/Disposal";
import mongoose from "mongoose";

/**
 * UK HMRC Capital Gains Tax Report — CGT Event Summary
 *
 * Matching priority per HMRC rules (already applied by ukStrategy.js):
 *   1) Same-day rule (taxCategory === "SAME_DAY")
 *   2) Bed & Breakfast rule — 30 days (taxCategory === "BED_AND_BREAKFAST")
 *   3) Section 104 pool (taxCategory === "SECTION_104")
 *
 * CGT rates (2024-25):
 *   Basic rate taxpayer:  10% on crypto gains
 *   Higher rate taxpayer: 20% on crypto gains
 *   Annual CGT exempt amount: £3,000 (2024-25 onwards, reduced from £6,000)
 */

export const UK_CGT_ANNUAL_EXEMPT = 3000; // £3,000 for 2024-25
export const UK_CGT_RATE_BASIC    = 0.10;
export const UK_CGT_RATE_HIGHER   = 0.20;

export async function generateUkCgtReport({
    userId,
    financialYearStart,
    financialYearEnd,
    outputFormat = "json",
}) {
    const disposals = await Disposal.find({
        userId: new mongoose.Types.ObjectId(userId),
        disposedAt: {
            $gte: financialYearStart,
            $lte: financialYearEnd,
        },
        strategyUsed: "UK",
    }).sort({ disposedAt: 1 });

    const rows = [];
    let totalProceeds = 0;
    let totalAllowableCost = 0;
    let totalGain = 0;
    let sameDay = 0, bedAndBreakfast = 0, section104 = 0;

    for (const d of disposals) {
        const proceeds = Number(d.proceeds || 0);
        const cost     = Number(d.totalCost || 0);
        const gain     = Number(d.gainLoss || 0);

        totalProceeds      += proceeds;
        totalAllowableCost += cost;
        totalGain          += gain;

        if (d.taxCategory === "SAME_DAY")          sameDay++;
        else if (d.taxCategory === "BED_AND_BREAKFAST") bedAndBreakfast++;
        else                                            section104++;

        rows.push({
            "Asset":            d.asset,
            "Date Disposed":    new Date(d.disposedAt).toISOString().split("T")[0],
            "Date Acquired":    new Date(d.acquiredAt).toISOString().split("T")[0],
            "Matching Rule":    d.taxCategory || "SECTION_104",
            "Qty Disposed":     Number(d.quantitySold).toFixed(8),
            "Proceeds (£)":     proceeds.toFixed(2),
            "Allowable Cost (£)": cost.toFixed(2),
            "Gain/(Loss) (£)":  gain.toFixed(2),
        });
    }

    // Net CGT gain/loss
    const netGain                 = totalGain;
    const gainAfterExemption      = Math.max(0, netGain - UK_CGT_ANNUAL_EXEMPT);
    const estTaxBasicRate         = (gainAfterExemption * UK_CGT_RATE_BASIC).toFixed(2);
    const estTaxHigherRate        = (gainAfterExemption * UK_CGT_RATE_HIGHER).toFixed(2);

    const summary = {
        totalProceeds:       totalProceeds.toFixed(2),
        totalAllowableCost:  totalAllowableCost.toFixed(2),
        netGain:             netGain.toFixed(2),
        annualExemptAmount:  UK_CGT_ANNUAL_EXEMPT.toFixed(2),
        gainAfterExemption:  gainAfterExemption.toFixed(2),
        estTaxBasicRate,
        estTaxHigherRate,
        matchingBreakdown: { sameDay, bedAndBreakfast, section104 },
    };

    if (outputFormat === "csv") {
        const header = Object.keys(rows[0] ?? {
            "Asset": "", "Date Disposed": "", "Date Acquired": "",
            "Matching Rule": "", "Qty Disposed": "", "Proceeds (£)": "",
            "Allowable Cost (£)": "", "Gain/(Loss) (£)": "",
        });
        const csvLines = [header.join(",")];
        for (const r of rows) {
            csvLines.push(header.map(h => {
                const v = String(r[h] ?? "");
                return v.includes(",") ? `"${v}"` : v;
            }).join(","));
        }
        return csvLines.join("\n");
    }

    return { rows, summary };
}
