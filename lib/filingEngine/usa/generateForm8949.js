import Disposal from "@/models/Disposal";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";
import { identifyWashSales } from "@/lib/taxEngine/usa/washSaleRules";

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
}

/**
 * Generates IRS Form 8949 data.
 *
 * Columns per IRS spec:
 *   (a) Description of property
 *   (b) Date acquired
 *   (c) Date sold or disposed of
 *   (d) Proceeds (sales price)
 *   (e) Cost or other basis
 *   (f) Code(s) — "W" if wash sale disallowed, blank otherwise
 *   (g) Adjustment amount — disallowed loss amount (positive), blank if none
 *   (h) Gain or (loss) — after wash sale adjustments
 *
 * Short-term = held ≤ 365 days → Schedule D Part I
 * Long-term  = held >  365 days → Schedule D Part II
 */
export async function generateForm8949({
    userId,
    financialYearStart,
    financialYearEnd,
}) {
    const disposals = await Disposal.find({
        userId: new mongoose.Types.ObjectId(userId),
        disposedAt: {
            $gte: financialYearStart,
            $lte: financialYearEnd,
        },
    }).sort({ disposedAt: 1 });

    // Fetch all BUY transactions for the wash sale window (30 days before year start → 30 days after year end)
    const washWindowStart = new Date(financialYearStart.getTime() - 30 * 86400000);
    const washWindowEnd   = new Date(financialYearEnd.getTime()   + 30 * 86400000);
    const allBuyTxs = await Transaction.find({
        userId: new mongoose.Types.ObjectId(userId),
        side: "BUY",
        timestamp: { $gte: washWindowStart, $lte: washWindowEnd },
    });

    // Identify wash sales using the existing rule engine
    const washSaleMap = {};
    if (disposals.length > 0 && allBuyTxs.length > 0) {
        const washSales = identifyWashSales(disposals, allBuyTxs);
        for (const ws of washSales) {
            washSaleMap[String(ws.disposalId)] = ws;
        }
    }

    const shortTerm = [];
    const longTerm  = [];

    const summary = {
        totalProceeds: 0,
        totalCost: 0,
        totalGain: 0,
        totalStcg: 0,
        totalLtcg: 0,
        totalWashSaleDisallowed: 0,
        washSaleCount: 0,
    };

    for (const d of disposals) {
        const qty      = Number(d.quantitySold || 0);
        const desc     = `${parseFloat(qty.toFixed(8))} ${d.asset}`;
        const acquired = formatDate(d.acquiredAt);
        const disposed = formatDate(d.disposedAt);
        const proceeds = Number(d.proceeds || 0);
        const cost     = Number(d.totalCost || 0);

        // Determine holding period — fallback: compute from dates if taxCategory missing
        let isLongTerm = d.taxCategory === "LONG_TERM";
        if (!d.taxCategory && d.acquiredAt && d.disposedAt) {
            const days = (new Date(d.disposedAt) - new Date(d.acquiredAt)) / 86400000;
            isLongTerm = days > 365;
        }

        // Wash sale adjustment
        const ws = washSaleMap[String(d._id)];
        const colF = ws ? "W" : "";
        const colG = ws ? ws.disallowedLoss.toFixed(2) : "";
        // Wash sale disallowed losses are added back → the reported loss is reduced (or gain increased)
        const reportedGainLoss = ws
            ? Number(d.gainLoss || proceeds - cost) + ws.disallowedLoss
            : Number(d.gainLoss ?? (proceeds - cost));

        const rowArray = [
            desc,
            acquired,
            disposed,
            proceeds.toFixed(2),
            cost.toFixed(2),
            colF,
            colG,
            reportedGainLoss.toFixed(2),
        ];

        summary.totalProceeds += proceeds;
        summary.totalCost     += cost;
        summary.totalGain     += reportedGainLoss;
        if (ws) {
            summary.totalWashSaleDisallowed += ws.disallowedLoss;
            summary.washSaleCount++;
        }

        if (isLongTerm) {
            longTerm.push(rowArray);
            summary.totalLtcg += reportedGainLoss;
        } else {
            shortTerm.push(rowArray);
            summary.totalStcg += reportedGainLoss;
        }
    }

    return {
        header: [
            "(a) Description of property",
            "(b) Date acquired",
            "(c) Date sold",
            "(d) Proceeds ($)",
            "(e) Cost basis ($)",
            "(f) Code",
            "(g) Adjustment ($)",
            "(h) Gain/(Loss) ($)",
        ],
        shortTerm,
        longTerm,
        summary,
    };
}
