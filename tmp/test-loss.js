import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { getLossHarvsetingOpportunities } from "./lib/taxEngine/intelligence/lossHarvesting.js";

dotenv.config({ path: ".env.local" });

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Assume a user ID or just fetch the first user
    const db = mongoose.connection.db;
    const users = await db.collection("users").find({}).toArray();
    if (!users.length) return console.log("No users");
    
    const userId = users[0]._id.toString();
    console.log("Testing for user:", userId);

    try {
        const opps = await getLossHarvsetingOpportunities(userId);
        console.log("Opps:", opps);
    } catch (e) {
        console.error("Error:", e);
    }

    process.exit(0);
}

run();
