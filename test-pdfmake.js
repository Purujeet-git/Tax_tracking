const PdfPrinter = require('pdfmake');
const fs = require('fs');

const fonts = {
    Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

try {
    const printer = new PdfPrinter(fonts);
    const docDefinition = {
        defaultStyle: { font: 'Helvetica' },
        content: [ 'Trader OS Test PDF Document via pdfmake' ]
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    let chunks = [];
    pdfDoc.on('data', c => chunks.push(c));
    pdfDoc.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync("test2.pdf", buf);
        console.log("PDF created successfully, size:", buf.length);
    });
    pdfDoc.on('error', e => console.error("Stream Error", e));
    pdfDoc.end();
} catch (e) {
    console.error("Crash", e);
}
