import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { markPurchasePaid, verifyRazorpaySignature } from "@/lib/payments/exportAccess";

export async function POST(req) {
    try {
        await connectDB();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!verifyRazorpaySignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        })) {
            return NextResponse.json({ error: "Invalid Razorpay signature" }, { status: 400 });
        }

        await markPurchasePaid({
            provider: "RAZORPAY",
            providerSessionId: razorpay_order_id,
            providerPaymentId: razorpay_payment_id,
        });

        return NextResponse.json({ paid: true });
    } catch (e) {
        console.error("Razorpay verify error:", e);
        return NextResponse.json({ error: e.message || "Razorpay verification failed" }, { status: 500 });
    }
}
