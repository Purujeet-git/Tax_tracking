import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import { generateCanadaT5008Report } from "@/lib/filingEngine/canada/generateCanadaT5008Report";
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
        await requirePaidExportAccess({ userId: session.user.id, region: "CANADA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const { start, end, label } = getTaxYearRange({ country: "CANADA", year });

    const data = await generateCanadaT5008Report({
        userId: session.user.id,
        financialYearStart: start,
        financialYearEnd: end,
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

        const tableHeader = ["Asset", "Date Disposed", "Date Acquired", "Proceeds (C$)", "ACB (C$)", "Capital Gain/Loss (C$)", "Inclusion Rate", "Taxable Capital Gain (C$)"];
        const tableBody = [
            tableHeader.map(h => ({ text: h, style: "tableHeader" })),
            ...data.rows.map(r => tableHeader.map(h => ({
                text: String(r[h] ?? ""),
                fontSize: 8,
                color: parseFloat(r["Capital Gain/Loss (C$)"] || "0") < 0 ? "#c0392b" : "#000",
                fillColor: r["Inclusion Rate"] === "66.67%" ? "#fffde7" : null,
            }))),
        ];

        const totalGainNum = parseFloat(s.totalGainLoss || "0");

        const docDefinition = {
            defaultStyle: { font: "Roboto" },
            pageOrientation: "landscape",
            pageMargins: [30, 40, 30, 40],
            content: [
                { text: "Trader OS — Canada CRA Capital Gains Report (Schedule 3 / T5008)", fontSize: 20, bold: true, color: "#1a1a2e", margin: [0, 0, 0, 4] },
                { text: `Tax Year: ${year}  (Jan 1 – Dec 31, ${year})`, fontSize: 11, color: "#555", margin: [0, 0, 0, 20] },

                // Budget 2024 inclusion rate notice
                {
                    table: {
                        widths: ["*"],
                        body: [[{
                            text: [
                                { text: "⚠  Budget 2024 — Inclusion Rate Change\n", bold: true, fontSize: 11, color: "#b7770d" },
                                {
                                    text: "The capital gains inclusion rate changed from 50% to 2/3 (66.67%) starting June 25, 2024 (Bill C-69).\n" +
                                        "• Pre-June 25, 2024 disposals: 50% inclusion rate (yellow rows are POST-cutoff at 66.67%).\n" +
                                        `• Pre-cutoff gain/loss: C$${s.breakdown.preJune25Gains}  |  Post-cutoff gain/loss: C$${s.breakdown.postJune25Gains}\n` +
                                        "Consult your CPA regarding how to differentiate these on Schedule 3.",
                                    fontSize: 9, color: "#7b5800",
                                },
                            ],
                            fillColor: "#fffde7", margin: [10, 10, 10, 10],
                        }]],
                    },
                    layout: { hLineColor: "#f9a825", vLineColor: "#f9a825" },
                    margin: [0, 0, 0, 20],
                },

                // Summary tiles
                {
                    table: {
                        widths: ["*", "*", "*", "*"],
                        body: [[
                            { text: `Total Proceeds\nC$${s.totalProceeds}`, fillColor: "#f0f4ff", margin: [6, 10] },
                            { text: `Total ACB\nC$${s.totalAcb}`, fillColor: "#f0f4ff", margin: [6, 10] },
                            { text: `Total Capital Gain/Loss\nC$${s.totalGainLoss}`, fillColor: totalGainNum >= 0 ? "#f0fff4" : "#fff0f0", margin: [6, 10], color: totalGainNum >= 0 ? "#1e8449" : "#c0392b" },
                            { text: `Total Taxable Capital Gain\nC$${s.totalTaxableGain}`, fillColor: "#fef9e7", bold: true, margin: [6, 10], color: "#d68910" },
                        ]],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20],
                },

                // Disposal table
                data.rows.length > 0
                    ? { table: { headerRows: 1, widths: Array(tableHeader.length).fill("auto"), body: tableBody }, layout: { fillColor: (i) => i % 2 === 0 ? null : "#f9f9f9" } }
                    : { text: "No disposals found for this tax year.", italics: true, color: "#888" },

                // Filing instructions
                { text: "How to File: CRA Schedule 3 — Capital Gains (or Losses)", fontSize: 16, bold: true, pageBreak: "before", margin: [0, 0, 0, 12] },
                {
                    ol: [
                        "Login to CRA My Account at canada.ca/cra-login and file using NETFILE, or through tax software (TurboTax, UFile, SimpleTax/Wealthsimple Tax).",
                        "Complete Schedule 3 — Capital Gains (or Losses) of your T1 General return.",
                        "Report each crypto disposal. In most software, cryptocurrencies go under 'Other properties not reported elsewhere'.",
                        `Enter: Proceeds of Disposition = C$${s.totalProceeds} | Adjusted Cost Base = C$${s.totalAcb} | Total Capital Gain/Loss = C$${s.totalGainLoss}`,
                        `Taxable Capital Gain (your actual inclusion): C$${s.totalTaxableGain} — this is the amount that flows to line 12700 of your T1.`,
                        "Capital losses can be applied against capital gains. Net capital losses can be carried back 3 years or forward indefinitely.",
                        { text: "Budget 2024 split: For disposals on or after June 25, 2024, the inclusion rate is 2/3. Your tax software should handle this split automatically — verify it matches this report.", color: "#b7770d", bold: true },
                        { text: "\nDisclaimer: This report is algorithmic. The Budget 2024 inclusion rate change is subject to final parliamentary approval. Consult a CPA before filing.", italics: true, color: "#777", fontSize: 9 },
                    ],
                    fontSize: 10,
                    lineHeight: 1.5,
                },
            ],
            styles: { tableHeader: { bold: true, fontSize: 8, color: "white", fillColor: "#1a52a8" } },
        };

        const pdfDoc = pdfmake.createPdf(docDefinition);
        const buffer = await pdfDoc.getBuffer();
        const bytes = new Uint8Array(buffer);

        return new Response(bytes, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Canada_CGT_T5008_${label}.pdf"`,
                "Content-Length": bytes.length.toString(),
            },
        });
    } catch (error) {
        console.error("Canada PDF error:", error);
        return new Response("PDF Error: " + error.message, { status: 500 });
    }
}
