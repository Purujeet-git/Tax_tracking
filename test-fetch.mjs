import fs from 'fs';

async function run() {
    console.log("Fetching PDF...");
    const res = await fetch("http://localhost:3000/api/filing/india/pdf-download?year=2024");
    console.log("Status:", res.status, res.statusText);
    const contentType = res.headers.get("content-type");
    console.log("Content-Type:", contentType);
    
    const buffer = await res.arrayBuffer();
    fs.writeFileSync("downloaded-test.pdf", Buffer.from(buffer));
    console.log("Saved downloaded-test.pdf size:", buffer.byteLength);

    if (contentType.includes("text/html") || buffer.byteLength < 1000) {
        console.log("Content of error file:", Buffer.from(buffer).toString('utf-8').substring(0, 1000));
    }
}
run();
