import crypto from "crypto";
import mongoose from "mongoose";
import ExportPurchase from "@/models/ExportPurchase";
import { getExportKey, normalizeExportRegion } from "@/lib/filingEngine/exportPreview";

export function getExportPrice() {
    const amount = Number(process.env.EXPORT_PACKAGE_AMOUNT || 999);
    const currency = String(process.env.EXPORT_PACKAGE_CURRENCY || "usd").toLowerCase();
    return { amount, currency };
}

export function getAppUrl(req) {
    const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (configured) return configured.replace(/\/$/, "");
    const url = new URL(req.url);
    return `${url.protocol}//${url.host}`;
}

export async function hasPaidExportAccess({ userId, region, year }) {
    const exportKey = getExportKey({ userId, region, year });
    const purchase = await ExportPurchase.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        exportKey,
        status: "PAID",
    }).lean();

    return Boolean(purchase);
}

export async function requirePaidExportAccess({ userId, region, year }) {
    const allowed = await hasPaidExportAccess({ userId, region, year });
    if (!allowed) {
        const error = new Error("Payment required before downloading this filing package.");
        error.status = 402;
        throw error;
    }
}

export async function createPendingPurchase({ userId, region, year, provider, providerSessionId, amount, currency }) {
    return ExportPurchase.create({
        userId: new mongoose.Types.ObjectId(userId),
        region: normalizeExportRegion(region),
        year: Number(year),
        provider,
        providerSessionId,
        amount,
        currency,
        exportKey: getExportKey({ userId, region, year }),
        status: "PENDING",
    });
}

export async function markPurchasePaid({ provider, providerSessionId, providerPaymentId }) {
    const purchase = await ExportPurchase.findOneAndUpdate(
        { provider, providerSessionId },
        { status: "PAID", providerPaymentId, paidAt: new Date() },
        { new: true }
    );

    return purchase;
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;

    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(String(signature || ""));
    return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
