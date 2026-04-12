import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateScheduleVDA } from "@/lib/filingEngine/india/generateScheduleVDA";
import { getTaxYearRange } from "@/lib/filingEngine/core/getTaxYearRange";
import { connectDB } from "@/lib/db";
import { requirePaidExportAccess } from "@/lib/payments/exportAccess";
import pdfmake from "pdfmake";
import path from "path";

export async function GET(req) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year")) || 2024;
    try {
        await requirePaidExportAccess({ userId: session.user.id, region: "INDIA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const { start, end, label } = getTaxYearRange({ country: "INDIA", year });

    const data = await generateScheduleVDA({
        userId: session.user.id,
        financialYearStart: start,
        financialYearEnd: end,
        outputFormat: "json",
    });

    // Summary values — now read from stable named keys (not positional indexes)
    const s = data.summary;
    const totalCost = Number(s.totalCost);
    const totalConsideration = Number(s.totalConsideration);
    const totalIncome = Number(s.totalIncome);
    const totalTaxableGain = Number(s.totalTaxableGain);
    const totalTDS = Number(s.totalTDS);
    const estimatedTaxOwed = Number(s.estimatedTaxOwed);

    try {
        const getFontPath = (filename) =>
            path.join(process.cwd(), "node_modules", "pdfmake", "fonts", "Roboto", filename);

        pdfmake.setFonts({
            Roboto: {
                normal: getFontPath("Roboto-Regular.ttf"),
                bold: getFontPath("Roboto-Medium.ttf"),
                italics: getFontPath("Roboto-Italic.ttf"),
                bolditalics: getFontPath("Roboto-MediumItalic.ttf"),
            },
        });

        // Build table body — header + data rows
        const tableBody = [
            data.header.map((h) => ({ text: h, style: "tableHeader" })),
            ...data.rows.map((row) =>
                data.header.map((h) => ({
                    text: String(row[h] ?? ""),
                    fontSize: 7.5,
                    color: Number(row["Income (₹)"]) < 0 ? "#c0392b" : "#000000",
                }))
            ),
        ];

        const docDefinition = {
            defaultStyle: { font: "Roboto" },
            pageOrientation: "landscape",
            pageMargins: [30, 40, 30, 40],
            content: [
                // ── Title ──
                {
                    text: "Trader OS — India Schedule VDA Tax Report",
                    fontSize: 22,
                    bold: true,
                    color: "#1a1a2e",
                    margin: [0, 0, 0, 4],
                },
                {
                    text: `Financial Year: FY ${year}–${year + 1}  |  Assessment Year: AY ${year + 1}–${year + 2}`,
                    fontSize: 11,
                    color: "#555",
                    margin: [0, 0, 0, 20],
                },

                // ── Section 115BBH Warning Box ──
                {
                    table: {
                        widths: ["*"],
                        body: [[
                            {
                                text: [
                                    { text: "⚠  Section 115BBH — Important Notice\n", bold: true, fontSize: 11, color: "#c0392b" },
                                    {
                                        text: "Under Section 115BBH of the Income Tax Act, 1961:\n" +
                                            "• VDA gains are taxed at a FLAT RATE of 30% + 4% Health & Education Cess (effective 31.2%).\n" +
                                            "• Losses from transfer of VDAs CANNOT be set off against any other income (including other VDA gains).\n" +
                                            "• No deduction (other than cost of acquisition) is allowed.",
                                        fontSize: 9,
                                        color: "#7b241c",
                                    },
                                ],
                                fillColor: "#fdf2f2",
                                margin: [10, 10, 10, 10],
                            },
                        ]],
                    },
                    layout: { hLineColor: "#e74c3c", vLineColor: "#e74c3c" },
                    margin: [0, 0, 0, 20],
                },

                // ── Summary Tiles ──
                {
                    table: {
                        widths: ["*", "*", "*", "*", "*", "*"],
                        body: [[
                            { text: `Total Consideration\n₹${totalConsideration.toFixed(2)}`, fillColor: "#f0f4ff", margin: [6, 10], bold: false },
                            { text: `Cost of Acquisition\n₹${totalCost.toFixed(2)}`, fillColor: "#f0f4ff", margin: [6, 10] },
                            { text: `Net VDA Income\n₹${totalIncome.toFixed(2)}`, fillColor: totalIncome >= 0 ? "#f0fff4" : "#fff0f0", margin: [6, 10], color: totalIncome >= 0 ? "#1e8449" : "#c0392b" },
                            { text: `Taxable Gain (115BBH)\n₹${totalTaxableGain.toFixed(2)}`, fillColor: "#fffde7", margin: [6, 10] },
                            { text: `Est. Tax Liability (31.2%)\n₹${estimatedTaxOwed.toFixed(2)}`, fillColor: "#fef9e7", margin: [6, 10], bold: true, color: "#d68910" },
                            { text: `Estimated TDS (194S)\n₹${totalTDS.toFixed(2)}`, fillColor: "#f0f4ff", margin: [6, 10] },
                        ]],
                    },
                    layout: "noBorders",
                    margin: [0, 0, 0, 20],
                },

                // ── Transaction Table ──
                data.rows.length > 0
                    ? {
                        table: {
                            headerRows: 1,
                            widths: Array(data.header.length).fill("auto"),
                            body: tableBody,
                        },
                        layout: {
                            fillColor: (rowIndex) => (rowIndex % 2 === 0 ? null : "#f9f9f9"),
                        },
                    }
                    : { text: "No VDA transactions found for this financial year.", italics: true, color: "#888", margin: [0, 10] },

                // ── Filing Instructions ──
                {
                    text: "How to File: ITR Schedule VDA — Step-by-Step",
                    fontSize: 16,
                    bold: true,
                    pageBreak: "before",
                    margin: [0, 0, 0, 16],
                },
                {
                    ol: [
                        "Login to the Income Tax Portal at incometax.gov.in using your PAN credentials.",
                        "Select the ITR form applicable to your income sources — typically ITR-2 (capital gains) or ITR-3 (business income + capital gains). If you trade frequently, ITR-3 may be required.",
                        "Navigate to: Schedule VDA (Virtual Digital Assets).",
                        "For EACH row in the table above, enter:\n   • Date of Acquisition  • Date of Transfer  • Head of Income\n   • Cost of Acquisition  • Consideration Received.",
                        "The portal auto-computes 'Income from VDA'. Verify it matches the 'Income (₹)' column above.",
                        {
                            text: "LOSS RULE: If any row shows a negative Income (shown in red), it CANNOT be set off against gains from other rows or any other income source.",
                            bold: true,
                            color: "#c0392b",
                        },
                        `Your estimated total tax liability is ₹${estimatedTaxOwed.toFixed(2)} (31.2% on taxable gains of ₹${totalTaxableGain.toFixed(2)}).`,
                        "TDS (1% under Section 194S) deducted by the exchange should appear in your Form 26AS / AIS. Claim credit under 'TDS Credit' during filing.",
                        {
                            text: "\nDisclaimer: This report is generated algorithmically and does not constitute legal or tax advice. Please consult a Chartered Accountant (CA) before filing.",
                            italics: true,
                            color: "#777",
                            fontSize: 9,
                        },
                    ],
                    fontSize: 10,
                    lineHeight: 1.5,
                },
            ],
            styles: {
                tableHeader: {
                    bold: true,
                    fontSize: 8,
                    color: "white",
                    fillColor: "#1a52a8",
                },
            },
        };

        const pdfDoc = pdfmake.createPdf(docDefinition);
        const buffer = await pdfDoc.getBuffer();
        const bytes = new Uint8Array(buffer);

        return new Response(bytes, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="India_Schedule_VDA_${label}.pdf"`,
                "Content-Length": bytes.length.toString(),
            },
        });
    } catch (error) {
        console.error("India PDF generation error:", error);
        return new Response("PDF Error: " + error.message, { status: 500 });
    }
}