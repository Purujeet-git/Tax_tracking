import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import ExchangeConnection from "@/models/ExchangeConnection";
import { encryptText } from "@/lib/utils/security";

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { exchange, apiKey, secret, passphrase } = await req.json();

        if (!exchange || !apiKey || !secret) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
        }

        // Encrypt the Master Secret Securely
        const { encryptedSecret, iv } = encryptText(secret);

        // Encrypt the Passphrase if provided (required for KuCoin)
        let encryptedPassphrase = null;
        let passphraseIv = null;
        if (passphrase) {
            const encryptedPP = encryptText(passphrase);
            encryptedPassphrase = encryptedPP.encryptedSecret;
            passphraseIv = encryptedPP.iv;
        }

        // Upsert the connection logic
        await ExchangeConnection.findOneAndUpdate(
            { userId: session.user.id, exchange },
            {
                apiKey,
                encryptedSecret,
                iv,
                encryptedPassphrase,
                passphraseIv,
                status: "ACTIVE"
            },
            { upsert: true, returnDocument: "after" }
        );

        return NextResponse.json({ success: true, message: "Credentials Secured" });

    } catch (err) {
        console.error("Exchange Connection Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Retrieve existing definitions, excluding Secrets and IVs
        const connections = await ExchangeConnection.find({ userId: session.user.id }).select(
            "exchange apiKey status lastSync updatedAt"
        );

        return NextResponse.json({ success: true, connections });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const exchange = url.searchParams.get("exchange");

        if (!exchange) {
            return NextResponse.json({ error: "Missing exchange parameter" }, { status: 400 });
        }

        await ExchangeConnection.findOneAndDelete({
            userId: session.user.id,
            exchange: exchange
        });

        // Optional: If they want to also delete historic trades, that would be done here
        // await Transaction.deleteMany({ userId: session.user.id, exchange: exchange });

        return NextResponse.json({ success: true, message: `Purged ${exchange} connection credentials securely.` });
    } catch (err) {
        console.error("Exchange Deletion Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
