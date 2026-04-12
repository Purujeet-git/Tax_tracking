import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { buildFilingPreview, normalizeExportRegion } from "@/lib/filingEngine/exportPreview";
import { createPendingPurchase, getExportPrice, hasPaidExportAccess } from "@/lib/payments/exportAccess";

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { region, year } = await req.json();
        const normalizedRegion = normalizeExportRegion(region);
        await buildFilingPreview({ userId: session.user.id, region: normalizedRegion, year });

        if (await hasPaidExportAccess({ userId: session.user.id, region: normalizedRegion, year })) {
            return NextResponse.json({ paid: true });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({ error: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." }, { status: 500 });
        }

        const price = getExportPrice();
        const currency = String(process.env.RAZORPAY_CURRENCY || price.currency || "INR").toUpperCase();
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
        const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount: price.amount,
                currency,
                receipt: `${normalizedRegion}-${Number(year)}-${Date.now()}`.slice(0, 40),
                notes: {
                    region: normalizedRegion,
                    year: String(Number(year)),
                    userId: session.user.id,
                },
            }),
        });

        const order = await orderRes.json();
        if (!orderRes.ok) {
            return NextResponse.json({ error: order.error?.description || "Razorpay order failed" }, { status: 502 });
        }

        await createPendingPurchase({
            userId: session.user.id,
            region: normalizedRegion,
            year,
            provider: "RAZORPAY",
            providerSessionId: order.id,
            amount: price.amount,
            currency,
        });

        return NextResponse.json({
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            name: `${normalizedRegion} filing export package ${year}`,
        });
    } catch (e) {
        console.error("Razorpay order error:", e);
        return NextResponse.json({ error: e.message || "Razorpay order failed" }, { status: 500 });
    }
}
