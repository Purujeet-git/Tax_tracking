import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import { generateUkCgtReport, UK_CGT_ANNUAL_EXEMPT } from "@/lib/filingEngine/uk/generateUkCgtReport";
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
        await requirePaidExportAccess({ userId: session.user.id, region: "UK", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const { start, end, label } = getTaxYearRange({ country: "UK", year });

    const data = await generateUkCgtReport({
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

        const tableHeader = ["Asset", "Date Disposed", "Date Acquired", "Matching Rule", "Qty Disposed", "Proceeds (£)", "Allowable Cost (£)", "Gain/(Loss) (£)"];
        const tableBody = [
            tableHeader.map(h => ({ text: h, style: "tableHeader" })),
            ...data.rows.map(r => tableHeader.map(h => ({
                text: String(r[h] ?? ""),
                fontSize: 8,
                color: parseFloat(r["Gain/(Loss) (£)"] || "0") < 0 ? "#c0392b" : "#000",
            }))),
        ];

        const netGainNum = parseFloat(s.netGain || "0");
        const gainAfterExemptNum = parseFloat(s.gainAfterExemption || "0");

        const docDefinition = {
            defaultStyle: { font: "Roboto" },
            pageOrientation: "landscape",
            pageMargins: [30, 40, 30, 40],
            content: [
                { text: "Trader OS — UK HMRC Capital Gains Tax Report", fontSize: 22, bold: true, color: "#1a1a2e", margin: [0, 0, 0, 4] },
                { text: `UK Tax Year: ${year}–${year + 1}  (6 Apr ${year} – 5 Apr ${year + 1})`, fontSize: 11, color: "#555", margin: [0, 0, 0, 20] },

                // HMRC matching rule info
                {
                    table: {
                        widths: ["*"],
                        body: [[{
                            text: [
                                { text: "ℹ  HMRC Matching Rules Applied\n", bold: true, fontSize: 11, color: "#1a52a8" },
                                {
                                    text: "• Same-Day Rule: Sales matched against purchases on the same day first.\n" +
                                        "• Bed & Breakfast Rule: Sales matched against re-purchases within 30 days.\n" +
                                        "• Section 104 Pool: Remaining disposals matched against your average pool cost.\n" +
                                        `Matching breakdown: Same-Day: ${s.matchingBreakdown.sameDay} | Bed & Breakfast: ${s.matchingBreakdown.bedAndBreakfast} | Section 104: ${s.matchingBreakdown.section104}`,
                                    fontSize: 9, color: "#1a3a6e",
                                },
                            ],
                            fillColor: "#eef4ff", margin: [10, 10, 10, 10],
                        }]],
                    },
                    layout: { hLineColor: "#3498db", vLineColor: "#3498db" },
                    margin: [0, 0, 0, 20],
                },

                // Summary tiles
                {
                    table: {
                        widths: ["*", "*", "*", "*", "*"],
                        body: [[
                            { text: `Total Proceeds\n£${s.totalProceeds}`, fillColor: "#f0f4ff", margin: [6, 10] },
                            { text: `Total Cost\n£${s.totalAllowableCost}`, fillColor: "#f0f4ff", margin: [6, 10] },
                            { text: `Net Gain/Loss\n£${s.netGain}`, fillColor: netGainNum >= 0 ? "#f0fff4" : "#fff0f0", margin: [6, 10], color: netGainNum >= 0 ? "#1e8449" : "#c0392b" },
                            { text: `Annual Exempt (2024-25)\n£${UK_CGT_ANNUAL_EXEMPT.toFixed(2)}`, fillColor: "#fffde7", margin: [6, 10] },
                            { text: `Gain After Exemption\n£${s.gainAfterExemption}`, fillColor: gainAfterExemptNum > 0 ? "#fef9e7" : "#f0fff4", bold: true, margin: [6, 10], color: gainAfterExemptNum > 0 ? "#d68910" : "#1e8449" },
                        ]],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20],
                },

                // CGT rates note
                {
                    table: {
                        widths: ["*", "*"],
                        body: [
                            [{ text: "CGT Rate — Basic Rate Taxpayer", bold: true, margin: [6, 6] }, { text: `10%  →  Estimated tax: £${s.estTaxBasicRate}`, margin: [6, 6] }],
                            [{ text: "CGT Rate — Higher/Additional Rate Taxpayer", bold: true, margin: [6, 6] }, { text: `20%  →  Estimated tax: £${s.estTaxHigherRate}`, margin: [6, 6] }],
                        ],
                    },
                    margin: [0, 0, 0, 20],
                },

                // Disposal table
                data.rows.length > 0
                    ? { table: { headerRows: 1, widths: Array(tableHeader.length).fill("auto"), body: tableBody }, layout: { fillColor: (i) => i % 2 === 0 ? null : "#f9f9f9" } }
                    : { text: "No UK CGT disposals found for this tax year.", italics: true, color: "#888" },

                // Filing instructions
                { text: "How to File: HMRC Self Assessment — Capital Gains", fontSize: 16, bold: true, pageBreak: "before", margin: [0, 0, 0, 12] },
                {
                    ol: [
                        "Login to your HMRC Government Gateway account at gov.uk/log-in-file-self-assessment-tax-return.",
                        "Complete SA100 (Self Assessment tax return) and attach the supplementary pages SA108 (Capital Gains).",
                        "On SA108, report your total gains and losses from cryptocurrency under 'Other property, assets and gains'.",
                        `Enter: Total Proceeds = £${s.totalProceeds} | Allowable Cost = £${s.totalAllowableCost} | Net Gain/Loss = £${s.netGain}`,
                        `Your Annual Exempt Amount for 2024-25 is £${UK_CGT_ANNUAL_EXEMPT.toFixed(2)}. Your taxable gain after the exempt amount is £${s.gainAfterExemption}.`,
                        "Apply the correct CGT rate based on your income tax band (10% basic rate, 20% higher/additional rate).",
                        "Capital losses can be offset against capital gains. Net losses can be carried forward to future tax years.",
                        { text: "\nNote: The CGT rates for residential property are different (18%/24%). The rates shown here apply to crypto assets.", color: "#555", italics: true },
                        { text: "\nDisclaimer: This report is algorithmic and not legal or tax advice. Consult a UK-qualified accountant or tax adviser before filing.", italics: true, color: "#777", fontSize: 9 },
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
                "Content-Disposition": `attachment; filename="UK_CGT_Report_${label}.pdf"`,
                "Content-Length": bytes.length.toString(),
            },
        });
    } catch (error) {
        console.error("UK PDF error:", error);
        return new Response("PDF Error: " + error.message, { status: 500 });
    }
}
