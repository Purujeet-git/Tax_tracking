import Disposal from "@/models/Disposal";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";
import { resolveCountryStrategy } from "../resolveCountryStrategy";

function formatDate(date) {
    return new Date(date).toISOString().split("T")[0];
}

function escapeCSV(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// India Section 115BBH: 30% flat tax + 4% health & education cess = 31.2% effective rate
// Losses from VDA cannot be set off against any income (not even other VDA gains)
const INDIA_TAX_RATE = 0.30;
const INDIA_CESS_RATE = 0.04;
const INDIA_EFFECTIVE_RATE = INDIA_TAX_RATE * (1 + INDIA_CESS_RATE); // 0.312

export async function generateScheduleVDA({
    userId,
    financialYearStart,
    financialYearEnd,
    country = "INDIA",
    headOfIncome = "VDA",
    outputFormat = "csv",
}) {
    const disposals = await Disposal.find({
        userId: new mongoose.Types.ObjectId(userId),
        disposedAt: {
            $gte: financialYearStart,
            $lte: financialYearEnd,
        },
    }).sort({ disposedAt: 1 });

    const csvRows = [];
    const jsonRows = [];

    const header = [
        "Asset",
        "Date of Acquisition",
        "Date of Transfer",
        "Head of Income",
        "Cost of Acquisition (₹)",
        "Consideration Received (₹)",
        "Income (₹)",
        "TDS u/s 194S (₹)",
        "Exchange",
        "Strategy",
        "Taxable Gain Sec.115BBH (₹)",
    ];

    csvRows.push(header.map(escapeCSV).join(","));

    // Summaries — use stable named keys throughout
    let totalCost = 0;
    let totalConsideration = 0;
    let totalIncome = 0;
    let totalTaxableGain = 0;
    let totalTDS = 0;

    for (const d of disposals) {
        const sellTx = await Transaction.findById(d.sellTransactionId);

        const cost = Number(d.totalCost || 0);
        const consideration = Number(d.proceeds || 0);
        const income = Number(d.gainLoss || 0);
        // Sec 115BBH: losses are NOT set-off — only gains count as taxable
        const taxableGain = Math.max(0, income);
        const tds = consideration * 0.01; // 1% TDS under section 194S

        totalCost += cost;
        totalConsideration += consideration;
        totalIncome += income;
        totalTaxableGain += taxableGain;
        totalTDS += tds;

        const strategyMeta = resolveCountryStrategy({ country, disposal: d });
        const strategyLabel = strategyMeta.lotSelection
            ? `${strategyMeta.method} (${strategyMeta.lotSelection})`
            : strategyMeta.method;

        const rowObj = {
            "Asset": d.asset,
            "Date of Acquisition": formatDate(d.acquiredAt),
            "Date of Transfer": formatDate(d.disposedAt),
            "Head of Income": headOfIncome,
            "Cost of Acquisition (₹)": cost.toFixed(2),
            "Consideration Received (₹)": consideration.toFixed(2),
            "Income (₹)": income.toFixed(2),
            "TDS u/s 194S (₹)": tds.toFixed(2),
            "Exchange": sellTx?.exchange || "UNKNOWN",
            "Strategy": strategyLabel,
            "Taxable Gain Sec.115BBH (₹)": taxableGain.toFixed(2),
        };

        jsonRows.push(rowObj);
        csvRows.push(header.map(h => escapeCSV(rowObj[h])).join(","));
    }

    // Estimated tax owed: 31.2% on total taxable gains only
    const estimatedTaxOwed = totalTaxableGain * INDIA_EFFECTIVE_RATE;

    if (outputFormat === "json") {
        return {
            header,
            rows: jsonRows,
            summary: {
                totalCost: totalCost.toFixed(2),
                totalConsideration: totalConsideration.toFixed(2),
                totalIncome: totalIncome.toFixed(2),
                totalTaxableGain: totalTaxableGain.toFixed(2),
                totalTDS: totalTDS.toFixed(2),
                estimatedTaxOwed: estimatedTaxOwed.toFixed(2),
            },
        };
    }

    return csvRows.join("\n");
}