const { MongoClient } = require('mongodb');

// Extracting URI exactly out of user's env via require
const MONGODB_URI = "mongodb+srv://purujeetkr2005_db_user:OjeNN8ccJ6HnbVy1@cluster0.fwroyen.mongodb.net/?appName=Cluster0";

async function doSurgery() {
    console.log("Connecting database...");
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('test'); // mongoose defaults to 'test' unless specified otherwise natively

        console.log("Purging WazirX tapes...");
        const transRes = await db.collection('transactions').deleteMany({ exchange: "WAZIRX" });
        console.log(`Deleted ${transRes.deletedCount} bogus WAZIRX trades`);

        console.log("Purging engine cache...");
        await db.collection('assetlots').deleteMany({});
        await db.collection('disposals').deleteMany({});
        
        console.log("Database perfectly restored.");
    } catch(err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

doSurgery();
