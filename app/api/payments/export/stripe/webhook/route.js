import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { markPurchasePaid } from "@/lib/payments/exportAccess";

function verifyStripeSignature({ payload, signature }) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const parts = Object.fromEntries(signature.split(",").map((part) => {
        const [key, value] = part.split("=");
        return [key, value];
    }));

    if (!parts.t || !parts.v1) return false;
    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${parts.t}.${payload}`)
        .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(parts.v1);
    return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function POST(req) {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!verifyStripeSignature({ payload, signature })) {
        return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
    }

    await connectDB();
    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed" && event.data?.object?.payment_status === "paid") {
        await markPurchasePaid({
            provider: "STRIPE",
            providerSessionId: event.data.object.id,
            providerPaymentId: event.data.object.payment_intent,
        });
    }

    return NextResponse.json({ received: true });
}
