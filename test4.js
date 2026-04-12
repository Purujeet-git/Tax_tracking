const pdfmake = require('pdfmake');
const path = require('path');

const getFontPath = (filename) => path.join(__dirname, "node_modules", "pdfmake", "fonts", "Roboto", filename);

pdfmake.setFonts({
    Roboto: {
        normal: getFontPath("Roboto-Regular.ttf"),
        bold: getFontPath("Roboto-Medium.ttf"),
        italics: getFontPath("Roboto-Italic.ttf"),
        bolditalics: getFontPath("Roboto-MediumItalic.ttf")
    }
});

async function run() {
    try {
        const doc = pdfmake.createPdf({
            content: ['Trader OS PDF'],
            defaultStyle: { font: 'Roboto' }
        });
        const buffer = await doc.getBuffer();
        console.log("Success! size:", buffer.length);
    } catch (e) {
        console.error("FAIL", e);
    }
}
run();
