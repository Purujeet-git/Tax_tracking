import Disposal from "@/models/Disposal";
import mongoose from "mongoose";

/**
 * Australia ATO CGT Report — CGT Event A1
 *
 * Rules (for INDIVIDUALS filing as Australian residents):
 *   • Tax year: Jul 1 → Jun 30
 *   • Strategy: FIFO (most common; ATO doesn't mandate a specific method)
 *   • CGT Discount: 50% discount applied to capital gains where the asset
 *     was held for MORE than 12 months (365 days) — for individuals only.
 *   • Capital losses are NOT discounted — they offset gross gains first.
 *   • Carrying forward losses: Net capital losses carry forward indefinitely.
 */

const CGT_DISCOUNT_RATE          = 0.50;  // 50% CGT discount for individuals
const CGT_DISCOUNT_MIN_HOLD_DAYS = 365;

export async function generateAusCgtReport({
    userId,
    financialYearStart,
    financialYearEnd,
    entityType = "INDIVIDUAL",  // INDIVIDUAL | COMPANY | TRUST
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
    let totalProceeds           = 0;
    let totalCostBase            = 0;
    let totalGrossGain           = 0;
    let totalGrossLoss           = 0;
    let totalDiscountApplied     = 0;
    let totalNetTaxableGain      = 0;
    let discountEligibleCount    = 0;

    for (const d of disposals) {
        const proceeds  = Number(d.proceeds || 0);
        const costBase  = Number(d.totalCost || 0);
        const gainLoss  = Number(d.gainLoss || 0);
        const holdDays  = Number(d.holdingDays || 0);

        const isGain             = gainLoss > 0;
        const discountEligible   = isGain && entityType === "INDIVIDUAL" && holdDays > CGT_DISCOUNT_MIN_HOLD_DAYS;
        const discountAmount     = discountEligible ? gainLoss * CGT_DISCOUNT_RATE : 0;
        const netTaxableAmount   = isGain ? gainLoss - discountAmount : gainLoss; // losses not discounted

        totalProceeds          += proceeds;
        totalCostBase          += costBase;
        if (isGain) totalGrossGain   += gainLoss;
        else        totalGrossLoss   += gainLoss;
        totalDiscountApplied   += discountAmount;
        totalNetTaxableGain    += netTaxableAmount;
        if (discountEligible) discountEligibleCount++;

        rows.push({
            "Asset":                   d.asset,
            "CGT Event":               "A1 (Disposal)",
            "Date Acquired":           new Date(d.acquiredAt).toISOString().split("T")[0],
            "Date Disposed":           new Date(d.disposedAt).toISOString().split("T")[0],
            "Holding Days":            holdDays.toFixed(0),
            "Cost Base (A$)":          costBase.toFixed(2),
            "Proceeds (A$)":           proceeds.toFixed(2),
            "Gross Gain/Loss (A$)":    gainLoss.toFixed(2),
            "CGT Discount Eligible":   discountEligible ? "Yes (50%)" : "No",
            "Discount Applied (A$)":   discountAmount.toFixed(2),
            "Net Taxable Gain (A$)":   netTaxableAmount.toFixed(2),
        });
    }

    // Net capital gain = gross gains - gross losses (ATO requires losses offset gains first before discount)
    const netCapitalGain = totalGrossGain + totalGrossLoss; // totalGrossLoss is negative
    const netAfterDiscount = netCapitalGain > 0
        ? Math.max(0, netCapitalGain - totalDiscountApplied)
        : netCapitalGain;

    const summary = {
        totalProceeds:          totalProceeds.toFixed(2),
        totalCostBase:          totalCostBase.toFixed(2),
        totalGrossGain:         totalGrossGain.toFixed(2),
        totalGrossLoss:         totalGrossLoss.toFixed(2),
        netCapitalGain:         netCapitalGain.toFixed(2),
        totalDiscountApplied:   totalDiscountApplied.toFixed(2),
        netTaxableGain:         netAfterDiscount.toFixed(2),
        discountEligibleCount,
        entityType,
        entityNote: entityType === "INDIVIDUAL"
            ? "50% CGT discount applied for assets held >12 months."
            : "CGT discount is NOT available for companies or trusts.",
    };

    if (outputFormat === "csv") {
        const header = Object.keys(rows[0] ?? {});
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
