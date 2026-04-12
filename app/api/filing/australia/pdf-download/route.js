import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import { generateAusCgtReport } from "@/lib/filingEngine/australia/generateAusCgtReport";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";
import pdfmake from "pdfmake";
import path from "path";

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    try {
        await requirePaidExportAccess({ userId: session.user.id, region: "AUSTRALIA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const { start, end, label } = getTaxYearRange({ country: "AUSTRALIA", year });

    const data = await generateAusCgtReport({
        userId: session.user.id,
        financialYearStart: start,
        financialYearEnd: end,
        entityType: "INDIVIDUAL",
        outputFormat: "json",
    });
    const s = data.summary;

    try {
        const getFontPath = (f) => path.join(process.cwd(), "node_modules", "pdfmake", "fonts", "Roboto", f);
        pdfmake.setFonts({
            Roboto: {
                normal: getFontPath("Roboto-Regular.ttf"),
                bold: getFontPath("Roboto-Medium.ttf"),
                italics: getFontPath("Roboto-Italic.ttf"),
                bolditalics: getFontPath("Roboto-MediumItalic.ttf"),
            },
        });

        const tableHeader = ["Asset", "CGT Event", "Date Acquired", "Date Disposed", "Holding Days", "Cost Base (A$)", "Proceeds (A$)", "Gross Gain/Loss (A$)", "CGT Discount Eligible", "Discount Applied (A$)", "Net Taxable Gain (A$)"];
        const tableBody = [
            tableHeader.map(h => ({ text: h, style: "tableHeader" })),
            ...data.rows.map(r => tableHeader.map(h => ({
                text: String(r[h] ?? ""),
                fontSize: 7.5,
                color: parseFloat(r["Gross Gain/Loss (A$)"] || "0") < 0 ? "#c0392b" : "#000",
                fillColor: r["CGT Discount Eligible"] === "Yes (50%)" ? "#f0fff4" : null,
            }))),
        ];

        const netGainNum = parseFloat(s.netCapitalGain || "0");
        const netTaxableNum = parseFloat(s.netTaxableGain || "0");

        const docDefinition = {
            defaultStyle: { font: "Roboto" },
            pageOrientation: "landscape",
            pageMargins: [25, 40, 25, 40],
            content: [
                { text: "Trader OS — Australia ATO Capital Gains Tax Report", fontSize: 20, bold: true, color: "#1a1a2e", margin: [0, 0, 0, 4] },
                { text: `Financial Year: ${label}  (1 Jul ${year} – 30 Jun ${year + 1})  |  Entity: Individual`, fontSize: 11, color: "#555", margin: [0, 0, 0, 20] },

                // CGT discount notice
                {
                    table: {
                        widths: ["*"],
                        body: [[{
                            text: [
                                { text: "ℹ  50% CGT Discount Applied (Individuals)\n", bold: true, fontSize: 11, color: "#1e8449" },
                                {
                                    text: `${s.discountEligibleCount} disposal(s) (highlighted in green) qualify for the 50% CGT discount — assets held more than 12 months.\n` +
                                        "Capital losses are applied against gross gains BEFORE the discount is applied (ATO rule).\n" +
                                        "Note: The CGT discount is NOT available to companies or trusts.",
                                    fontSize: 9, color: "#1a5e34",
                                },
                            ],
                            fillColor: "#eafaf1", margin: [10, 10, 10, 10],
                        }]],
                    },
                    layout: { hLineColor: "#27ae60", vLineColor: "#27ae60" },
                    margin: [0, 0, 0, 20],
                },

                // Summary tiles
                {
                    table: {
                        widths: ["*", "*", "*", "*", "*", "*"],
                        body: [[
                            { text: `Total Proceeds\nA$${s.totalProceeds}`, fillColor: "#f0f4ff", margin: [6, 10] },
                            { text: `Total Cost Base\nA$${s.totalCostBase}`, fillColor: "#f0f4ff", margin: [6, 10] },
                            { text: `Gross Gain\nA$${s.totalGrossGain}`, fillColor: "#f0fff4", margin: [6, 10], color: "#1e8449" },
                            { text: `Gross Loss\nA$${s.totalGrossLoss}`, fillColor: "#fff0f0", margin: [6, 10], color: "#c0392b" },
                            { text: `CGT Discount\nA$${s.totalDiscountApplied}`, fillColor: "#eafaf1", margin: [6, 10] },
                            { text: `Net Taxable Gain\nA$${s.netTaxableGain}`, fillColor: netTaxableNum > 0 ? "#fef9e7" : "#f0fff4", bold: true, margin: [6, 10], color: netTaxableNum > 0 ? "#d68910" : "#1e8449" },
                        ]],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20],
                },

                // Disposal table
                data.rows.length > 0
                    ? { table: { headerRows: 1, widths: Array(tableHeader.length).fill("auto"), body: tableBody }, layout: { fillColor: (i) => i % 2 === 0 ? null : "#f9f9f9" } }
                    : { text: "No Australian CGT events found for this financial year.", italics: true, color: "#888" },

                // Filing instructions
                { text: "How to File: ATO myTax — Capital Gains (Crypto)", fontSize: 16, bold: true, pageBreak: "before", margin: [0, 0, 0, 12] },
                {
                    ol: [
                        "Lodge via the ATO's myTax at my.gov.au (link your myGov account to the ATO). Alternatively use a registered tax agent.",
                        "In myTax, select 'Capital gains or losses' and choose 'Other capital gains and losses' for cryptocurrency.",
                        "Cryptocurrency is treated as a CGT asset under ITAA97. Every disposal (sale, trade, spend, gift, swap) is a CGT event.",
                        `Enter: Total Capital Proceeds = A$${s.totalProceeds} | Total Cost Base = A$${s.totalCostBase} | Net Capital Gain = A$${s.netCapitalGain}`,
                        `After applying the 50% CGT discount to eligible disposals, your net taxable capital gain is A$${s.netTaxableGain}.`,
                        "Capital losses reduce your gross gains before the discount is applied. Net capital losses can be carried forward indefinitely.",
                        { text: "⚠  The CGT discount is NOT available if the asset is held as part of a business or if you are a company/trust. Individual filers only.", color: "#c0392b" },
                        "Your net taxable capital gain flows to the 'Income from capital gains' section on your tax return.",
                        { text: "\nDisclaimer: This report assumes individual (not company/trust) filing. Consult a registered tax agent before lodging your ATO return.", italics: true, color: "#777", fontSize: 9 },
                    ],
                    fontSize: 10,
                    lineHeight: 1.5,
                },
            ],
            styles: { tableHeader: { bold: true, fontSize: 7.5, color: "white", fillColor: "#1a52a8" } },
        };

        const pdfDoc = pdfmake.createPdf(docDefinition);
        const buffer = await pdfDoc.getBuffer();
        const bytes = new Uint8Array(buffer);

        return new Response(bytes, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="AUS_CGT_Report_${label}.pdf"`,
                "Content-Length": bytes.length.toString(),
            },
        });
    } catch (error) {
        console.error("Australia PDF error:", error);
        return new Response("PDF Error: " + error.message, { status: 500 });
    }
}
