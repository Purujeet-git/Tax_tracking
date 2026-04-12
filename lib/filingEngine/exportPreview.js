import { generateScheduleVDA } from "@/lib/filingEngine/india/generateScheduleVDA";
import { generateForm8949 } from "@/lib/filingEngine/usa/generateForm8949";
import { generateUkCgtReport } from "@/lib/filingEngine/uk/generateUkCgtReport";
import { generateCanadaT5008Report } from "@/lib/filingEngine/canada/generateCanadaT5008Report";
import { generateAusCgtReport } from "@/lib/filingEngine/australia/generateAusCgtReport";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";

export const EXPORT_REGIONS = new Set(["INDIA", "USA", "UK", "CANADA", "AUSTRALIA"]);

export function normalizeExportRegion(region) {
    return String(region || "").trim().toUpperCase();
}

export function getExportKey({ userId, region, year }) {
    return `${userId}:${normalizeExportRegion(region)}:${Number(year)}`;
}

function calendarRange(year) {
    return {
        start: new Date(`${year}-01-01T00:00:00Z`),
        end: new Date(`${year}-12-31T23:59:59Z`),
        label: `Tax Year ${year}`,
    };
}

function rowsFromUsaReport(data) {
    const mapRow = (row, term) => Object.fromEntries(
        [...data.header, "Term"].map((header, index) => [header, index === data.header.length ? term : row[index]])
    );

    return [
        ...data.shortTerm.map((row) => mapRow(row, "Short-Term")),
        ...data.longTerm.map((row) => mapRow(row, "Long-Term")),
    ];
}

export async function buildFilingPreview({ userId, region, year }) {
    const normalizedRegion = normalizeExportRegion(region);
    const numericYear = Number(year);

    if (!EXPORT_REGIONS.has(normalizedRegion)) {
        throw new Error(`Unsupported filing region: ${region}`);
    }

    if (!Number.isInteger(numericYear) || numericYear < 2009 || numericYear > 2100) {
        throw new Error("Invalid tax year");
    }

    if (normalizedRegion === "USA") {
        const { start, end, label } = calendarRange(numericYear);
        const data = await generateForm8949({ userId, financialYearStart: start, financialYearEnd: end });
        return {
            region: normalizedRegion,
            year: numericYear,
            label,
            summary: {
                totalConsideration: data.summary.totalProceeds.toFixed(2),
                totalCost: data.summary.totalCost.toFixed(2),
                totalIncome: data.summary.totalGain.toFixed(2),
                totalStcg: data.summary.totalStcg.toFixed(2),
                totalLtcg: data.summary.totalLtcg.toFixed(2),
                washSaleCount: data.summary.washSaleCount || 0,
            },
            rows: rowsFromUsaReport(data),
        };
    }

    if (normalizedRegion === "INDIA") {
        const { start, end, label } = getTaxYearRange({ country: "INDIA", year: numericYear });
        const data = await generateScheduleVDA({
            userId,
            financialYearStart: start,
            financialYearEnd: end,
            outputFormat: "json",
        });
        return {
            region: normalizedRegion,
            year: numericYear,
            label,
            summary: {
                totalCost: data.summary.totalCost,
                totalConsideration: data.summary.totalConsideration,
                totalIncome: data.summary.totalIncome,
                totalTaxableGain: data.summary.totalTaxableGain,
                totalTds: data.summary.totalTDS,
                estimatedTaxOwed: data.summary.estimatedTaxOwed,
            },
            rows: data.rows,
        };
    }

    const rangeCountry = normalizedRegion === "UK" ? "UK" : normalizedRegion === "AUSTRALIA" ? "AUSTRALIA" : "USA";
    const { start, end, label } = normalizedRegion === "CANADA"
        ? calendarRange(numericYear)
        : getTaxYearRange({ country: rangeCountry, year: numericYear });

    const report = normalizedRegion === "UK"
        ? await generateUkCgtReport({ userId, financialYearStart: start, financialYearEnd: end })
        : normalizedRegion === "CANADA"
            ? await generateCanadaT5008Report({ userId, financialYearStart: start, financialYearEnd: end })
            : await generateAusCgtReport({ userId, financialYearStart: start, financialYearEnd: end });

    return {
        region: normalizedRegion,
        year: numericYear,
        label,
        summary: report.summary,
        rows: report.rows,
    };
}
