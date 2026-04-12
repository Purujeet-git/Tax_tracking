import Disposal from "@/models/Disposal";
import mongoose from "mongoose";

/**
 * Canada T5008-Style Capital Gains Report — CRA Schedule 3
 *
 * Rules:
 *   • Strategy: Adjusted Cost Base (ACB) — average cost pool
 *   • Tax year: Calendar year (Jan 1 – Dec 31)
 *   • Capital gains inclusion rate:
 *       - Pre-June 25, 2024:  50% of gain is taxable ("Taxable Capital Gain")
 *       - From June 25, 2024: 2/3 (66.67%) of gain is taxable
 *     (Budget 2024 amendment — sort disposals by date and split accordingly)
 *   • Capital losses: Only 50% of capital losses deductible against capital gains
 *     (matched to the inclusion rate of the gains)
 */

const INCLUSION_CUTOFF = new Date("2024-06-25T00:00:00Z");
const INCLUSION_PRE    = 0.50;
const INCLUSION_POST   = 2 / 3;

function getInclusionRate(disposedAt) {
    return new Date(disposedAt) >= INCLUSION_CUTOFF ? INCLUSION_POST : INCLUSION_PRE;
}

export async function generateCanadaT5008Report({
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
    }).sort({ disposedAt: 1 });

    const rows = [];
    let totalProceeds        = 0;
    let totalAcb             = 0;
    let totalGainLoss        = 0;
    let totalTaxableGain     = 0;
    let preJune25Gains       = 0;
    let postJune25Gains      = 0;

    for (const d of disposals) {
        const proceeds  = Number(d.proceeds || 0);
        const acb       = Number(d.totalCost || 0);
        const gainLoss  = Number(d.gainLoss || 0);
        const rate      = getInclusionRate(d.disposedAt);
        // Only gains are included; losses reduce taxable capital gains pool
        const taxable   = gainLoss >= 0
            ? gainLoss * rate
            : gainLoss * INCLUSION_PRE; // losses always at 50% deductibility

        totalProceeds    += proceeds;
        totalAcb         += acb;
        totalGainLoss    += gainLoss;
        totalTaxableGain += taxable;

        if (new Date(d.disposedAt) < INCLUSION_CUTOFF) {
            preJune25Gains += gainLoss;
        } else {
            postJune25Gains += gainLoss;
        }

        rows.push({
            "Asset":                      d.asset,
            "Date Disposed":              new Date(d.disposedAt).toISOString().split("T")[0],
            "Date Acquired":              new Date(d.acquiredAt).toISOString().split("T")[0],
            "Proceeds (C$)":              proceeds.toFixed(2),
            "ACB (C$)":                   acb.toFixed(2),
            "Capital Gain/Loss (C$)":     gainLoss.toFixed(2),
            "Inclusion Rate":             `${(rate * 100).toFixed(2)}%`,
            "Taxable Capital Gain (C$)":  taxable.toFixed(2),
        });
    }

    const summary = {
        totalProceeds:    totalProceeds.toFixed(2),
        totalAcb:         totalAcb.toFixed(2),
        totalGainLoss:    totalGainLoss.toFixed(2),
        totalTaxableGain: totalTaxableGain.toFixed(2),
        inclusionNote: "Pre-June 25 2024 gains: 50% inclusion. Post-June 25 2024 gains: 66.67% inclusion (Budget 2024).",
        breakdown: {
            preJune25Gains:  preJune25Gains.toFixed(2),
            postJune25Gains: postJune25Gains.toFixed(2),
        },
    };

    if (outputFormat === "csv") {
        const header = Object.keys(rows[0] ?? {
            "Asset": "", "Date Disposed": "", "Date Acquired": "",
            "Proceeds (C$)": "", "ACB (C$)": "", "Capital Gain/Loss (C$)": "",
            "Inclusion Rate": "", "Taxable Capital Gain (C$)": "",
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
