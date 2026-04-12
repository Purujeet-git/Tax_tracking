import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateForm8949 } from "@/lib/filingEngine/usa/generateForm8949";
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
        await requirePaidExportAccess({ userId: session.user.id, region: "USA", year });
    } catch (e) {
        return new Response(e.message || "Payment required", { status: e.status || 402 });
    }
    const start = new Date(`${year}-01-01T00:00:00Z`);
    const end   = new Date(`${year}-12-31T23:59:59Z`);

    const data = await generateForm8949({
        userId: session.user.id,
        financialYearStart: start,
        financialYearEnd: end,
    });

    const s = data.summary;

    function buildTransactionTable(rows, headerRow) {
        if (rows.length === 0) return null;
        return {
            table: {
                headerRows: 1,
                widths: ["*", "auto", "auto", "auto", "auto", "auto", "auto", "auto"],
                body: [
                    headerRow,
                    ...rows.map((row) => {
                        const isWashSale = row[5] === "W";
                        return row.map((cell) => ({
                            text: String(cell ?? ""),
                            fontSize: 7.5,
                            fillColor: isWashSale ? "#fff8e1" : null,
                            color: isWashSale ? "#b7770d" : "#000",
                        }));
                    }),
                ],
            },
            layout: {
                fillColor: (rowIndex) => (rowIndex % 2 === 0 ? null : "#f5f8ff"),
            },
            margin: [0, 0, 0, 15],
        };
    }

    try {
        const getFontPath = (filename) =>
            path.join(process.cwd(), "node_modules", "pdfmake", "fonts", "Roboto", filename);

        pdfmake.setFonts({
            Roboto: {
                normal:      getFontPath("Roboto-Regular.ttf"),
                bold:        getFontPath("Roboto-Medium.ttf"),
                italics:     getFontPath("Roboto-Italic.ttf"),
                bolditalics: getFontPath("Roboto-MediumItalic.ttf"),
            },
        });

        const headerRow = data.header.map((h) => ({ text: h, style: "tableHeader" }));
        const stTable = buildTransactionTable(data.shortTerm, headerRow);
        const ltTable = buildTransactionTable(data.longTerm, headerRow);

        const content = [
            // ── Title ──
            { text: "Trader OS — USA Form 8949 Crypto Tax Report", fontSize: 22, bold: true, color: "#1a1a2e", margin: [0, 0, 0, 4] },
            { text: `Tax Year: ${year}  |  Property Type: Cryptocurrency (IRS Notice 2014-21)`, fontSize: 11, color: "#555", margin: [0, 0, 0, 20] },

            // ── Wash Sale Alert (if applicable) ──
            ...(s.washSaleCount > 0 ? [{
                table: {
                    widths: ["*"],
                    body: [[{
                        text: [
                            { text: "⚠  Wash Sale Rule — IRS Section 1091\n", bold: true, fontSize: 11, color: "#b7770d" },
                            {
                                text: `${s.washSaleCount} transaction(s) (highlighted in amber) triggered the Wash Sale Rule.\n` +
                                    `Total disallowed losses: $${s.totalWashSaleDisallowed.toFixed(2)}.\n` +
                                    "These losses have been DISALLOWED and added to the cost basis of replacement shares. " +
                                    "Column (f) = 'W', Column (g) = adjustment amount. This is reflected in column (h).",
                                fontSize: 9,
                                color: "#7b5800",
                            },
                        ],
                        fillColor: "#fffde7",
                        margin: [10, 10, 10, 10],
                    }]],
                },
                layout: { hLineColor: "#f9a825", vLineColor: "#f9a825" },
                margin: [0, 0, 0, 20],
            }] : []),

            // ── Summary Tiles ──
            {
                table: {
                    widths: ["*", "*", "*", "*", "*"],
                    body: [[
                        { text: `Total Proceeds\n$${s.totalProceeds.toFixed(2)}`, fillColor: "#f0f4ff", margin: [6, 10] },
                        { text: `Total Cost Basis\n$${s.totalCost.toFixed(2)}`, fillColor: "#f0f4ff", margin: [6, 10] },
                        { text: `Short-Term Gain/Loss\n$${s.totalStcg.toFixed(2)}`, fillColor: s.totalStcg >= 0 ? "#f0fff4" : "#fff0f0", margin: [6, 10], color: s.totalStcg >= 0 ? "#1e8449" : "#c0392b" },
                        { text: `Long-Term Gain/Loss\n$${s.totalLtcg.toFixed(2)}`, fillColor: s.totalLtcg >= 0 ? "#f0fff4" : "#fff0f0", margin: [6, 10], color: s.totalLtcg >= 0 ? "#1e8449" : "#c0392b" },
                        { text: `Net Gain/Loss\n$${s.totalGain.toFixed(2)}`, fillColor: s.totalGain >= 0 ? "#eafaf1" : "#fdf2f2", bold: true, margin: [6, 10], color: s.totalGain >= 0 ? "#1a7a3a" : "#c0392b" },
                    ]],
                },
                layout: "noBorders",
                margin: [0, 0, 0, 20],
            },

            // ── Part I: Short-Term ──
            { text: "Part I — Short-Term Capital Gains and Losses", fontSize: 14, bold: true, margin: [0, 0, 0, 6], color: "#1a52a8" },
            { text: "(Assets held 1 year or less — taxed at ordinary income rates)", fontSize: 9, color: "#555", margin: [0, 0, 0, 8], italics: true },
            stTable ?? { text: "No short-term transactions this tax year.", italics: true, color: "#888", margin: [0, 0, 0, 15] },

            // ── Part II: Long-Term ──
            { text: "Part II — Long-Term Capital Gains and Losses", fontSize: 14, bold: true, margin: [0, 10, 0, 6], color: "#1a7a3a" },
            { text: "(Assets held more than 1 year — taxed at preferential rates: 0%, 15%, or 20%)", fontSize: 9, color: "#555", margin: [0, 0, 0, 8], italics: true },
            ltTable ?? { text: "No long-term transactions this tax year.", italics: true, color: "#888", margin: [0, 0, 0, 15] },

            // ── Schedule D Summary ──
            { text: "Schedule D Summary", fontSize: 16, bold: true, pageBreak: "before", margin: [0, 0, 0, 12] },
            {
                table: {
                    widths: ["*", "*", "*", "*"],
                    body: [
                        [
                            { text: "Part", bold: true, fillColor: "#1a52a8", color: "white", margin: [6, 6] },
                            { text: "Total Proceeds ($)", bold: true, fillColor: "#1a52a8", color: "white", margin: [6, 6] },
                            { text: "Total Cost Basis ($)", bold: true, fillColor: "#1a52a8", color: "white", margin: [6, 6] },
                            { text: "Net Gain/(Loss) ($)", bold: true, fillColor: "#1a52a8", color: "white", margin: [6, 6] },
                        ],
                        [
                            { text: "Part I (Short-Term)", margin: [6, 6] },
                            { text: data.shortTerm.reduce((s, r) => s + parseFloat(r[3] || 0), 0).toFixed(2), margin: [6, 6] },
                            { text: data.shortTerm.reduce((s, r) => s + parseFloat(r[4] || 0), 0).toFixed(2), margin: [6, 6] },
                            { text: s.totalStcg.toFixed(2), color: s.totalStcg >= 0 ? "#1e8449" : "#c0392b", bold: true, margin: [6, 6] },
                        ],
                        [
                            { text: "Part II (Long-Term)", margin: [6, 6] },
                            { text: data.longTerm.reduce((s, r) => s + parseFloat(r[3] || 0), 0).toFixed(2), margin: [6, 6] },
                            { text: data.longTerm.reduce((s, r) => s + parseFloat(r[4] || 0), 0).toFixed(2), margin: [6, 6] },
                            { text: s.totalLtcg.toFixed(2), color: s.totalLtcg >= 0 ? "#1e8449" : "#c0392b", bold: true, margin: [6, 6] },
                        ],
                        [
                            { text: "TOTAL (Schedule D Line 16)", bold: true, fillColor: "#f0f4ff", margin: [6, 8] },
                            { text: s.totalProceeds.toFixed(2), bold: true, fillColor: "#f0f4ff", margin: [6, 8] },
                            { text: s.totalCost.toFixed(2), bold: true, fillColor: "#f0f4ff", margin: [6, 8] },
                            { text: s.totalGain.toFixed(2), bold: true, fillColor: "#f0f4ff", color: s.totalGain >= 0 ? "#1e8449" : "#c0392b", margin: [6, 8] },
                        ],
                    ],
                },
                margin: [0, 0, 0, 20],
            },

            // ── Tax Rate Reference ──
            { text: "Applicable Tax Rates (2024)", fontSize: 13, bold: true, margin: [0, 0, 0, 8] },
            {
                table: {
                    widths: ["*", "*", "*"],
                    body: [
                        [
                            { text: "Type", bold: true, fillColor: "#eeeeee", margin: [6, 6] },
                            { text: "Rate", bold: true, fillColor: "#eeeeee", margin: [6, 6] },
                            { text: "Condition", bold: true, fillColor: "#eeeeee", margin: [6, 6] },
                        ],
                        [{ text: "Short-Term Capital Gain (STCG)", margin: [6, 5] }, { text: "Ordinary Income Rate (10%–37%)", margin: [6, 5] }, { text: "Held ≤ 1 year", margin: [6, 5] }],
                        [{ text: "Long-Term Capital Gain (LTCG) — Low bracket", margin: [6, 5] }, { text: "0%", margin: [6, 5] }, { text: "Taxable income ≤ $47,025 (single) / $94,050 (married)", margin: [6, 5] }],
                        [{ text: "Long-Term Capital Gain (LTCG) — Middle bracket", margin: [6, 5] }, { text: "15%", margin: [6, 5] }, { text: "Taxable income $47,026–$518,900 (single)", margin: [6, 5] }],
                        [{ text: "Long-Term Capital Gain (LTCG) — Upper bracket", margin: [6, 5] }, { text: "20%", margin: [6, 5] }, { text: "Taxable income > $518,900 (single)", margin: [6, 5] }],
                        [{ text: "Net Investment Income Tax (NIIT)", margin: [6, 5] }, { text: "+3.8%", margin: [6, 5] }, { text: "MAGI > $200K (single) / $250K (married)", margin: [6, 5] }],
                    ],
                },
                margin: [0, 0, 0, 24],
            },

            // ── Filing Instructions ──
            { text: "How to File: Form 8949 + Schedule D — Step-by-Step", fontSize: 14, bold: true, margin: [0, 0, 0, 10] },
            {
                ol: [
                    "IRS treats cryptocurrency as property (Notice 2014-21). Every disposal (sale, swap, spend) is a taxable event.",
                    "Transfer the totals from Part I (Short-Term) of this report to Schedule D Part I, then Part II (Long-Term) to Schedule D Part II.",
                    "The Schedule D Summary above represents your Schedule D Line 16 net total.",
                    "If you use TurboTax, TaxAct, or similar software, select 'Cryptocurrency / Virtual Currency' and choose 'Enter Summary'. Use the Part I and Part II totals from this report.",
                    "For transactions with Code W (amber rows), the disallowed loss has already been subtracted in column (h). Your tax software will accept these adjusted figures.",
                    { text: "If you have losses: Net capital losses can offset capital gains. Up to $3,000 of net capital loss per year may be deducted against ordinary income. Unused losses carry forward.", color: "#1a52a8" },
                    { text: "\nDisclaimer: This report is generated algorithmically and does not constitute legal or tax advice. Consult a CPA or Enrolled Agent before filing, especially regarding wash sale rules and NFT/DeFi treatment.", italics: true, color: "#777", fontSize: 9 },
                ],
                fontSize: 10,
                lineHeight: 1.5,
            },
        ];

        const docDefinition = {
            defaultStyle: { font: "Roboto" },
            pageOrientation: "landscape",
            pageMargins: [30, 40, 30, 40],
            content,
            styles: {
                tableHeader: { bold: true, fontSize: 8, color: "white", fillColor: "#1a52a8" },
            },
        };

        const pdfDoc = pdfmake.createPdf(docDefinition);
        const buffer = await pdfDoc.getBuffer();
        const bytes = new Uint8Array(buffer);

        return new Response(bytes, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="USA_Form8949_${year}.pdf"`,
                "Content-Length": bytes.length.toString(),
            },
        });
    } catch (error) {
        console.error("USA PDF generation error:", error);
        return new Response("PDF Error: " + error.message, { status: 500 });
    }
}
