import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { buildFilingPreview, normalizeExportRegion } from "@/lib/filingEngine/exportPreview";
import { createPendingPurchase, getAppUrl, getExportPrice, hasPaidExportAccess } from "@/lib/payments/exportAccess";

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

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: "Stripe is not configured. Set STRIPE_SECRET_KEY." }, { status: 500 });
        }

        const appUrl = getAppUrl(req);
        const { amount, currency } = getExportPrice();
        const body = new URLSearchParams({
            mode: "payment",
            success_url: `${appUrl}/dashboard/filing-center?payment=stripe_success&region=${normalizedRegion}&year=${Number(year)}`,
            cancel_url: `${appUrl}/dashboard/filing-center?payment=cancelled&region=${normalizedRegion}&year=${Number(year)}`,
            "line_items[0][price_data][currency]": currency,
            "line_items[0][price_data][product_data][name]": `${normalizedRegion} filing export package ${year}`,
            "line_items[0][price_data][unit_amount]": String(amount),
            "line_items[0][quantity]": "1",
            "metadata[region]": normalizedRegion,
            "metadata[year]": String(Number(year)),
            "metadata[userId]": session.user.id,
        });

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        const stripeSession = await stripeRes.json();
        if (!stripeRes.ok) {
            return NextResponse.json({ error: stripeSession.error?.message || "Stripe checkout failed" }, { status: 502 });
        }

        await createPendingPurchase({
            userId: session.user.id,
            region: normalizedRegion,
            year,
            provider: "STRIPE",
            providerSessionId: stripeSession.id,
            amount,
            currency,
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (e) {
        console.error("Stripe checkout error:", e);
        return NextResponse.json({ error: e.message || "Stripe checkout failed" }, { status: 500 });
    }
}
