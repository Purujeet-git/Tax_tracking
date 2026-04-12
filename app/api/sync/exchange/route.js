import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import ExchangeConnection from "@/models/ExchangeConnection";
import { decryptText } from "@/lib/utils/security";

// Exchange Router
import { ExchangeFactory } from "@/lib/exchanges/ExchangeFactory";

import { insertTransactions } from "@/lib/services/transactionService";
import { recomputeLedger } from "@/lib/taxEngine/recomputeLedger";

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { exchange } = await req.json();

        if (!exchange) {
            return NextResponse.json({ error: "Exchange identifier is required" }, { status: 400 });
        }

        // 1. Vault Lookup
        const connection = await ExchangeConnection.findOne({
            userId: session.user.id,
            exchange: exchange.toUpperCase()
        });

        if (!connection || connection.status !== "ACTIVE") {
            return NextResponse.json({ error: "No active connection found for this exchange." }, { status: 404 });
        }

        // 2. Safely Decrypt the secret in memory
        const decryptedSecret = decryptText(connection.encryptedSecret, connection.iv);

        // Decrypt passphrase if present (KuCoin)
        let decryptedPassphrase = null;
        if (connection.encryptedPassphrase && connection.passphraseIv) {
            decryptedPassphrase = decryptText(connection.encryptedPassphrase, connection.passphraseIv);
        }

        // 3 & 4. Extract and Normalize Data securely via the centralized Factory
        const normalized = await ExchangeFactory.sync(exchange, {
            apiKey: connection.apiKey,
            secret: decryptedSecret,
            passphrase: decryptedPassphrase  // null for non-KuCoin exchanges — safely ignored
        });

        if(!normalized || normalized.length === 0) {
            connection.lastSync = new Date();
            await connection.save();
            return NextResponse.json({ success: true, inserted: 0, message: "No trades found on exchange" });
        }

        // 5. Database Upsert using Bulk Operation to Prevent Duplicates (InsertMany with ordered:false achieves this against our Unique Index)
        const insertedCount = await insertTransactions({
            userId: session.user.id,
            trades: normalized
        });

        // 6. Automatically trigger intelligent tax recomputation so Dashboard updates natively
        await recomputeLedger({
            userId: session.user.id,
            strategy: "FIFO" // default localized strategy 
        });

        // 7. Update Last Sync Date
        connection.lastSync = new Date();
        await connection.save();

        return NextResponse.json({
            success: true,
            inserted: insertedCount
        });

    } catch (err) {
        console.error(`SYNC ERROR (${err.message})`, err);
        return NextResponse.json({ error: "Internal Server Error during Sync" }, { status: 500 });
    }
}
